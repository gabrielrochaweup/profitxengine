-- Variação de anexo vira um objeto persistido de verdade — antes era só
-- um texto livre derivado dos próprios anexos (task_attachments.variant_label),
-- então uma variação sem nenhum arquivo ainda "sumia" ao reabrir o popup.
create table task_attachment_variants (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table task_attachment_variants enable row level security;

create policy "task_attachment_variants_select" on task_attachment_variants
  for select using (public.has_product_access(product_id));
create policy "task_attachment_variants_write" on task_attachment_variants
  for all using (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id))
  with check (public.current_user_role() in ('editor', 'admin') and public.has_product_access(product_id));

create index idx_task_attachment_variants_task on task_attachment_variants(task_id);

-- Migra os rótulos livres que já existiam (se algum anexo já tinha sido
-- enviado com uma variação marcada) pra variações de verdade.
insert into task_attachment_variants (task_id, product_id, name, position, created_by)
select distinct on (ta.task_id, ta.variant_label)
  ta.task_id, ta.product_id, ta.variant_label, 0, ta.created_by
from task_attachments ta
where ta.variant_label is not null
order by ta.task_id, ta.variant_label, ta.created_at;

alter table task_attachments add column variant_id uuid references task_attachment_variants(id) on delete set null;

update task_attachments ta
set variant_id = v.id
from task_attachment_variants v
where v.task_id = ta.task_id and v.name = ta.variant_label;

alter table task_attachments drop column variant_label;

create index idx_task_attachments_variant on task_attachments(variant_id);

-- Semeia as 3 variações padrão (Português/Espanhol/Inglês) em toda tarefa
-- que ainda não tem nenhuma variação — editáveis depois pelo usuário.
insert into task_attachment_variants (task_id, product_id, name, position)
select t.id, t.product_id, v.name, v.position
from tasks t
cross join (values ('Português', 0), ('Espanhol', 1), ('Inglês', 2)) as v(name, position)
where not exists (select 1 from task_attachment_variants existing where existing.task_id = t.id);
