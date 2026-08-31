-- Aba "Tracking": mapeia o funil completo do lead — clique no anúncio (Meta/
-- Google, via UTM/fbclid/gclid capturados na landing page) → compra do
-- curso (qualquer plataforma de checkout) → primeiro acesso à área de
-- membros → cadastro na corretora → depósito. Sem isso, o marketing só
-- enxerga venda de curso por campanha e pode desativar uma campanha que
-- vende pouco curso mas gera muito depósito na corretora.
--
-- Isolado por produto (mesmo padrão de Tarefas, 0057): cada produto tem seu
-- próprio funil e seus próprios segredos de webhook.

-- Um registro por visitante identificado na landing page. O id é o próprio
-- lead_id gerado no navegador (uuid v4), não um id novo do banco — assim o
-- client já sabe a PK antes de qualquer resposta do servidor.
create table tracking_leads (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  gclid text,
  fbp text,
  fbc text,
  landing_url text,
  referrer text,
  email text,
  first_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_tracking_leads_product on tracking_leads(product_id);
create index idx_tracking_leads_email on tracking_leads(email) where email is not null;

-- Log bruto append-only de todo evento recebido, de qualquer origem.
-- lead_id fica nulo quando o evento não bateu com nenhum lead conhecido —
-- ainda assim é guardado e aparece como "não atribuído" no relatório, em vez
-- de descartado, porque isso também é informação (quanto está escapando do
-- rastreio).
create table tracking_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  lead_id uuid references tracking_leads(id) on delete set null,
  event_type text not null check (
    event_type in ('page_view', 'purchase', 'members_access', 'broker_signup', 'broker_deposit')
  ),
  source text not null,
  email text,
  amount_cents integer,
  currency text not null default 'BRL',
  external_id text,
  raw_payload jsonb,
  occurred_at timestamptz not null default now(),
  received_at timestamptz not null default now()
);

create index idx_tracking_events_product on tracking_events(product_id);
create index idx_tracking_events_lead on tracking_events(lead_id);
create index idx_tracking_events_type on tracking_events(event_type);

-- Reentrega do mesmo webhook (retry de rede, por exemplo) não duplica o
-- evento — cada origem garante um external_id único por evento dela.
create unique index idx_tracking_events_source_external_id
  on tracking_events(source, external_id)
  where external_id is not null;

-- Endpoints de webhook configurados pelo admin: um por produto+origem.
-- "kind" separa os 3 tipos de origem externa (checkout, área de membros,
-- corretora); "platform" só existe pra checkout, porque múltiplas
-- plataformas (Hotmart, Kiwify, ...) têm formatos de payload diferentes —
-- cada uma ganha um adapter em código (src/lib/tracking/checkout-adapters),
-- não uma migration nova.
create table tracking_webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  kind text not null check (kind in ('checkout', 'members_area', 'broker')),
  platform text,
  endpoint_slug text not null unique,
  encrypted_secret text not null,
  active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_tracking_webhook_endpoints_product on tracking_webhook_endpoints(product_id);

alter table tracking_leads enable row level security;
alter table tracking_events enable row level security;
alter table tracking_webhook_endpoints enable row level security;

create policy "tracking_leads_select" on tracking_leads
  for select using (public.has_product_access(product_id));
create policy "tracking_leads_write" on tracking_leads
  for all using (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id))
  with check (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id));

create policy "tracking_events_select" on tracking_events
  for select using (public.has_product_access(product_id));
create policy "tracking_events_write" on tracking_events
  for all using (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id))
  with check (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id));

-- Só admin mexe em segredo de webhook — mesmo padrão de ai_credentials.
create policy "tracking_webhook_endpoints_admin_all" on tracking_webhook_endpoints
  for all using (public.is_admin()) with check (public.is_admin());

-- Relatório por campanha: uma linha por (utm_source, utm_campaign) com as 5
-- etapas do funil. security definer porque cruza tracking_leads/tracking_events
-- (RLS normal exigiria o mesmo product_id em ambas as tabelas pro usuário,
-- o que já é verdade aqui, mas fazer a agregação sem RLS é bem mais barato)
-- — por isso checa has_product_access manualmente logo na entrada.
create or replace function public.tracking_campaign_report(
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
  deposits_total_cents bigint
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
    select
      coalesce(l.utm_source, '(direto)') as utm_source,
      coalesce(l.utm_campaign, '(sem campanha)') as utm_campaign,
      count(distinct l.id) as leads,
      count(distinct e.id) filter (where e.event_type = 'purchase') as purchases,
      coalesce(sum(e.amount_cents) filter (where e.event_type = 'purchase'), 0) as purchase_revenue_cents,
      count(distinct e.id) filter (where e.event_type = 'members_access') as members_access,
      count(distinct e.id) filter (where e.event_type = 'broker_signup') as broker_signups,
      count(distinct e.id) filter (where e.event_type = 'broker_deposit') as deposits,
      coalesce(sum(e.amount_cents) filter (where e.event_type = 'broker_deposit'), 0) as deposits_total_cents
    from tracking_leads l
    left join tracking_events e on e.lead_id = l.id
    where l.product_id = p_product_id
      and l.first_seen_at >= p_from
      and l.first_seen_at <= p_to
    group by 1, 2
    order by deposits_total_cents desc nulls last;
end;
$$;
