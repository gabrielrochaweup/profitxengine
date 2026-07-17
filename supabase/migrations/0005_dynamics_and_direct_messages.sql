-- Fase 4.5: Dinâmicas de Grupo (calculadora + templates, portado dos HTMLs de
-- referência) + Direct dos Alunos + performance de trading centralizada.

-- Performance real de trading (Pepe/Live/Copy) por janela — fonte central de
-- números usada nos cálculos das dinâmicas e no contexto de geração.
create table trading_performance_stats (
  id uuid primary key default gen_random_uuid(),
  product text check (product in ('pepe', 'live', 'copy')) not null,
  time_window text check (time_window in ('dia', 'semana', 'mes', 'total')) not null,
  wins int not null default 0,
  losses int not null default 0,
  rendimento_pct numeric,
  updated_by uuid references profiles(id),
  updated_at timestamptz default now() not null,
  unique (product, time_window)
);

-- Config global de cálculo (singleton: cotação, payouts, banca, entradas).
create table trading_config (
  id int primary key default 1,
  cotacao numeric not null default 5.50,
  payout_copy numeric not null default 72,
  payout_pepe_live numeric not null default 72,
  banca_copy numeric not null default 5000,
  entrada_pepe numeric not null default 10,
  entrada_live numeric not null default 50,
  updated_by uuid references profiles(id),
  updated_at timestamptz default now() not null,
  constraint trading_config_singleton check (id = 1)
);

-- Dinâmicas de Grupo (temas de campanha do dia: Batalha, Bônus, etc.),
-- editáveis pela equipe dentro do app.
create table message_dynamics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  icon text,
  subtitle text,
  rules text[] default '{}',
  vagas_config jsonb default '{}'::jsonb,
  rotating_banks jsonb default '{}'::jsonb,
  extra_vars jsonb default '{}'::jsonb,
  top5_config jsonb,
  active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Slots de mensagem (24 a 41 por dinâmica), com o template de texto e metadados.
create table message_dynamic_slots (
  id uuid primary key default gen_random_uuid(),
  dynamic_id uuid references message_dynamics(id) on delete cascade not null,
  position int not null,
  msg_key text not null,
  time_label text,
  role_label text,
  cta_tags text[] default '{}',
  template text not null,
  media_suggestion text,
  expert_hint text,
  has_fonte_selector boolean not null default false,
  fonte_default text,
  created_at timestamptz default now() not null,
  unique (dynamic_id, msg_key)
);

-- Qual dinâmica rodou em cada dia do calendário + overrides manuais de fonte por slot.
create table daily_dynamic_selection (
  id uuid primary key default gen_random_uuid(),
  scheduled_date date not null unique,
  dynamic_id uuid references message_dynamics(id),
  fonte_overrides jsonb default '{}'::jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Mensagens individuais (Direct) para alunos, segmentadas.
create table direct_messages (
  id uuid primary key default gen_random_uuid(),
  scheduled_date date not null,
  student_segment text,
  text_prompt_id uuid references prompts(id),
  image_prompt_id uuid references prompts(id),
  generated_text text,
  generated_image_url text,
  status text check (status in ('rascunho', 'aprovada', 'enviada')) default 'rascunho' not null,
  result text check (result in ('funcionou', 'nao_funcionou')),
  notes text,
  tema text,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

create index idx_direct_messages_date on direct_messages(scheduled_date);
create index idx_direct_messages_segment on direct_messages(student_segment);
create index idx_message_dynamic_slots_dynamic on message_dynamic_slots(dynamic_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table trading_performance_stats enable row level security;
alter table trading_config enable row level security;
alter table message_dynamics enable row level security;
alter table message_dynamic_slots enable row level security;
alter table daily_dynamic_selection enable row level security;
alter table direct_messages enable row level security;

create policy "trading_stats_select_authenticated" on trading_performance_stats
  for select using (auth.role() = 'authenticated');
create policy "trading_stats_write_editor_admin" on trading_performance_stats
  for all using (public.current_user_role() in ('editor', 'admin'))
  with check (public.current_user_role() in ('editor', 'admin'));

create policy "trading_config_select_authenticated" on trading_config
  for select using (auth.role() = 'authenticated');
create policy "trading_config_write_editor_admin" on trading_config
  for all using (public.current_user_role() in ('editor', 'admin'))
  with check (public.current_user_role() in ('editor', 'admin'));

create policy "message_dynamics_select_authenticated" on message_dynamics
  for select using (auth.role() = 'authenticated');
create policy "message_dynamics_write_editor_admin" on message_dynamics
  for all using (public.current_user_role() in ('editor', 'admin'))
  with check (public.current_user_role() in ('editor', 'admin'));

create policy "message_dynamic_slots_select_authenticated" on message_dynamic_slots
  for select using (auth.role() = 'authenticated');
create policy "message_dynamic_slots_write_editor_admin" on message_dynamic_slots
  for all using (public.current_user_role() in ('editor', 'admin'))
  with check (public.current_user_role() in ('editor', 'admin'));

create policy "daily_dynamic_selection_select_authenticated" on daily_dynamic_selection
  for select using (auth.role() = 'authenticated');
create policy "daily_dynamic_selection_insert_editor_admin" on daily_dynamic_selection
  for insert with check (public.current_user_role() in ('editor', 'admin'));
create policy "daily_dynamic_selection_update_editor_admin" on daily_dynamic_selection
  for update using (public.current_user_role() in ('editor', 'admin'));
create policy "daily_dynamic_selection_delete_owner_or_admin" on daily_dynamic_selection
  for delete using (created_by = auth.uid() or public.is_admin());

create policy "direct_messages_select_all" on direct_messages
  for select using (auth.role() = 'authenticated');
create policy "direct_messages_insert_editor_admin" on direct_messages
  for insert with check (public.current_user_role() in ('editor', 'admin'));
create policy "direct_messages_update_own_or_admin" on direct_messages
  for update using (created_by = auth.uid() or public.is_admin());
create policy "direct_messages_delete_own_or_admin" on direct_messages
  for delete using (created_by = auth.uid() or public.is_admin());

-- Linha singleton de config, com defaults iguais aos dos HTMLs de referência.
insert into trading_config (id) values (1) on conflict (id) do nothing;
