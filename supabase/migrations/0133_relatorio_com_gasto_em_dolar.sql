-- O relatório de campanhas passa a devolver o gasto TAMBÉM em dólar.
--
-- Desde a 0132 o gasto é guardado em reais (spend_cents), convertido da moeda
-- da conta pela cotação do dia, e o valor original fica em gasto_original_cents.
-- As contas de anúncio são em dólar, então é em dólar que o gasto aparece nas
-- telas (é o número que o Gerenciador de Anúncios mostra). O real continua aí
-- porque o ROI, o ROAS e o lucro comparam o gasto com a venda, que é em real.
--
-- spend_usd_cents sai do mesmo rateio de spend_cents (campanha → origens na
-- proporção dos leads), então as duas colunas sempre contam a mesma história.
-- Só entra gasto de conta em dólar; conta em outra moeda fica de fora dele e
-- continua só em spend_cents.
--
-- Só ACRESCENTA a coluna no fim. Todo o resto é a 0129.

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
        count(distinct e.id) filter (where e.event_type = 'purchase') as purchases,
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
        count(*) filter (where e.event_type = 'purchase') as purchases,
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
