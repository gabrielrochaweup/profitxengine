-- Duas leituras novas pro painel. Nada é gravado, nada existente muda.
--
-- POR QUE: o relatório de campanha conta EVENTOS em todas as etapas menos
-- "leads" (lá é `count(distinct lead_id)`). Isso está certo pra responder
-- "quantas compras aconteceram" e "quanto foi depositado", e é o que os
-- cartões de KPI mostram. Só que, num FUNIL, ler evento como se fosse
-- pessoa produz besteira: 7.870 acessos à área de membros dividido por 221
-- leads dá "3.561% de conversão". Não é que o número esteja errado — é que
-- ele responde outra pergunta.
--
-- Então o funil passa a ter a sua própria leitura: quantas PESSOAS distintas
-- chegaram em cada etapa, com a contagem de eventos ao lado. As duas
-- convivem na tela, cada uma dizendo o que é.
--
-- A regra de origem é a mesma do tracking_campaign_report, de propósito: o
-- lead manda o utm_source (nulo vira '(direto)'), e evento sem lead cai no
-- utm_source do payload ou em '(não atribuído)'. Sem isso, o filtro de fonte
-- recortaria universos diferentes no funil e na tabela.

drop function if exists public.tracking_funil_pessoas(uuid, timestamptz, timestamptz);

create function public.tracking_funil_pessoas(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  utm_source text,
  etapa text,
  pessoas bigint,
  eventos bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.has_product_access(p_product_id) then
    raise exception 'Sem acesso a esse produto.';
  end if;

  return query
    with lead_origem as (
      select
        l.id as lead_id,
        coalesce(l.utm_source, '(direto)') as utm_source,
        l.first_seen_at
      from tracking_leads l
      where l.product_id = p_product_id
    ),
    -- Etapa 1. Aqui pessoa e "evento" são a mesma coisa: um lead é uma
    -- pessoa, não uma ocorrência.
    etapa_lead as (
      select
        lo.utm_source,
        'lead'::text as etapa,
        count(distinct lo.lead_id)::bigint as pessoas,
        count(distinct lo.lead_id)::bigint as eventos
      from lead_origem lo
      where lo.first_seen_at >= p_from and lo.first_seen_at <= p_to
      group by 1
    ),
    -- Demais etapas, para eventos que a atribuição conseguiu ligar a um
    -- lead: dá pra contar gente.
    etapas_com_lead as (
      select
        lo.utm_source,
        e.event_type as etapa,
        count(distinct e.lead_id)::bigint as pessoas,
        count(*)::bigint as eventos
      from tracking_events e
      join lead_origem lo on lo.lead_id = e.lead_id
      where e.product_id = p_product_id
        and e.occurred_at >= p_from
        and e.occurred_at <= p_to
      group by 1, 2
    ),
    -- Evento que chegou sem lead: existe, conta como atividade, e NÃO vira
    -- pessoa. Zero aqui é a resposta honesta — não sabemos quem é.
    etapas_sem_lead as (
      select
        coalesce(e.raw_payload ->> 'utm_source', '(não atribuído)') as utm_source,
        e.event_type as etapa,
        0::bigint as pessoas,
        count(*)::bigint as eventos
      from tracking_events e
      where e.product_id = p_product_id
        and e.lead_id is null
        and e.occurred_at >= p_from
        and e.occurred_at <= p_to
      group by 1, 2
    )
    select * from etapa_lead
    union all
    select * from etapas_com_lead
    union all
    select * from etapas_sem_lead;
end;
$$;

grant execute on function public.tracking_funil_pessoas(uuid, timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------

-- "Quando os resultados acontecem" para QUALQUER etapa, não só compra.
--
-- Já existia tracking_sales_by_time, que cobre compra e só compra. Os mesmos
-- dois gráficos (por hora e por dia da semana) respondem perguntas
-- diferentes trocando a métrica — e criar uma função por métrica seria a
-- quarta cópia do mesmo select. O utm_source vem junto pro filtro de fonte
-- valer aqui também, o que a função antiga não permitia.
--
-- Fuso de Brasília, igual à função antiga: "vendeu às 20h" é 20h no relógio
-- de quem vende, não em UTC.

drop function if exists public.tracking_atividade_por_horario(uuid, timestamptz, timestamptz);

create function public.tracking_atividade_por_horario(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  utm_source text,
  etapa text,
  weekday smallint,
  hour smallint,
  total bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.has_product_access(p_product_id) then
    raise exception 'Sem acesso a esse produto.';
  end if;

  return query
    with lead_origem as (
      select
        l.id as lead_id,
        coalesce(l.utm_source, '(direto)') as utm_source,
        l.first_seen_at
      from tracking_leads l
      where l.product_id = p_product_id
    ),
    leads_hora as (
      select
        lo.utm_source,
        'lead'::text as etapa,
        extract(dow from lo.first_seen_at at time zone 'America/Sao_Paulo')::smallint as weekday,
        extract(hour from lo.first_seen_at at time zone 'America/Sao_Paulo')::smallint as hour,
        count(*)::bigint as total
      from lead_origem lo
      where lo.first_seen_at >= p_from and lo.first_seen_at <= p_to
      -- Sem a coluna 2 no group by: ela é a constante 'lead', não um
      -- agrupamento — e constante em group by posicional é pedir confusão.
      group by 1, 3, 4
    ),
    eventos_hora as (
      select
        coalesce(lo.utm_source, coalesce(e.raw_payload ->> 'utm_source', '(não atribuído)')) as utm_source,
        e.event_type as etapa,
        extract(dow from e.occurred_at at time zone 'America/Sao_Paulo')::smallint as weekday,
        extract(hour from e.occurred_at at time zone 'America/Sao_Paulo')::smallint as hour,
        count(*)::bigint as total
      from tracking_events e
      left join lead_origem lo on lo.lead_id = e.lead_id
      where e.product_id = p_product_id
        and e.occurred_at >= p_from
        and e.occurred_at <= p_to
      group by 1, 2, 3, 4
    )
    select * from leads_hora
    union all
    select * from eventos_hora;
end;
$$;

grant execute on function public.tracking_atividade_por_horario(uuid, timestamptz, timestamptz) to authenticated;
