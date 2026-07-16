-- PROFITX Engine — schema inicial (Fase 1)
-- Tabelas, triggers e Row Level Security conforme especificação do produto.

create extension if not exists pgcrypto;

-- ============================================================
-- Perfis e papéis
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('admin', 'editor', 'viewer')) default 'editor' not null,
  created_at timestamptz default now() not null,
  last_active_at timestamptz
);

-- Função auxiliar (security definer) para checar o papel do usuário autenticado
-- sem disparar recursão de RLS dentro das próprias políticas de profiles.
create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role from profiles where id = auth.uid()) = 'admin', false);
$$;

-- Cria automaticamente uma linha em profiles quando um usuário se cadastra no Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'editor');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Chaves de API (criptografadas em memória via app; coluna só guarda o payload cifrado)
-- ============================================================
create table if not exists ai_credentials (
  id uuid primary key default gen_random_uuid(),
  provider text check (provider in ('openai', 'anthropic')) not null,
  encrypted_key text not null,
  is_valid boolean default false not null,
  last_validated_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null,
  unique (provider)
);

-- ============================================================
-- Biblioteca de prompts
-- ============================================================
create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text check (category in ('conversa', 'mensagem', 'imagem', 'email')) not null,
  content text not null,
  tags text[],
  usage_count int default 0 not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

-- ============================================================
-- Conversas simuladas (WhatsApp/Instagram)
-- ============================================================
create table if not exists fake_conversations (
  id uuid primary key default gen_random_uuid(),
  platform text check (platform in ('whatsapp', 'instagram')) not null,
  title text,
  contact_name text,
  contact_avatar_url text,
  contact_status text,
  messages jsonb not null default '[]',
  prompt_id uuid references prompts(id) on delete set null,
  tema text,
  export_format text,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

-- ============================================================
-- Calendário de mensagens de engajamento
-- ============================================================
create table if not exists engagement_messages (
  id uuid primary key default gen_random_uuid(),
  scheduled_date date not null,
  text_prompt_id uuid references prompts(id) on delete set null,
  image_prompt_id uuid references prompts(id) on delete set null,
  generated_text text,
  generated_image_url text,
  status text check (status in ('rascunho', 'aprovada', 'enviada')) default 'rascunho' not null,
  result text check (result in ('funcionou', 'nao_funcionou')),
  notes text,
  tema text,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

-- ============================================================
-- E-mails
-- ============================================================
create table if not exists email_campaigns (
  id uuid primary key default gen_random_uuid(),
  scheduled_date date not null,
  subject text,
  preview_text text,
  body_html text,
  news_reference text,
  prompt_id uuid references prompts(id) on delete set null,
  tema text,
  status text check (status in ('rascunho', 'pronto', 'enviado')) default 'rascunho' not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

-- ============================================================
-- Log de uso de IA
-- ============================================================
create table if not exists ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  module text check (module in ('conversa', 'mensagem', 'imagem', 'email')) not null,
  provider text,
  model text,
  tokens_used int,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

-- Índices de apoio para os cruzamentos entre módulos (mesmo tema no mesmo dia)
create index if not exists idx_engagement_messages_date on engagement_messages(scheduled_date);
create index if not exists idx_engagement_messages_tema on engagement_messages(tema);
create index if not exists idx_email_campaigns_date on email_campaigns(scheduled_date);
create index if not exists idx_email_campaigns_tema on email_campaigns(tema);
create index if not exists idx_fake_conversations_tema on fake_conversations(tema);
create index if not exists idx_prompts_category on prompts(category);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table ai_credentials enable row level security;
alter table prompts enable row level security;
alter table fake_conversations enable row level security;
alter table engagement_messages enable row level security;
alter table email_campaigns enable row level security;
alter table ai_usage_log enable row level security;

-- profiles: qualquer usuário autenticado pode ler todos os perfis (para exibir nomes/avatares);
-- só o próprio usuário ou um admin pode editar; só admin altera o papel de outros.
create policy "profiles_select_authenticated" on profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_update_self_or_admin" on profiles
  for update using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_admin" on profiles
  for insert with check (public.is_admin());

-- ai_credentials: somente admin lê/escreve (contém material sensível cifrado)
create policy "ai_credentials_admin_all" on ai_credentials
  for all using (public.is_admin()) with check (public.is_admin());

-- Regra geral para as tabelas de conteúdo: admin vê tudo; editor cria/edita o
-- próprio conteúdo e lê o de todos; viewer só lê.
create policy "prompts_select_all" on prompts
  for select using (auth.role() = 'authenticated');
create policy "prompts_insert_editor_admin" on prompts
  for insert with check (public.current_user_role() in ('editor', 'admin'));
create policy "prompts_update_own_or_admin" on prompts
  for update using (created_by = auth.uid() or public.is_admin());
create policy "prompts_delete_own_or_admin" on prompts
  for delete using (created_by = auth.uid() or public.is_admin());

create policy "fake_conversations_select_all" on fake_conversations
  for select using (auth.role() = 'authenticated');
create policy "fake_conversations_insert_editor_admin" on fake_conversations
  for insert with check (public.current_user_role() in ('editor', 'admin'));
create policy "fake_conversations_update_own_or_admin" on fake_conversations
  for update using (created_by = auth.uid() or public.is_admin());
create policy "fake_conversations_delete_own_or_admin" on fake_conversations
  for delete using (created_by = auth.uid() or public.is_admin());

create policy "engagement_messages_select_all" on engagement_messages
  for select using (auth.role() = 'authenticated');
create policy "engagement_messages_insert_editor_admin" on engagement_messages
  for insert with check (public.current_user_role() in ('editor', 'admin'));
create policy "engagement_messages_update_own_or_admin" on engagement_messages
  for update using (created_by = auth.uid() or public.is_admin());
create policy "engagement_messages_delete_own_or_admin" on engagement_messages
  for delete using (created_by = auth.uid() or public.is_admin());

create policy "email_campaigns_select_all" on email_campaigns
  for select using (auth.role() = 'authenticated');
create policy "email_campaigns_insert_editor_admin" on email_campaigns
  for insert with check (public.current_user_role() in ('editor', 'admin'));
create policy "email_campaigns_update_own_or_admin" on email_campaigns
  for update using (created_by = auth.uid() or public.is_admin());
create policy "email_campaigns_delete_own_or_admin" on email_campaigns
  for delete using (created_by = auth.uid() or public.is_admin());

-- ai_usage_log: qualquer autenticado insere seu próprio uso; só admin lê tudo,
-- demais usuários só veem os próprios registros.
create policy "ai_usage_log_insert_self" on ai_usage_log
  for insert with check (created_by = auth.uid());
create policy "ai_usage_log_select_self_or_admin" on ai_usage_log
  for select using (created_by = auth.uid() or public.is_admin());
