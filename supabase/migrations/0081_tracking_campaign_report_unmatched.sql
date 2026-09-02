-- Até aqui o relatório só somava eventos com lead_id preenchido (join a
-- partir de tracking_leads) — um depósito/compra/cadastro cujo webhook não
-- bateu por ref/e-mail/telefone (matchLead retornou null) ficava
-- completamente fora da visão geral, mesmo aparecendo em "Eventos
-- recentes". Fica visível como "(não atribuído)" agora, em vez de
-- desaparecer da soma.
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
    with base as (
      select
        l.id as lead_id,
        coalesce(l.utm_source, '(direto)') as utm_source,
        coalesce(l.utm_campaign, '(sem campanha)') as utm_campaign,
        l.meta_campaign_id,
        l.google_campaign_id
      from tracking_leads l
      where l.product_id = p_product_id
        and l.first_seen_at >= p_from
        and l.first_seen_at <= p_to
    ),
    campaign_ids as (
      select distinct b.utm_source, b.utm_campaign, 'meta'::text as platform, b.meta_campaign_id as campaign_id
      from base b
      where b.meta_campaign_id is not null
      union
      select distinct b.utm_source, b.utm_campaign, 'google'::text as platform, b.google_campaign_id as campaign_id
      from base b
      where b.google_campaign_id is not null
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
    matched as (
      select
        b.utm_source,
        b.utm_campaign,
        count(distinct b.lead_id) as leads,
        count(distinct e.id) filter (where e.event_type = 'initiate_checkout') as initiate_checkouts,
        count(distinct e.id) filter (where e.event_type = 'purchase') as purchases,
        coalesce(sum(e.amount_cents) filter (where e.event_type = 'purchase'), 0) as purchase_revenue_cents,
        count(distinct e.id) filter (where e.event_type = 'members_access') as members_access,
        count(distinct e.id) filter (where e.event_type = 'broker_signup') as broker_signups,
        count(distinct e.id) filter (where e.event_type = 'broker_deposit') as deposits,
        coalesce(sum(e.amount_cents) filter (where e.event_type = 'broker_deposit'), 0) as deposits_total_cents,
        coalesce(max(sp.spend_cents), 0) as spend_cents
      from base b
      left join tracking_events e on e.lead_id = b.lead_id
      left join spend sp on sp.utm_source = b.utm_source and sp.utm_campaign = b.utm_campaign
      group by 1, 2
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
