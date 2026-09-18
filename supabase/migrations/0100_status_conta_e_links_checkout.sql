-- 1) Status também na conta de anúncio.
--
-- A BM ganhou status na 0099, mas quem é bloqueado no dia a dia é a conta
-- de anúncio, não só a BM: a BM continua de pé e uma conta dentro dela cai.
-- Mesmos quatro estados da BM, de propósito — duas escalas diferentes pra
-- mesma pergunta ("dá pra rodar?") só dariam trabalho de traduzir.
--
-- Nasce 'ativa' porque quem já está cadastrada hoje está em uso; marcar
-- todas como 'pronta' obrigaria a revisar uma a uma pra voltar ao estado
-- que já era verdade.
alter table ad_platform_credentials
  add column status text not null default 'ativa'
  check (status in ('ativa', 'pronta', 'restrita', 'bloqueada'));

-- 2) Os checkouts em uso, pra montar UTM sem caçar link.
--
-- O gerador pede o link de destino primeiro, e é sempre o mesmo punhado de
-- links — colados de memória ou de outra aba. Guardados aqui, viram um
-- clique, e o link certo (oferta certa) para de depender de lembrar qual é.
create table tracking_checkout_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  -- Separados porque é assim que se procura: "o Starter, na Onprofit".
  plano text not null,
  checkout text not null,
  url text not null,
  position integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_tracking_checkout_links_produto on tracking_checkout_links (product_id, position);

alter table tracking_checkout_links enable row level security;

create policy "tracking_checkout_links_admin_all" on tracking_checkout_links
  for all using (public.is_admin()) with check (public.is_admin());

-- As três ofertas em uso hoje, com o link limpo: o gerador é quem pendura
-- utm_* e sck em cima. Guardar aqui um link que já veio com UTM faria a
-- origem da venda mentir — o link do upgrade do Vortex, por exemplo, marca
-- tudo como vindo do Vortex.
insert into tracking_checkout_links (product_id, plano, checkout, url, position)
select p.id, v.plano, v.checkout, v.url, v.pos
from products p
cross join (values
  ('Starter', 'Onprofit', 'https://pay.onprofit.com.br/0c1LryyT?off=qjo4cq', 10),
  ('Pro',     'Onprofit', 'https://pay.onprofit.com.br/oBD3IB2B?off=K6yqk6', 20),
  ('Elite',   'Onprofit', 'https://pay.onprofit.com.br/EBYhPUBV?off=9uBLTO', 30)
) as v(plano, checkout, url, pos)
where p.slug = 'profitx';
