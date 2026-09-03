-- A versão anterior misturava duas noções de "período" na mesma linha do
-- relatório: leads eram filtrados por data de entrada (first_seen_at) e
-- depois TODOS os eventos deles entravam na soma, sem filtro de data
-- nenhum — já a linha "(não atribuído)" filtrava pela data do evento
-- (occurred_at). Resultado: um depósito de março de um lead que entrou em
-- janeiro aparecia contado ao escolher "Janeiro" e desaparecia por completo
-- ao escolher "Março" (o lead nem entra na base do período, e como tem
-- lead_id não cai em "não atribuído"). Isso também batia diferente do que
-- "Eventos recentes" mostra pro mesmo período (ali sempre foi por
-- occurred_at).
--
-- Agora as duas métricas ficam desacopladas e cada uma respeita o período
-- pela sua própria data: "leads" conta quem entrou no período (first_seen_at),
-- os demais números contam eventos que aconteceram no período (occurred_at) —
-- não importa quando o lead entrou. Uma campanha aparece na tabela se teve
-- lead novo OU evento no período (grade de todas as campanhas já vistas pro
-- produto, sem limitar por data, servindo só de referência pra juntar as
-- duas métricas).
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
  members_access bigint,
  broker_signups bigint,
  deposits bigint,
  deposits_total_cents bigint,
  spend_cents bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
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
    spend as (
      select
        ci.utm_source,
        ci.utm_campaign,
        coalesce(sum(s.spend_cents), 0) as spend_cents
      from campaign_ids ci
      left join ad_campaign_spend s
        on s.product_id = p_product_id
        and s.platform = ci.platform
        and s.campaign_id = ci.campaign_id
        and s.spend_date >= p_from::date
        and s.spend_date <= p_to::date
      group by 1, 2
    ),
    leads_count as (
      select utm_source, utm_campaign, count(distinct lead_id) as leads
      from lead_campaign
      where first_seen_at >= p_from and first_seen_at <= p_to
      group by 1, 2
    ),
    events_agg as (
      select
        lc.utm_source,
        lc.utm_campaign,
        count(distinct e.id) filter (where e.event_type = 'initiate_checkout') as initiate_checkouts,
        count(distinct e.id) filter (where e.event_type = 'purchase') as purchases,
        coalesce(sum(e.amount_cents) filter (where e.event_type = 'purchase'), 0) as purchase_revenue_cents,
        count(distinct e.id) filter (where e.event_type = 'members_access') as members_access,
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
        coalesce(ev.members_access, 0) as members_access,
        coalesce(ev.broker_signups, 0) as broker_signups,
        coalesce(ev.deposits, 0) as deposits,
        coalesce(ev.deposits_total_cents, 0) as deposits_total_cents,
        coalesce(sp.spend_cents, 0) as spend_cents
      from all_campaigns ac
      left join leads_count lcnt on lcnt.utm_source = ac.utm_source and lcnt.utm_campaign = ac.utm_campaign
      left join events_agg ev on ev.utm_source = ac.utm_source and ev.utm_campaign = ac.utm_campaign
      left join spend sp on sp.utm_source = ac.utm_source and sp.utm_campaign = ac.utm_campaign
      where coalesce(lcnt.leads, 0) > 0
        or coalesce(ev.initiate_checkouts, 0) + coalesce(ev.purchases, 0) + coalesce(ev.members_access, 0)
           + coalesce(ev.broker_signups, 0) + coalesce(ev.deposits, 0) > 0
    ),
    -- Webhook chegou mas matchLead() não achou lead nenhum (sem ref, e-mail
    -- ou telefone batendo) — junta tudo numa linha só, sem campanha nem
    -- gasto pra atribuir (não tem como saber qual anúncio gerou isso).
    unmatched as (
      select
        '(não atribuído)'::text as utm_source,
        '(não atribuído)'::text as utm_campaign,
        0::bigint as leads,
        count(*) filter (where e.event_type = 'initiate_checkout') as initiate_checkouts,
        count(*) filter (where e.event_type = 'purchase') as purchases,
        coalesce(sum(e.amount_cents) filter (where e.event_type = 'purchase'), 0) as purchase_revenue_cents,
        count(*) filter (where e.event_type = 'members_access') as members_access,
        count(*) filter (where e.event_type = 'broker_signup') as broker_signups,
        count(*) filter (where e.event_type = 'broker_deposit') as deposits,
        coalesce(sum(e.amount_cents) filter (where e.event_type = 'broker_deposit'), 0) as deposits_total_cents,
        0::bigint as spend_cents
      from tracking_events e
      where e.product_id = p_product_id
        and e.lead_id is null
        and e.occurred_at >= p_from
        and e.occurred_at <= p_to
      having count(*) > 0
    )
    select * from matched
    union all
    select * from unmatched
    order by deposits_total_cents desc nulls last;
end;
$$;
