-- Registro dos envios do servidor pra Meta (API de Conversões).
--
-- Purchase e Deposit saem do nosso servidor e, até aqui, a resposta da Meta
-- era descartada: token vencido, formato recusado ou pixel errado passavam
-- em silêncio. Cada envio agora deixa uma linha com o que a Meta respondeu,
-- e a tela Rastreamento lista os últimos.

create table if not exists tracking_capi_log (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  event_name text not null,
  pixel_id text,
  lead_id uuid,
  external_id text,
  amount_cents bigint,
  currency text,
  -- true = a Meta aceitou; false = recusou ou nem chegou a enviar (ver erro).
  ok boolean not null,
  events_received integer,
  fbtrace_id text,
  erro text,
  -- Envio manual com test_event_code: aparece só na aba Testar eventos.
  teste boolean not null default false,
  enviado_em timestamptz not null default now()
);

create index if not exists idx_tracking_capi_log_produto_data on tracking_capi_log (product_id, enviado_em desc);

alter table tracking_capi_log enable row level security;

-- Leitura pra equipe; escrita só pelo servidor (service key).
drop policy if exists "tracking_capi_log_select" on tracking_capi_log;
create policy "tracking_capi_log_select" on tracking_capi_log
  for select using (public.has_product_access(product_id));
