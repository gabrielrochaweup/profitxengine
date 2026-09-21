-- ─────────────────────────────────────────────────────────────────────────
-- Tracking Kit — esquema
--
-- Três tabelas e um log. A diferença pro original, e a razão do kit existir:
--
-- 1. event_type é TEXTO LIVRE, não um CHECK com a lista de etapas dentro.
--    No projeto de origem essa constraint foi alterada três vezes em dois
--    meses — toda etapa nova do funil virava migration. Aqui quem valida é
--    o tracking.config.ts, na aplicação, e etapa nova é uma linha lá.
--
-- 2. workspace_id não tem FK. O kit não sabe (nem precisa saber) se o seu
--    projeto tem "produtos", "organizações", "clientes" ou nada disso. Quem
--    decide quem enxerga o quê é UMA função, logo abaixo, feita pra ser
--    trocada.
--
-- 3. Nenhuma coluna com nome de negócio. Não existe "corretora", "aluno",
--    "plano": existe evento, valor, oferta.
-- ─────────────────────────────────────────────────────────────────────────

-- ── Quem pode ver os dados de um workspace ───────────────────────────────
--
-- ESTA É A FUNÇÃO QUE VOCÊ TROCA. Como vem, qualquer pessoa autenticada vê
-- tudo — que é o certo pra projeto de produto único e time pequeno.
--
-- Multi-produto com acesso por pessoa (o caso do ENGINE):
--   return exists (
--     select 1 from product_access a
--     where a.product_id = p_workspace_id and a.user_id = auth.uid()
--   ) or public.is_admin();
--
-- Multi-tenant por organização:
--   return exists (
--     select 1 from memberships m
--     where m.org_id = p_workspace_id and m.user_id = auth.uid()
--   );
create or replace function public.tracking_pode_ver(p_workspace_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- p_workspace_id não é usado na versão padrão de propósito: single-tenant
  -- não tem o que separar. Fica no parâmetro pra sua versão usar.
  perform p_workspace_id;
  return auth.role() = 'authenticated';
end;
$$;

-- Escrita é mais restrita que leitura: o dado entra por webhook (service
-- role, que ignora RLS) e por rota pública. Pela sessão de um usuário, só
-- edição manual — que na prática é o painel corrigindo algo.
create or replace function public.tracking_pode_escrever(p_workspace_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public.tracking_pode_ver(p_workspace_id);
end;
$$;

-- ── Leads ────────────────────────────────────────────────────────────────
--
-- Um registro por visitante identificado. O id é o próprio lead_id gerado
-- no navegador (uuid v4), e não um id novo do banco: assim o script já sabe
-- a chave antes de qualquer resposta do servidor, e consegue carimbá-la no
-- link do checkout no mesmo clique.
create table if not exists tracking_leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,

  -- Origem, do jeito que chegou na landing.
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  gclid text,
  -- Cookies do pixel da Meta. Guardados porque a API de Conversões casa a
  -- conversão pelo par fbp/fbc muito melhor do que por e-mail com hash.
  fbp text,
  fbc text,
  -- Id da campanha na plataforma de anúncio, quando o link trouxe. É o que
  -- permite cruzar gasto com resultado sem depender do NOME da campanha,
  -- que o gestor de tráfego renomeia no meio do mês.
  meta_campaign_id text,
  google_campaign_id text,

  landing_url text,
  referrer text,

  -- Identidade, preenchida quando algum evento traz. É por ela que um
  -- webhook sem "ref" ainda acha o lead.
  email text,
  phone text,

  first_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_tracking_leads_workspace on tracking_leads (workspace_id, first_seen_at desc);
create index if not exists idx_tracking_leads_email on tracking_leads (email) where email is not null;
create index if not exists idx_tracking_leads_phone on tracking_leads (phone) where phone is not null;

-- ── Eventos ──────────────────────────────────────────────────────────────
--
-- Log append-only de tudo que chegou, de qualquer origem. lead_id fica nulo
-- quando o evento não casou com nenhum lead conhecido — e mesmo assim é
-- gravado, porque "quanto está escapando do rastreio" também é resposta.
create table if not exists tracking_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  lead_id uuid references tracking_leads(id) on delete set null,

  -- Sem CHECK: a lista de etapas vive em tracking.config.ts. Ver o
  -- cabeçalho deste arquivo.
  event_type text not null,
  -- De onde veio ("landing", "stripe", "hotmart", "cademi"…). Serve pro
  -- índice de deduplicação e pra saber qual integração está entregando.
  source text not null,

  email text,
  phone text,
  name text,

  amount_cents integer,
  currency text not null default 'BRL',

  -- Identificação da oferta na plataforma de origem. O id é o que vale: o
  -- nome é texto livre que o time muda sem avisar.
  offer_id text,
  offer_name text,
  payment_method text,

  -- Id do evento na origem. É ele que torna a reentrega idempotente.
  external_id text,
  raw_payload jsonb,

  occurred_at timestamptz not null default now(),
  received_at timestamptz not null default now()
);

create index if not exists idx_tracking_events_workspace on tracking_events (workspace_id, occurred_at desc);
create index if not exists idx_tracking_events_lead on tracking_events (lead_id);
create index if not exists idx_tracking_events_type on tracking_events (workspace_id, event_type, occurred_at desc);

-- Retry de rede não vira evento duplicado.
create unique index if not exists idx_tracking_events_dedupe
  on tracking_events (source, external_id)
  where external_id is not null;

-- ── Endpoints de webhook ─────────────────────────────────────────────────
--
-- Um por (workspace, fonte, plataforma). O segredo é guardado cifrado: no
-- caso do Stripe ele é o "whsec_…" da assinatura; nas outras plataformas é
-- um token que o kit gera e que a origem devolve no Authorization.
create table if not exists tracking_webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,

  -- Casa com FonteDeDados.kind do config.
  kind text not null,
  -- Casa com uma chave do registro de adapters.
  platform text not null default 'generico',

  endpoint_slug text not null unique,
  encrypted_secret text not null,
  active boolean not null default true,

  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_tracking_endpoints_workspace on tracking_webhook_endpoints (workspace_id, kind);

-- ── Log das chamadas ─────────────────────────────────────────────────────
--
-- Guarda o payload cru de tudo que bateu no endpoint, aceito ou não. É a
-- única forma de responder "a plataforma mandou mesmo?" sem pedir print pro
-- suporte deles.
create table if not exists tracking_webhook_log (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references tracking_webhook_endpoints(id) on delete cascade,
  raw_payload jsonb not null,
  accepted boolean not null,
  -- Quando accepted = false, isto distingue "recusado" de "ignorado de
  -- propósito" (payload que nenhum adapter reconhece). São coisas
  -- diferentes e o painel mostra com pesos diferentes.
  error text,
  received_at timestamptz not null default now()
);

create index if not exists idx_tracking_webhook_log_endpoint
  on tracking_webhook_log (endpoint_id, received_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────
--
-- Toda escrita de verdade entra pela service role (webhooks e rotas
-- públicas), que ignora RLS. Estas políticas governam o que a SESSÃO de uma
-- pessoa logada enxerga no painel.

alter table tracking_leads enable row level security;
alter table tracking_events enable row level security;
alter table tracking_webhook_endpoints enable row level security;
alter table tracking_webhook_log enable row level security;

drop policy if exists tracking_leads_select on tracking_leads;
create policy tracking_leads_select on tracking_leads
  for select using (public.tracking_pode_ver(workspace_id));

drop policy if exists tracking_leads_write on tracking_leads;
create policy tracking_leads_write on tracking_leads
  for all using (public.tracking_pode_escrever(workspace_id))
  with check (public.tracking_pode_escrever(workspace_id));

drop policy if exists tracking_events_select on tracking_events;
create policy tracking_events_select on tracking_events
  for select using (public.tracking_pode_ver(workspace_id));

drop policy if exists tracking_events_write on tracking_events;
create policy tracking_events_write on tracking_events
  for all using (public.tracking_pode_escrever(workspace_id))
  with check (public.tracking_pode_escrever(workspace_id));

-- O segredo cifrado mora aqui. Mesmo cifrado, a linha diz qual plataforma
-- está ligada e qual o slug — que é metade do caminho pra forjar chamada.
-- Por isso endpoint é escrita restrita: leitura livre pra quem vê o
-- workspace, escrita pela mesma regra (ajuste pra admin se o seu projeto
-- tiver o conceito).
drop policy if exists tracking_endpoints_select on tracking_webhook_endpoints;
create policy tracking_endpoints_select on tracking_webhook_endpoints
  for select using (public.tracking_pode_ver(workspace_id));

drop policy if exists tracking_endpoints_write on tracking_webhook_endpoints;
create policy tracking_endpoints_write on tracking_webhook_endpoints
  for all using (public.tracking_pode_escrever(workspace_id))
  with check (public.tracking_pode_escrever(workspace_id));

-- O log não tem workspace_id próprio: ele o herda do endpoint.
drop policy if exists tracking_webhook_log_select on tracking_webhook_log;
create policy tracking_webhook_log_select on tracking_webhook_log
  for select using (
    exists (
      select 1 from tracking_webhook_endpoints e
      where e.id = endpoint_id and public.tracking_pode_ver(e.workspace_id)
    )
  );
