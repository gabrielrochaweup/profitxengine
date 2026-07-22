-- Biblioteca de Prompts: as 4 categorias fixas (conversa/mensagem/imagem/
-- email) viram colunas totalmente gerenciáveis pelo admin — criar,
-- renomear, reordenar e excluir. As 4 categorias existentes viram as
-- colunas iniciais, com um "slug" estável (não editável pela UI) pra
-- telas que hoje sugerem uma aba inicial (ex: o painel de geração de
-- imagem sempre abre em "imagem") continuarem funcionando mesmo que o
-- admin renomeie a coluna depois — se o slug for excluído, essas telas
-- só caem de volta pra primeira coluna disponível, sem quebrar.

create table prompt_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  position int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null
);

alter table prompt_categories enable row level security;

create policy "prompt_categories_select_all" on prompt_categories
  for select using (auth.role() = 'authenticated');
create policy "prompt_categories_insert_admin_only" on prompt_categories
  for insert with check (public.is_admin());
create policy "prompt_categories_update_admin_only" on prompt_categories
  for update using (public.is_admin()) with check (public.is_admin());
create policy "prompt_categories_delete_admin_only" on prompt_categories
  for delete using (public.is_admin());

insert into prompt_categories (slug, name, position) values
  ('conversa', 'Conversa', 0),
  ('mensagem', 'Mensagem', 1),
  ('imagem', 'Imagem', 2),
  ('email', 'E-mail', 3);

alter table prompts add column category_id uuid references prompt_categories(id);

update prompts p
set category_id = c.id
from prompt_categories c
where c.slug = p.category;

alter table prompts alter column category_id set not null;

drop index if exists idx_prompts_category;
alter table prompts drop column category;

create index idx_prompts_category_id on prompts(category_id);
