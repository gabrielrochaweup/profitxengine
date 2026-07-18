-- PROFITX Engine — banco de gerações de imagem (galeria de reuso por contexto)
-- Toda imagem gerada por IA (dinâmica/slot, gerador livre, Mensagens X1, e-mail)
-- fica registrada aqui, permitindo reabrir um popup de histórico por contexto
-- e reutilizar uma geração anterior em vez de gerar de novo.

create table if not exists generated_images (
  id uuid primary key default gen_random_uuid(),
  context_type text check (context_type in ('dinamica_slot', 'livre_engagement', 'x1_message', 'email')) not null,
  context_id text not null,
  prompt text not null,
  prompt_id uuid references prompts(id) on delete set null,
  image_url text not null,
  provider text not null,
  model text not null,
  format text not null default '1:1',
  quality text not null default 'medium',
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

create index if not exists idx_generated_images_context on generated_images(context_type, context_id, created_at desc);

alter table generated_images enable row level security;

create policy "generated_images_select_all" on generated_images
  for select using (auth.role() = 'authenticated');
create policy "generated_images_insert_editor_admin" on generated_images
  for insert with check (public.current_user_role() in ('editor', 'admin'));
create policy "generated_images_delete_own_or_admin" on generated_images
  for delete using (created_by = auth.uid() or public.is_admin());
