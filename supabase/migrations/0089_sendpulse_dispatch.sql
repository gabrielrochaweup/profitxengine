-- SendPulse: profitxengine vira o motor único de decisão dos funis de
-- WhatsApp (boas-vindas por plano alcançado + pós-contrato por assinatura),
-- cruzando compra (Onprofit), cadastro em área de membros (Cademi/Vortex) e
-- assinatura de contrato (ZapSign, repassada pelo Vortex). Ver conversa de
-- 2026-09-14 — o Vortex deixa de disparar pro SendPulse sozinho porque ele
-- só enxerga o próprio cadastro, não a Onprofit nem o Cademi.

-- "contract": endpoint que o Vortex chama depois de processar uma
-- assinatura da ZapSign — mesmo padrão de slug+token dos outros webhooks
-- (checkout/members_area/broker), pra reaproveitar toda a infra de auth
-- já existente em resolveWebhookEndpoint.
do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'tracking_webhook_endpoints'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%kind%';

  if constraint_name is not null then
    execute format('alter table tracking_webhook_endpoints drop constraint %I', constraint_name);
  end if;

  alter table tracking_webhook_endpoints
    add constraint tracking_webhook_endpoints_kind_check
    check (kind in ('checkout', 'members_area', 'broker', 'contract'));
end $$;

-- "contract_signed": contrato assinado, repassado pelo Vortex — vira
-- tracking_event como os demais, pra entrar no mesmo relatório/auditoria.
do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'tracking_events'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%event_type%';

  if constraint_name is not null then
    execute format('alter table tracking_events drop constraint %I', constraint_name);
  end if;

  alter table tracking_events
    add constraint tracking_events_event_type_check
    check (event_type in ('page_view', 'initiate_checkout', 'purchase', 'members_access', 'broker_signup', 'broker_deposit', 'contract_signed'));
end $$;

-- Endereços de evento do SendPulse (Automation360), colados manualmente no
-- painel — mesma ideia da aba "Aviso de WhatsApp" do Vortex, mas aqui cobre
-- os dois tipos de funil. `key` identifica tipo+plano, ex:
-- 'boasvindas_starter', 'boasvindas_geral', 'contrato_elite'.
create table public.sendpulse_settings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  enabled boolean not null default false,
  key text not null,
  url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, key)
);

-- Trava do boas-vindas: uma mensagem por plano alcançado, nunca repete o
-- mesmo plano pro mesmo e-mail (upgrade Starter->Pro->Elite gera até 3
-- disparos ao longo da vida do aluno). INSERT ... ON CONFLICT DO NOTHING é
-- a trava em si — só quem conseguir inserir a linha dispara.
create table public.sendpulse_boasvindas_sent (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  email text not null,
  plano text not null,
  created_at timestamptz not null default now(),
  unique (product_id, email, plano)
);

-- Log de todo disparo tentado, sucesso ou falha — inclusive os que nem
-- chegaram a tentar o POST (ex: sem endereço configurado, ou e-mail não
-- reconhecido por compra/cadastro nenhum). Nada fica silencioso.
create table public.sendpulse_dispatch_log (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tipo text not null check (tipo in ('boas_vindas', 'contrato')),
  email text not null,
  phone text not null default '',
  plano text not null default '',
  destino text not null default '',
  status text not null check (status in ('enviando', 'enviado', 'falhou')),
  erro text not null default '',
  response_body text not null default '',
  payload jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index idx_sendpulse_dispatch_log_product on public.sendpulse_dispatch_log (product_id, created_at desc);

alter table public.sendpulse_settings enable row level security;
alter table public.sendpulse_boasvindas_sent enable row level security;
alter table public.sendpulse_dispatch_log enable row level security;

-- Configuração é só do admin, mesmo padrão de tracking_webhook_endpoints
-- (guarda URL que funciona como credencial — quem tem o endereço dispara).
create policy sendpulse_settings_admin_all on public.sendpulse_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Trava e log são gravados pelo service role (webhooks), mas o painel
-- precisa ler pra mostrar o histórico — mesmo padrão de tracking_events.
create policy sendpulse_boasvindas_sent_select on public.sendpulse_boasvindas_sent
  for select using (public.has_product_access(product_id));

create policy sendpulse_dispatch_log_select on public.sendpulse_dispatch_log
  for select using (public.has_product_access(product_id));
