-- Dados > Swipes: produtos concorrentes e inspirações em análise.
--
-- Cada linha é um produto que alguém achou rodando (Ad Library, feed) e
-- quer guardar desmontado: a oferta (front, order bumps, upsells), a página
-- (formato, promessa, mecanismo), o tráfego (anúncios ativos, desde quando)
-- e os criativos (ganchos, tipos). Entra colado como JSON ou preenchido
-- campo a campo, e continua editável depois.
--
-- Listas simples (ganchos, tipos de criativo, prints) são text[]; as listas
-- com estrutura (order bumps e upsells têm nome e preço) são jsonb.
--
-- historico_anuncios guarda cada contagem de anúncios ativos com a data em
-- que foi vista. É o que mostra "de 12 pra 48 em 10 dias" — o sinal de que
-- o produto está escalando, que um número solto não mostra.

create table swipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,

  nome text not null,
  nicho text,
  subnicho text,
  pais_idioma text,
  plataforma text,

  preco_front numeric(12, 2),
  order_bumps jsonb not null default '[]'::jsonb,
  upsells jsonb not null default '[]'::jsonb,

  link_pagina_vendas text,
  link_checkout text,
  link_ad_library text,
  pagina_fb text,
  anuncios_ativos integer check (anuncios_ativos is null or anuncios_ativos >= 0),
  historico_anuncios jsonb not null default '[]'::jsonb,
  rodando_desde date,

  formato_pagina text,
  promessa text,
  mecanismo text,
  ganchos text[] not null default '{}',
  tipos_criativo text[] not null default '{}',

  score smallint check (score is null or (score between 0 and 10)),
  por_que_achei_boa text,
  prints text[] not null default '{}',

  status text not null default 'em_analise' check (status in ('em_analise', 'modelando', 'descartado')),

  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index swipes_product_idx on swipes(product_id, created_at desc);

alter table swipes enable row level security;

-- Mesma regra do resto do conteúdo do produto: quem enxerga o produto
-- organiza os swipes dele.
create policy "swipes_select" on swipes
  for select using (public.has_product_access(product_id));

create policy "swipes_write" on swipes
  for all using (public.has_product_access(product_id))
  with check (public.has_product_access(product_id));

-- Prints das páginas e dos anúncios. Público na leitura porque é print de
-- página pública de concorrente, e porque a tela mostra com <img> direto.
insert into storage.buckets (id, name, public)
values ('swipe-prints', 'swipe-prints', true)
on conflict (id) do nothing;

drop policy if exists "swipe_prints_select_public" on storage.objects;
create policy "swipe_prints_select_public"
  on storage.objects for select
  using (bucket_id = 'swipe-prints');

drop policy if exists "swipe_prints_insert_authenticated" on storage.objects;
create policy "swipe_prints_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'swipe-prints');

drop policy if exists "swipe_prints_delete_authenticated" on storage.objects;
create policy "swipe_prints_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'swipe-prints');
