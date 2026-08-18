-- Isola por produto: Biblioteca de Prompts + Biblioteca de Imagens (e a
-- tela "Modelos de prompt", que é parte da mesma área). Cada produto passa
-- a ter seu próprio conjunto de prompts, categorias, imagens, pastas e
-- templates de prompt de imagem — nada de um produto aparece pro outro.
-- Mesmo padrão de product_id + has_product_access() já usado em
-- task_columns/tasks/task_attachments (0057).

alter table prompts add column product_id uuid references products(id) on delete cascade;
alter table prompt_categories add column product_id uuid references products(id) on delete cascade;
alter table generated_images add column product_id uuid references products(id) on delete cascade;
alter table image_folders add column product_id uuid references products(id) on delete cascade;
alter table image_prompt_templates add column product_id uuid references products(id) on delete cascade;
alter table image_prompt_characters add column product_id uuid references products(id) on delete cascade;
alter table image_prompt_tones add column product_id uuid references products(id) on delete cascade;
alter table image_prompt_ctas add column product_id uuid references products(id) on delete cascade;

-- Backfill: tudo que já existe é do PROFITX (produto único até agora).
update prompts set product_id = (select id from products where slug = 'profitx') where product_id is null;
update prompt_categories set product_id = (select id from products where slug = 'profitx') where product_id is null;
update generated_images set product_id = (select id from products where slug = 'profitx') where product_id is null;
update image_folders set product_id = (select id from products where slug = 'profitx') where product_id is null;
update image_prompt_templates set product_id = (select id from products where slug = 'profitx') where product_id is null;
update image_prompt_characters set product_id = (select id from products where slug = 'profitx') where product_id is null;
update image_prompt_tones set product_id = (select id from products where slug = 'profitx') where product_id is null;
update image_prompt_ctas set product_id = (select id from products where slug = 'profitx') where product_id is null;

alter table prompts alter column product_id set not null;
alter table prompt_categories alter column product_id set not null;
alter table generated_images alter column product_id set not null;
alter table image_folders alter column product_id set not null;
alter table image_prompt_templates alter column product_id set not null;
alter table image_prompt_characters alter column product_id set not null;
alter table image_prompt_tones alter column product_id set not null;
alter table image_prompt_ctas alter column product_id set not null;

create index idx_prompts_product on prompts(product_id);
create index idx_prompt_categories_product on prompt_categories(product_id);
create index idx_generated_images_product on generated_images(product_id);
create index idx_image_folders_product on image_folders(product_id);
create index idx_image_prompt_templates_product on image_prompt_templates(product_id);
create index idx_image_prompt_characters_product on image_prompt_characters(product_id);
create index idx_image_prompt_tones_product on image_prompt_tones(product_id);
create index idx_image_prompt_ctas_product on image_prompt_ctas(product_id);

-- RLS: troca "todo autenticado vê tudo" por "só quem tem acesso àquele
-- produto vê" (has_product_access(), de 0057); escrita mantém a regra de
-- role de antes + a checagem de produto.
drop policy if exists "prompts_select_all" on prompts;
create policy "prompts_select_all" on prompts
  for select using (public.has_product_access(product_id));
drop policy if exists "prompts_insert_admin_only" on prompts;
create policy "prompts_insert_admin_only" on prompts
  for insert with check (public.is_admin() and public.has_product_access(product_id));
drop policy if exists "prompts_update_admin_only" on prompts;
create policy "prompts_update_admin_only" on prompts
  for update using (public.is_admin() and public.has_product_access(product_id))
  with check (public.is_admin() and public.has_product_access(product_id));
drop policy if exists "prompts_delete_admin_only" on prompts;
create policy "prompts_delete_admin_only" on prompts
  for delete using (public.is_admin() and public.has_product_access(product_id));

drop policy if exists "prompt_categories_select_all" on prompt_categories;
create policy "prompt_categories_select_all" on prompt_categories
  for select using (public.has_product_access(product_id));
drop policy if exists "prompt_categories_insert_admin_only" on prompt_categories;
create policy "prompt_categories_insert_admin_only" on prompt_categories
  for insert with check (public.is_admin() and public.has_product_access(product_id));
drop policy if exists "prompt_categories_update_admin_only" on prompt_categories;
create policy "prompt_categories_update_admin_only" on prompt_categories
  for update using (public.is_admin() and public.has_product_access(product_id))
  with check (public.is_admin() and public.has_product_access(product_id));
drop policy if exists "prompt_categories_delete_admin_only" on prompt_categories;
create policy "prompt_categories_delete_admin_only" on prompt_categories
  for delete using (public.is_admin() and public.has_product_access(product_id));

drop policy if exists "generated_images_select_all" on generated_images;
create policy "generated_images_select_all" on generated_images
  for select using (public.has_product_access(product_id));
drop policy if exists "generated_images_insert_editor_admin" on generated_images;
create policy "generated_images_insert_editor_admin" on generated_images
  for insert with check (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id));
drop policy if exists "generated_images_update_admin_only" on generated_images;
create policy "generated_images_update_admin_only" on generated_images
  for update using (public.is_admin() and public.has_product_access(product_id))
  with check (public.is_admin() and public.has_product_access(product_id));
drop policy if exists "generated_images_delete_own_or_admin" on generated_images;
create policy "generated_images_delete_own_or_admin" on generated_images
  for delete using ((created_by = auth.uid() or public.is_admin()) and public.has_product_access(product_id));

drop policy if exists "image_folders_select_all" on image_folders;
create policy "image_folders_select_all" on image_folders
  for select using (public.has_product_access(product_id));
drop policy if exists "image_folders_write_admin_only" on image_folders;
create policy "image_folders_write_admin_only" on image_folders
  for all using (public.is_admin() and public.has_product_access(product_id))
  with check (public.is_admin() and public.has_product_access(product_id));

drop policy if exists "image_prompt_templates_select_all" on image_prompt_templates;
create policy "image_prompt_templates_select_all" on image_prompt_templates
  for select using (public.has_product_access(product_id));
drop policy if exists "image_prompt_templates_write_admin_only" on image_prompt_templates;
create policy "image_prompt_templates_write_admin_only" on image_prompt_templates
  for all using (public.is_admin() and public.has_product_access(product_id))
  with check (public.is_admin() and public.has_product_access(product_id));

drop policy if exists "image_prompt_characters_select_all" on image_prompt_characters;
create policy "image_prompt_characters_select_all" on image_prompt_characters
  for select using (public.has_product_access(product_id));
drop policy if exists "image_prompt_characters_write_admin_only" on image_prompt_characters;
create policy "image_prompt_characters_write_admin_only" on image_prompt_characters
  for all using (public.is_admin() and public.has_product_access(product_id))
  with check (public.is_admin() and public.has_product_access(product_id));

drop policy if exists "image_prompt_tones_select_all" on image_prompt_tones;
create policy "image_prompt_tones_select_all" on image_prompt_tones
  for select using (public.has_product_access(product_id));
drop policy if exists "image_prompt_tones_write_admin_only" on image_prompt_tones;
create policy "image_prompt_tones_write_admin_only" on image_prompt_tones
  for all using (public.is_admin() and public.has_product_access(product_id))
  with check (public.is_admin() and public.has_product_access(product_id));

drop policy if exists "image_prompt_ctas_select_all" on image_prompt_ctas;
create policy "image_prompt_ctas_select_all" on image_prompt_ctas
  for select using (public.has_product_access(product_id));
drop policy if exists "image_prompt_ctas_write_admin_only" on image_prompt_ctas;
create policy "image_prompt_ctas_write_admin_only" on image_prompt_ctas
  for all using (public.is_admin() and public.has_product_access(product_id))
  with check (public.is_admin() and public.has_product_access(product_id));

-- Índices únicos de nome de pasta agora são por produto (dois produtos
-- podem ter pasta raiz com o mesmo nome sem colidir).
drop index if exists image_folders_name_unique_root;
drop index if exists image_folders_name_unique_child;
create unique index image_folders_name_unique_root on image_folders (product_id, name) where parent_id is null;
create unique index image_folders_name_unique_child on image_folders (product_id, name, parent_id) where parent_id is not null;
