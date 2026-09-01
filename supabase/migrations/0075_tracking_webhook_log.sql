-- Log das últimas chamadas reais recebidas por cada webhook (aceitas ou
-- rejeitadas), pra dar visibilidade do payload de verdade que uma
-- plataforma externa manda direto dentro do app — sem precisar de
-- ferramenta externa tipo webhook.site pra descobrir o formato. Chamadas de
-- teste (botão "Testar", header x-profitx-test) não entram aqui, só
-- tráfego real.
create table tracking_webhook_log (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references tracking_webhook_endpoints(id) on delete cascade,
  raw_payload jsonb not null,
  accepted boolean not null,
  error text,
  received_at timestamptz not null default now()
);

alter table tracking_webhook_log enable row level security;

create policy "tracking_webhook_log_admin_all" on tracking_webhook_log
  for all using (public.is_admin()) with check (public.is_admin());

create index tracking_webhook_log_endpoint_idx on tracking_webhook_log (endpoint_id, received_at desc);
