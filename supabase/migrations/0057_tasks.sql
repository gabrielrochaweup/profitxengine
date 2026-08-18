-- Aba "Tarefas": quadro Kanban por produto (colunas + tarefas + anexos).
-- Dado isolado por product_id desde o início — é tabela nova, sem
-- retrofit de dado existente.

-- Reaproveitado por Tarefas agora e pelas próximas tabelas com dado
-- isolado por produto (Prompts/Biblioteca de Imagens, quando chegar a vez).
create or replace function public.has_product_access(product_id_param uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from product_access where product_id = product_id_param and user_id = auth.uid()
  );
$$;

create table task_columns (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  column_id uuid not null references task_columns(id) on delete cascade,
  title text not null,
  description text,
  position int not null default 0,
  completed boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  file_type text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table task_columns enable row level security;
alter table tasks enable row level security;
alter table task_attachments enable row level security;

create policy "task_columns_select" on task_columns
  for select using (public.has_product_access(product_id));
create policy "task_columns_write" on task_columns
  for all using (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id))
  with check (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id));

create policy "tasks_select" on tasks
  for select using (public.has_product_access(product_id));
create policy "tasks_write" on tasks
  for all using (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id))
  with check (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id));

create policy "task_attachments_select" on task_attachments
  for select using (public.has_product_access(product_id));
create policy "task_attachments_write" on task_attachments
  for all using (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id))
  with check (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id));

-- Bucket de anexos (mesmo padrão de reference-images, 0016): público pra
-- leitura, escrita só autenticado. Sem restrição de tipo de arquivo.
insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', true)
on conflict (id) do nothing;

create policy "task_attachments_bucket_select_public"
  on storage.objects for select
  using (bucket_id = 'task-attachments');
create policy "task_attachments_bucket_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'task-attachments');
create policy "task_attachments_bucket_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'task-attachments');

-- Semente: 3 colunas padrão pro PROFITX, pra não abrir a tela vazia.
insert into task_columns (product_id, name, position)
select products.id, c.name, c.position
from products, (values ('A Fazer', 0), ('Em Andamento', 1), ('Concluído', 2)) as c(name, position)
where products.slug = 'profitx';
