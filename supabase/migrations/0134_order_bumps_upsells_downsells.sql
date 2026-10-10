-- Order bumps, upsells e downsells: cada item de um pedido passa a ser
-- identificado, e "compra" volta a significar PEDIDO.
--
-- O PROBLEMA: a Onprofit manda um webhook por item. Um pedido com o Starter
-- (R$ 77) e dois order bumps (R$ 37 cada) chegava como TRÊS compras no mesmo
-- segundo, as três com o nome "Método TRIAD - Starter". Na tela, "R$ 37" na
-- lista parecia o plano, e o painel contava 3 compras de um pedido só (CPA
-- menor do que o real). Dos 29 eventos de compra já gravados, 24 são pedidos
-- e 5 são order bumps.
--
-- O QUE MUDA:
--   * tracking_events ganha 4 colunas: item_tipo, item_nome, pedido_id e
--     pedido_total_cents (o total do pagamento, todos os itens somados).
--   * As compras já gravadas da Onprofit são preenchidas a partir do payload
--     cru que está guardado em raw_payload. Nada é apagado nem alterado além
--     dessas 4 colunas.
--   * COMPRAS (pedidos) passam a contar só o item principal; a RECEITA
--     continua somando todos os itens (o dinheiro entrou). Item sem
--     item_tipo (Hotmart, TorkPay, qualquer outro) vale como principal.
--   * Funções recriadas, só com essa diferença: tracking_campaign_report,
--     tracking_sales_by_offer (item extra vira linha própria),
--     tracking_sales_by_payment_method, tracking_sales_by_page_type,
--     tracking_sales_by_channel, tracking_sales_by_time,
--     tracking_funil_pessoas e tracking_atividade_por_horario.
--   * Função nova: tracking_itens_vendidos.
--
-- Tipos de item: 'front' (produto principal), 'order_bump', 'upsell',
-- 'downsell'. Qualquer outro texto que a Onprofit mandar é guardado como veio
-- e conta como item extra, nunca como compra principal.

alter table tracking_events add column if not exists item_tipo text;
alter table tracking_events add column if not exists item_nome text;
alter table tracking_events add column if not exists pedido_id text;
alter table tracking_events add column if not exists pedido_total_cents bigint;

create index if not exists idx_tracking_events_pedido
  on tracking_events (product_id, pedido_id)
  where pedido_id is not null;

-- Preenche o que já existe, a partir do payload da Onprofit.
update tracking_events e
set
  item_tipo = case
    when lower(e.raw_payload ->> 'item_type') in ('product', 'main', 'front') then 'front'
    when lower(e.raw_payload ->> 'item_type') like '%bump%' then 'order_bump'
    when lower(e.raw_payload ->> 'item_type') like '%upsell%' then 'upsell'
    when lower(e.raw_payload ->> 'item_type') like '%downsell%' then 'downsell'
    else lower(e.raw_payload ->> 'item_type')
  end,
  item_nome = nullif(e.raw_payload -> 'product' ->> 'name', ''),
  pedido_id = nullif(e.raw_payload -> 'transactions' -> 0 ->> 'gateway_transaction_id', ''),
  pedido_total_cents = case
    when jsonb_typeof(e.raw_payload -> 'transactions') = 'array' then (
      select nullif(round(sum((t ->> 'amount')::numeric)), 0)::bigint
      from jsonb_array_elements(e.raw_payload -> 'transactions') t
      where t ->> 'status' = 'PAID'
        and (t ->> 'amount') ~ '^[0-9]+(\.[0-9]+)?$'
    )
  end
where e.source = 'onprofit'
  and e.event_type = 'purchase'
  and e.item_tipo is null
  and e.raw_payload ->> 'item_type' is not null;

drop function if exists public.tracking_sales_by_offer(uuid, timestamptz, timestamptz);

create function public.tracking_sales_by_offer(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  offer_name text,
  purchases bigint,
  revenue_cents bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.has_product_access(p_product_id) then
    raise exception 'Sem acesso a esse produto.';
  end if;

  return query
    select
      -- O item extra (order bump, upsell...) aparece com o NOME DELE. Com o nome
      -- da oferta que o carregou, o bump de R$ 37 entrava na linha do Starter
      -- e inflava o "Starter vendeu N" com coisa que não é o Starter.
      coalesce(
        case when coalesce(e.item_tipo, 'front') = 'front' then e.offer_name else coalesce(nullif(e.item_nome, ''), e.offer_name) end,
        '(sem nome)'
      ) as offer_name,
      count(*) as purchases,
      coalesce(sum(e.amount_cents), 0) as revenue_cents
    from tracking_events e
    where e.product_id = p_product_id
      and e.event_type = 'purchase'
      and e.occurred_at >= p_from
      and e.occurred_at <= p_to
    group by 1
    order by revenue_cents desc;
end;
$$;

drop function if exists public.tracking_sales_by_payment_method(uuid, timestamptz, timestamptz);

create function public.tracking_sales_by_payment_method(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  payment_method text,
  purchases bigint,
  revenue_cents bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.has_product_access(p_product_id) then
    raise exception 'Sem acesso a esse produto.';
  end if;

  return query
    select
      coalesce(e.payment_method, '(não identificado)') as payment_method,
      count(*) filter (where coalesce(e.item_tipo, 'front') = 'front') as purchases,
      coalesce(sum(e.amount_cents), 0) as revenue_cents
    from tracking_events e
    where e.product_id = p_product_id
      and e.event_type = 'purchase'
      and e.occurred_at >= p_from
      and e.occurred_at <= p_to
    group by 1
    order by revenue_cents desc;
end;
$$;

drop function if exists public.tracking_sales_by_page_type(uuid, timestamptz, timestamptz);

create function public.tracking_sales_by_page_type(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  page_type text,
  purchases bigint,
  revenue_cents bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.has_product_access(p_product_id) then
    raise exception 'Sem acesso a esse produto.';
  end if;

  return query
    select
      coalesce(l.utm_medium, '(não definido)') as page_type,
      count(*) filter (where coalesce(e.item_tipo, 'front') = 'front') as purchases,
      coalesce(sum(e.amount_cents), 0) as revenue_cents
    from tracking_events e
    join tracking_leads l on l.id = e.lead_id
    where e.product_id = p_product_id
      and e.event_type = 'purchase'
      and e.occurred_at >= p_from
      and e.occurred_at <= p_to
    group by 1
    order by revenue_cents desc;
end;
$$;

drop function if exists public.tracking_sales_by_channel(uuid, timestamptz, timestamptz);

create function public.tracking_sales_by_channel(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  channel text,
  purchases bigint,
  revenue_cents bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.has_product_access(p_product_id) then
    raise exception 'Sem acesso a esse produto.';
  end if;

  return query
    select
      coalesce(l.utm_content, '(não definido)') as channel,
      count(*) filter (where coalesce(e.item_tipo, 'front') = 'front') as purchases,
      coalesce(sum(e.amount_cents), 0) as revenue_cents
    from tracking_events e
    join tracking_leads l on l.id = e.lead_id
    where e.product_id = p_product_id
      and e.event_type = 'purchase'
      and e.occurred_at >= p_from
      and e.occurred_at <= p_to
    group by 1
    order by revenue_cents desc;
end;
$$;

drop function if exists public.tracking_sales_by_time(uuid, timestamptz, timestamptz);

create function public.tracking_sales_by_time(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  weekday smallint,
  hour smallint,
  purchases bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public.has_product_access(p_product_id) then
    raise exception 'Sem acesso a esse produto.';
  end if;

  return query
    select
      extract(dow from e.occurred_at at time zone 'America/Sao_Paulo')::smallint as weekday,
      extract(hour from e.occurred_at at time zone 'America/Sao_Paulo')::smallint as hour,
      count(*) filter (where coalesce(e.item_tipo, 'front') = 'front') as purchases
    from tracking_events e
    where e.product_id = p_product_id
      and e.event_type = 'purchase'
      and e.occurred_at >= p_from
      and e.occurred_at <= p_to
    group by 1, 2;
end;
$$;

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
        and coalesce(e.item_tipo, 'front') = 'front'
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
        and coalesce(e.item_tipo, 'front') = 'front'
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
        and coalesce(e.item_tipo, 'front') = 'front'
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

drop function if exists public.tracking_campaign_report(uuid, timestamptz, timestamptz);

create function public.tracking_campaign_report(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  utm_source text,
  utm_campaign text,
  leads bigint,
  initiate_checkouts bigint,
  purchases bigint,
  purchase_revenue_cents bigint,
  contracts_signed bigint,
  members_access bigint,
  tool_signups bigint,
  broker_signups bigint,
  deposits bigint,
  deposits_total_cents bigint,
  spend_cents bigint,
  spend_usd_cents bigint
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
    with lead_campaign as (
      select
        l.id as lead_id,
        coalesce(l.utm_source, '(direto)') as utm_source,
        coalesce(l.utm_campaign, '(sem campanha)') as utm_campaign,
        l.first_seen_at,
        l.meta_campaign_id,
        l.google_campaign_id
      from tracking_leads l
      where l.product_id = p_product_id
    ),
    -- Todas as combinações utm_source/utm_campanha já vistas pro produto,
    -- sem limitar por data — é só a "grade" que junta leads-do-período e
    -- eventos-do-período por igual, mesmo quando só um dos dois existe
    -- nesse período específico.
    all_campaigns as (
      select distinct lc.utm_source, lc.utm_campaign from lead_campaign lc
    ),
    campaign_ids as (
      select distinct lc.utm_source, lc.utm_campaign, 'meta'::text as platform, lc.meta_campaign_id as campaign_id
      from lead_campaign lc
      where lc.meta_campaign_id is not null
      union
      select distinct lc.utm_source, lc.utm_campaign, 'google'::text as platform, lc.google_campaign_id as campaign_id
      from lead_campaign lc
      where lc.google_campaign_id is not null
    ),
    leads_count as (
      select utm_source, utm_campaign, count(distinct lead_id) as leads
      from lead_campaign
      where first_seen_at >= p_from and first_seen_at <= p_to
      group by 1, 2
    ),
    -- Gasto de cada campanha da plataforma no período, uma vez só.
    spend_total as (
      select s.platform, s.campaign_id, sum(s.spend_cents) as spend_cents,
             coalesce(sum(s.gasto_original_cents) filter (where s.moeda = 'USD'), 0) as spend_usd_cents
      from ad_campaign_spend s
      where s.product_id = p_product_id
        and s.spend_date >= p_from::date
        and s.spend_date <= p_to::date
      group by 1, 2
    ),
    -- Peso de cada origem dentro da mesma campanha: os leads dela no período.
    spend_pesos as (
      select ci.utm_source, ci.utm_campaign, ci.platform, ci.campaign_id,
             coalesce(lcnt.leads, 0) as leads
      from campaign_ids ci
      left join leads_count lcnt
        on lcnt.utm_source = ci.utm_source and lcnt.utm_campaign = ci.utm_campaign
    ),
    spend_somas as (
      select sp.platform, sp.campaign_id, sum(sp.leads) as total_leads, count(*) as linhas
      from spend_pesos sp
      group by 1, 2
    ),
    spend as (
      select
        sp.utm_source,
        sp.utm_campaign,
        coalesce(sum(
          round(
            case when ss.total_leads > 0
              then st.spend_cents * sp.leads::numeric / ss.total_leads
              else st.spend_cents::numeric / ss.linhas
            end
          )
        ), 0)::bigint as spend_cents,
        coalesce(sum(
          round(
            case when ss.total_leads > 0
              then st.spend_usd_cents * sp.leads::numeric / ss.total_leads
              else st.spend_usd_cents::numeric / ss.linhas
            end
          )
        ), 0)::bigint as spend_usd_cents
      from spend_pesos sp
      join spend_total st on st.platform = sp.platform and st.campaign_id = sp.campaign_id
      join spend_somas ss on ss.platform = sp.platform and ss.campaign_id = sp.campaign_id
      group by 1, 2
    ),
    events_agg as (
      select
        lc.utm_source,
        lc.utm_campaign,
        count(distinct e.id) filter (where e.event_type = 'initiate_checkout') as initiate_checkouts,
        count(distinct e.id) filter (where e.event_type = 'purchase' and coalesce(e.item_tipo, 'front') = 'front') as purchases,
        coalesce(sum(e.amount_cents) filter (where e.event_type = 'purchase'), 0) as purchase_revenue_cents,
        count(distinct e.id) filter (where e.event_type = 'contract_signed') as contracts_signed,
        count(distinct e.id) filter (where e.event_type = 'members_access') as members_access,
        count(distinct e.id) filter (where e.event_type = 'tool_signup') as tool_signups,
        count(distinct e.id) filter (where e.event_type = 'broker_signup') as broker_signups,
        count(distinct e.id) filter (where e.event_type = 'broker_deposit') as deposits,
        coalesce(sum(e.amount_cents) filter (where e.event_type = 'broker_deposit'), 0) as deposits_total_cents
      from lead_campaign lc
      join tracking_events e on e.lead_id = lc.lead_id
      where e.occurred_at >= p_from and e.occurred_at <= p_to
      group by 1, 2
    ),
    matched as (
      select
        ac.utm_source,
        ac.utm_campaign,
        coalesce(lcnt.leads, 0) as leads,
        coalesce(ev.initiate_checkouts, 0) as initiate_checkouts,
        coalesce(ev.purchases, 0) as purchases,
        coalesce(ev.purchase_revenue_cents, 0) as purchase_revenue_cents,
        coalesce(ev.contracts_signed, 0) as contracts_signed,
        coalesce(ev.members_access, 0) as members_access,
        coalesce(ev.tool_signups, 0) as tool_signups,
        coalesce(ev.broker_signups, 0) as broker_signups,
        coalesce(ev.deposits, 0) as deposits,
        coalesce(ev.deposits_total_cents, 0) as deposits_total_cents,
        coalesce(sp.spend_cents, 0) as spend_cents,
        coalesce(sp.spend_usd_cents, 0) as spend_usd_cents
      from all_campaigns ac
      left join leads_count lcnt on lcnt.utm_source = ac.utm_source and lcnt.utm_campaign = ac.utm_campaign
      left join events_agg ev on ev.utm_source = ac.utm_source and ev.utm_campaign = ac.utm_campaign
      left join spend sp on sp.utm_source = ac.utm_source and sp.utm_campaign = ac.utm_campaign
      where coalesce(lcnt.leads, 0) > 0
        or coalesce(ev.initiate_checkouts, 0) + coalesce(ev.purchases, 0) + coalesce(ev.contracts_signed, 0)
           + coalesce(ev.members_access, 0) + coalesce(ev.tool_signups, 0) + coalesce(ev.broker_signups, 0)
           + coalesce(ev.deposits, 0) > 0
    ),
    -- Webhook chegou mas matchLead() não achou lead nenhum (sem ref, e-mail
    -- ou telefone batendo) — usa o utm_source/utm_campaign que a própria
    -- plataforma mandou no payload dela, quando existir; senão cai no
    -- genérico "(não atribuído)". Sem gasto pra atribuir de qualquer jeito
    -- (não sabemos se algum desses tem campanha de anúncio real por trás).
    unmatched as (
      select
        coalesce(e.raw_payload ->> 'utm_source', '(não atribuído)') as utm_source,
        coalesce(e.raw_payload ->> 'utm_campaign', '(não atribuído)') as utm_campaign,
        0::bigint as leads,
        count(*) filter (where e.event_type = 'initiate_checkout') as initiate_checkouts,
        count(*) filter (where e.event_type = 'purchase' and coalesce(e.item_tipo, 'front') = 'front') as purchases,
        coalesce(sum(e.amount_cents) filter (where e.event_type = 'purchase'), 0) as purchase_revenue_cents,
        count(*) filter (where e.event_type = 'contract_signed') as contracts_signed,
        count(*) filter (where e.event_type = 'members_access') as members_access,
        count(*) filter (where e.event_type = 'tool_signup') as tool_signups,
        count(*) filter (where e.event_type = 'broker_signup') as broker_signups,
        count(*) filter (where e.event_type = 'broker_deposit') as deposits,
        coalesce(sum(e.amount_cents) filter (where e.event_type = 'broker_deposit'), 0) as deposits_total_cents,
        0::bigint as spend_cents,
        0::bigint as spend_usd_cents
      from tracking_events e
      where e.product_id = p_product_id
        and e.lead_id is null
        and e.occurred_at >= p_from
        and e.occurred_at <= p_to
      group by 1, 2
      having count(*) > 0
    )
    select * from matched
    union all
    select * from unmatched
    order by deposits_total_cents desc nulls last;
end;
$$;

-- Itens vendidos no período, por tipo (principal, order bump, upsell,
-- downsell) e por nome do item. Alimenta o painel "Order bumps, upsells e
-- downsells". "vendas" conta ITENS; o número de pedidos é a soma das vendas
-- do tipo 'front'.
drop function if exists public.tracking_itens_vendidos(uuid, timestamptz, timestamptz);

create function public.tracking_itens_vendidos(
  p_product_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  item_tipo text,
  item_nome text,
  vendas bigint,
  receita_cents bigint
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
    select
      coalesce(e.item_tipo, 'front')::text as item_tipo,
      coalesce(nullif(e.item_nome, ''), e.offer_name, '(sem nome)')::text as item_nome,
      count(*)::bigint as vendas,
      coalesce(sum(e.amount_cents), 0)::bigint as receita_cents
    from tracking_events e
    where e.product_id = p_product_id
      and e.event_type = 'purchase'
      and e.occurred_at >= p_from
      and e.occurred_at <= p_to
    group by 1, 2
    order by receita_cents desc;
end;
$$;

grant execute on function public.tracking_itens_vendidos(uuid, timestamptz, timestamptz) to authenticated;
