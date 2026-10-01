-- Gasto por CONJUNTO e por ANÚNCIO.
--
-- Até aqui o app só guardava o gasto por campanha (ad_campaign_spend). As
-- abas Performance → Conjuntos e Anúncios precisam do gasto no nível delas,
-- senão não dá pra comparar custo por lead nem ROI de um conjunto ou de um
-- anúncio. O botão "Sincronizar gasto" passa a buscar os três níveis.
--
-- Uma linha por entidade por dia. Rodar de novo o sync é seguro: o upsert
-- substitui o gasto do mesmo dia/entidade, não duplica.

create table if not exists ad_entity_spend (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  platform text not null check (platform in ('meta', 'google')),
  level text not null check (level in ('adset', 'ad')),
  entity_id text not null,
  entity_name text,
  -- Pais (quando a plataforma informa): pra mostrar "conjunto X da campanha Y".
  campaign_id text,
  adset_id text,
  spend_cents integer not null default 0,
  spend_date date not null,
  synced_at timestamptz not null default now(),
  unique (product_id, platform, level, entity_id, spend_date)
);

create index if not exists idx_ad_entity_spend_produto_data on ad_entity_spend (product_id, spend_date);

alter table ad_entity_spend enable row level security;

-- Leitura pra quem enxerga o produto; escrita só pelo servidor (service key,
-- rota /api/ads/sync).
drop policy if exists "ad_entity_spend_select" on ad_entity_spend;
create policy "ad_entity_spend_select" on ad_entity_spend
  for select using (public.has_product_access(product_id));
