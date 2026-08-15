-- Backup histórico do conteúdo das Dinâmicas do Dia antes da revisão
-- jurídica das copys (troca de afirmações de risco/garantia por
-- "potencial"). Guarda uma cópia completa (regras, bancos rotativos,
-- variáveis extras e todas as mensagens) por dinâmica no momento do
-- snapshot — registro histórico, nunca editado depois de criado.
create table dynamic_snapshots (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  dynamic_slug text not null,
  dynamic_name text not null,
  dynamic_icon text,
  rules text[] not null default '{}',
  rotating_banks jsonb not null default '{}'::jsonb,
  extra_vars jsonb not null default '{}'::jsonb,
  slots jsonb not null default '[]'::jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table dynamic_snapshots enable row level security;

create policy "dynamic_snapshots_select_all" on dynamic_snapshots
  for select using (auth.role() = 'authenticated');
create policy "dynamic_snapshots_insert_editor_admin" on dynamic_snapshots
  for insert with check (public.current_user_role() in ('editor', 'admin'));
create policy "dynamic_snapshots_delete_own_or_admin" on dynamic_snapshots
  for delete using (created_by = auth.uid() or public.is_admin());
