-- Credenciais de acesso às contas de anúncio (Meta Ads / Google Ads), por
-- produto — mesmo padrão de ai_credentials (0001): segredo cifrado com
-- encryptSecret, só admin lê/escreve, nunca devolvido em texto puro por GET.
-- "ad_account_id" fica em texto puro (não é segredo, só identificador) pra
-- exibir na UI sem precisar descriptografar.
create table ad_platform_credentials (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  platform text not null check (platform in ('meta', 'google')),
  encrypted_credentials text not null,
  ad_account_id text,
  is_valid boolean not null default false,
  last_checked_at timestamptz,
  last_synced_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (product_id, platform)
);

alter table ad_platform_credentials enable row level security;

create policy "ad_platform_credentials_admin_all" on ad_platform_credentials
  for all using (public.is_admin()) with check (public.is_admin());

-- Snapshot diário de gasto por campanha, puxado da API de cada plataforma
-- (sincronização sob demanda — botão "Sincronizar agora", sem cron ainda).
-- Unique por (produto, plataforma, campanha, dia) faz o sync ser um upsert,
-- nunca duplica.
create table ad_campaign_spend (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  platform text not null check (platform in ('meta', 'google')),
  campaign_id text not null,
  campaign_name text,
  spend_cents integer not null default 0,
  spend_date date not null,
  synced_at timestamptz not null default now(),
  unique (product_id, platform, campaign_id, spend_date)
);

create index idx_ad_campaign_spend_product on ad_campaign_spend(product_id);

alter table ad_campaign_spend enable row level security;

create policy "ad_campaign_spend_select" on ad_campaign_spend
  for select using (public.has_product_access(product_id));
create policy "ad_campaign_spend_write_admin" on ad_campaign_spend
  for all using (public.is_admin()) with check (public.is_admin());
