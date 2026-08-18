-- Analytics de campos configuráveis por produto — pra produtos sem
-- Dinâmicas do Dia (ex: SEVEN, um produto físico), que não usam os campos
-- fixos do PROFITX (Pepe/Live/Copy/faturamento). O PROFITX continua exatamente
-- como está, ligado a daily_dynamic_selection — isso aqui é só pros outros.
create table product_metric_fields (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null,
  unit text not null default 'numero' check (unit in ('numero', 'moeda')),
  position int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table product_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  field_id uuid not null references product_metric_fields(id) on delete cascade,
  metric_date date not null,
  value numeric not null default 0,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now(),
  unique (field_id, metric_date)
);

create index idx_product_metric_fields_product on product_metric_fields(product_id);
create index idx_product_daily_metrics_product_date on product_daily_metrics(product_id, metric_date);

alter table product_metric_fields enable row level security;
alter table product_daily_metrics enable row level security;

create policy "product_metric_fields_select" on product_metric_fields
  for select using (public.has_product_access(product_id));
create policy "product_metric_fields_write" on product_metric_fields
  for all using (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id))
  with check (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id));

create policy "product_daily_metrics_select" on product_daily_metrics
  for select using (public.has_product_access(product_id));
create policy "product_daily_metrics_write" on product_daily_metrics
  for all using (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id))
  with check (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id));
