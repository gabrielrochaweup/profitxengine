-- Camada de produtos: o app passa a hospedar vários produtos, cada um com
-- seu próprio menu lateral (definido em código, src/lib/products.ts) e
-- controle de acesso por usuário. O produto PROFITX é o app de hoje —
-- nenhuma rota muda, só passa a "pertencer" a esse produto por trás.
create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text,
  position int not null default 0,
  active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table products enable row level security;

create policy "products_select_all" on products
  for select using (auth.role() = 'authenticated');
create policy "products_write_admin_only" on products
  for all using (public.is_admin()) with check (public.is_admin());

-- Quem tem acesso a qual produto. Admins veem todos os produtos sempre
-- (checado em código via is_admin(), não precisam de linha aqui).
create table product_access (
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  granted_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  primary key (product_id, user_id)
);

alter table product_access enable row level security;

create policy "product_access_select_own_or_admin" on product_access
  for select using (user_id = auth.uid() or public.is_admin());
create policy "product_access_write_admin_only" on product_access
  for all using (public.is_admin()) with check (public.is_admin());

-- Semente: produto PROFITX liberado pra todo mundo já aprovado, pra
-- ninguém perder acesso no dia da migração.
insert into products (slug, name, icon, position)
values ('profitx', 'PROFITX', '⚡', 0);

insert into product_access (product_id, user_id)
select (select id from products where slug = 'profitx'), id
from profiles where status = 'approved';
