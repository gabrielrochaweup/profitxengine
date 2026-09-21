-- ─────────────────────────────────────────────────────────────────────────
-- Tracking Kit — leitura
--
-- Três funções, e nenhuma delas conhece o nome de uma etapa sua.
--
-- No projeto de origem o relatório era uma tabela LARGA: uma coluna por
-- etapa (purchases, contracts_signed, members_access, broker_signups…).
-- Cada etapa nova era uma coluna nova, em dois blocos que precisavam casar
-- por posição num UNION ALL — e uma coluna fora de ordem colocava o número
-- de contratos dentro de outro indicador, sem erro de sintaxe pra denunciar.
--
-- Aqui o relatório é ESTREITO: uma linha por (origem, campanha, etapa). A
-- tela pivota como quiser, e acrescentar etapa no config não mexe em SQL.
--
-- A distinção que atravessa tudo: PESSOAS ≠ EVENTOS. "Acessou o produto"
-- acontece centenas de vezes pra mesma pessoa; dividir eventos de uma etapa
-- pelos leads de outra produz conversões de 3.561%. Toda função devolve as
-- duas contagens e deixa a tela escolher — nunca inventa a que falta.
-- ─────────────────────────────────────────────────────────────────────────

-- ── Relatório principal ──────────────────────────────────────────────────
--
-- Uma linha por (origem, campanha, etapa) no período. Com isso a tela monta
-- funil, matriz de origem, totais do dia e comparação com ontem — sem uma
-- consulta por pergunta.
drop function if exists public.tracking_relatorio(uuid, timestamptz, timestamptz);

create function public.tracking_relatorio(
  p_workspace_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  utm_source text,
  utm_campaign text,
  event_type text,
  pessoas bigint,
  eventos bigint,
  valor_cents bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.tracking_pode_ver(p_workspace_id) then
    raise exception 'Sem acesso a esse workspace.';
  end if;

  return query
    with lead_origem as (
      select
        l.id as lead_id,
        coalesce(l.utm_source, '(direto)') as utm_source,
        coalesce(l.utm_campaign, '(sem campanha)') as utm_campaign
      from tracking_leads l
      where l.workspace_id = p_workspace_id
    ),
    -- Eventos que a atribuição ligou a um lead: dá pra contar gente.
    com_lead as (
      select
        lo.utm_source,
        lo.utm_campaign,
        e.event_type,
        count(distinct e.lead_id)::bigint as pessoas,
        count(*)::bigint as eventos,
        coalesce(sum(e.amount_cents), 0)::bigint as valor_cents
      from tracking_events e
      join lead_origem lo on lo.lead_id = e.lead_id
      where e.workspace_id = p_workspace_id
        and e.occurred_at >= p_from
        and e.occurred_at <= p_to
      group by 1, 2, 3
    ),
    -- Evento que chegou sem lead casado. Conta como atividade e NÃO vira
    -- pessoa: zero aqui é a resposta honesta, não sabemos quem é. A origem
    -- sai do próprio payload quando a plataforma mandou uma, senão cai no
    -- balde único.
    sem_lead as (
      select
        coalesce(e.raw_payload ->> 'utm_source', '(não atribuído)') as utm_source,
        coalesce(e.raw_payload ->> 'utm_campaign', '(não atribuído)') as utm_campaign,
        e.event_type,
        0::bigint as pessoas,
        count(*)::bigint as eventos,
        coalesce(sum(e.amount_cents), 0)::bigint as valor_cents
      from tracking_events e
      where e.workspace_id = p_workspace_id
        and e.lead_id is null
        and e.occurred_at >= p_from
        and e.occurred_at <= p_to
      group by 1, 2, 3
    )
    select * from com_lead
    union all
    select * from sem_lead;
end;
$$;

grant execute on function public.tracking_relatorio(uuid, timestamptz, timestamptz) to authenticated;

-- ── Quando acontece ──────────────────────────────────────────────────────
--
-- Os mesmos dois gráficos (por hora, por dia da semana) respondem sobre
-- qualquer etapa: a métrica é um seletor na tela, não uma função por
-- pergunta. O fuso é parâmetro porque "vendeu às 20h" é 20h no relógio de
-- quem vende, e o kit não sabe onde seu time está.
drop function if exists public.tracking_por_horario(uuid, timestamptz, timestamptz, text);

create function public.tracking_por_horario(
  p_workspace_id uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_fuso text default 'UTC'
)
returns table (
  utm_source text,
  event_type text,
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
  if not public.tracking_pode_ver(p_workspace_id) then
    raise exception 'Sem acesso a esse workspace.';
  end if;

  return query
    select
      coalesce(l.utm_source, coalesce(e.raw_payload ->> 'utm_source', '(não atribuído)')) as utm_source,
      e.event_type,
      extract(dow from e.occurred_at at time zone p_fuso)::smallint as weekday,
      extract(hour from e.occurred_at at time zone p_fuso)::smallint as hour,
      count(*)::bigint as total
    from tracking_events e
    left join tracking_leads l on l.id = e.lead_id
    where e.workspace_id = p_workspace_id
      and e.occurred_at >= p_from
      and e.occurred_at <= p_to
    group by 1, 2, 3, 4;
end;
$$;

grant execute on function public.tracking_por_horario(uuid, timestamptz, timestamptz, text) to authenticated;

-- ── A jornada de cada pessoa ─────────────────────────────────────────────
--
-- Responde "quem chegou até onde", que é de onde saem as filas de cobrança:
-- comprou e não acessou, acessou e não renovou, e assim por diante.
--
-- No projeto de origem isso era um scan paginado em TypeScript relendo o
-- payload de cada evento — funcionava com centenas de linhas e não ia
-- sobreviver a milhares. Aqui é uma consulta, e o resultado é genérico: um
-- jsonb com o que a pessoa fez em cada etapa, sem o kit saber quais são.
--
-- A chave da pessoa é o e-mail. É a única identidade que atravessa
-- plataformas diferentes — e é por isso que quem comprou com um e-mail e
-- acessou com outro aparece como duas pessoas. A tela precisa dizer isso.
drop function if exists public.tracking_pessoas(uuid, timestamptz, timestamptz);

create function public.tracking_pessoas(
  p_workspace_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  email text,
  nome text,
  phone text,
  utm_source text,
  etapas jsonb,
  primeira_em timestamptz,
  ultima_em timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.tracking_pode_ver(p_workspace_id) then
    raise exception 'Sem acesso a esse workspace.';
  end if;

  return query
    with eventos as (
      select
        lower(trim(e.email)) as email,
        e.event_type,
        e.name,
        e.phone,
        e.lead_id,
        e.amount_cents,
        e.occurred_at
      from tracking_events e
      where e.workspace_id = p_workspace_id
        and e.email is not null
        and trim(e.email) <> ''
        and e.occurred_at >= p_from
        and e.occurred_at <= p_to
    ),
    por_etapa as (
      select
        ev.email,
        ev.event_type,
        count(*)::bigint as eventos,
        coalesce(sum(ev.amount_cents), 0)::bigint as valor_cents,
        min(ev.occurred_at) as primeiro,
        max(ev.occurred_at) as ultimo
      from eventos ev
      group by 1, 2
    ),
    identidade as (
      -- O nome e o telefone mais recentes que algum evento trouxe: a
      -- plataforma de checkout costuma mandar os dois, a área de produto
      -- quase nunca.
      select distinct on (ev.email)
        ev.email,
        ev.name as nome,
        ev.phone,
        ev.lead_id
      from eventos ev
      where ev.name is not null or ev.phone is not null
      order by ev.email, ev.occurred_at desc
    )
    select
      pe.email,
      coalesce(id.nome, '') as nome,
      coalesce(id.phone, '') as phone,
      coalesce(l.utm_source, '(direto)') as utm_source,
      jsonb_object_agg(
        pe.event_type,
        jsonb_build_object(
          'eventos', pe.eventos,
          'valor_cents', pe.valor_cents,
          'primeiro', pe.primeiro,
          'ultimo', pe.ultimo
        )
      ) as etapas,
      min(pe.primeiro) as primeira_em,
      max(pe.ultimo) as ultima_em
    from por_etapa pe
    left join identidade id on id.email = pe.email
    left join tracking_leads l on l.id = id.lead_id
    group by pe.email, id.nome, id.phone, l.utm_source;
end;
$$;

grant execute on function public.tracking_pessoas(uuid, timestamptz, timestamptz) to authenticated;
