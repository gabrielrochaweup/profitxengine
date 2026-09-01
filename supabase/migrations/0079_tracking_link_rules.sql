-- Permite colar UM link puro (sem código, sem classe CSS, sem "opções
-- avançadas") em QUALQUER botão de QUALQUER site/builder e ainda assim
-- rastrear: em vez de exigir uma marcação no botão, o app guarda aqui qual
-- URL deve ser tratada como link de checkout/rastreio, e o script
-- (pixel.js) busca essa lista e intercepta sozinho o clique em qualquer
-- link cujo destino bata com uma regra salva.
create table tracking_link_rules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  -- origin + pathname do link (sem query string) — casa o clique ignorando
  -- variações de query (ex: parâmetros próprios da oferta), então cadastrar
  -- "https://pay.onprofit.com.br/0c1LryyT" cobre "?off=qjo4cq" e qualquer
  -- outra query que apareça no mesmo link.
  match_url text not null,
  param_name text not null default 'ref',
  fire_checkout boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (product_id, match_url)
);

alter table tracking_link_rules enable row level security;

create policy "tracking_link_rules_admin_all" on tracking_link_rules
  for all using (public.is_admin()) with check (public.is_admin());
