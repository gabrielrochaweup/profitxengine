-- Preferência de provedor/modelo de IA por tipo de tarefa (módulo).
-- Editável só por admin em Configurações; lida por qualquer autenticado
-- para saber qual provedor está ativo em cada gerador.

create table if not exists ai_provider_settings (
  module text primary key check (module in ('conversa', 'mensagem', 'imagem', 'email')),
  provider text check (provider in ('openai', 'anthropic')) not null,
  model text not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz default now() not null
);

alter table ai_provider_settings enable row level security;

create policy "ai_provider_settings_select_authenticated" on ai_provider_settings
  for select using (auth.role() = 'authenticated');

create policy "ai_provider_settings_admin_write" on ai_provider_settings
  for insert with check (public.is_admin());

create policy "ai_provider_settings_admin_update" on ai_provider_settings
  for update using (public.is_admin());

create policy "ai_provider_settings_admin_delete" on ai_provider_settings
  for delete using (public.is_admin());
