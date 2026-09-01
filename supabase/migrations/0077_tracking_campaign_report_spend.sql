-- Adiciona o gasto de anúncio ao relatório de campanha, pra fechar o ROI
-- de verdade (até aqui só tínhamos leads/compras/depósitos, sem saber
-- quanto custou gerar isso). Gasto é sincronizado por campaign_id real da
-- plataforma (ad_campaign_spend, POST /api/ads/sync) — casado aqui pelo
-- meta_campaign_id/google_campaign_id capturados no lead (mcid/gcid), não
-- pelo utm_campaign (texto livre, não confiável pra casar com a API).
--
-- Como o gasto é agregado por dia/campanha e o relatório agrupa por
-- (utm_source, utm_campaign) — vários leads podem compartilhar o mesmo
-- campaign_id — soma o gasto de todos os campaign_ids distintos vistos
-- naquele grupo (CTE "spend"), depois traz de volta com max() pra não
-- multiplicar ao juntar com os eventos (que multiplicam a linha por lead).
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
    )
    select
      b.utm_source,
      b.utm_campaign,
      count(distinct b.lead_id) as leads,
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
    order by deposits_total_cents desc nulls last;
end;
$$;
