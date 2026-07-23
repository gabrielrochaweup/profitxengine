-- Pastas customizáveis da Biblioteca de Imagens (mesmo padrão do
-- prompt_categories da Biblioteca de Prompts): o admin cria, renomeia,
-- reordena e exclui à vontade (ex: "PEPE", "DINÂMICAS", "COPY"), e as
-- imagens são arrastadas pra dentro. Sem pasta, a imagem fica no bucket
-- "Sem pasta" (folder_id null) até alguém organizar.
create table image_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

alter table image_folders enable row level security;

create policy "image_folders_select_all" on image_folders
  for select using (auth.role() = 'authenticated');
create policy "image_folders_write_admin_only" on image_folders
  for all using (public.is_admin()) with check (public.is_admin());

alter table generated_images add column folder_id uuid references image_folders(id) on delete set null;

create index if not exists idx_generated_images_folder on generated_images(folder_id);

-- generated_images não tinha policy de update nenhuma até agora (só
-- select/insert/delete) — precisa pra permitir mover imagens entre pastas.
create policy "generated_images_update_admin_only" on generated_images
  for update using (public.is_admin()) with check (public.is_admin());
