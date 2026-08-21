-- Ordem manual dos anexos de tarefa — importa quando o anexo é um carrossel
-- (ex: post de Instagram), onde a ordem das imagens tem que ficar correta.
-- Escopo por (task_id, variant_id), no mesmo padrão de tasks.position
-- (escopado por column_id): cada variação (Português/Espanhol/Inglês/"sem
-- variação") tem sua própria sequência independente.
alter table task_attachments add column position int not null default 0;

with ordered as (
  select id, row_number() over (partition by task_id, variant_id order by created_at) - 1 as rn
  from task_attachments
)
update task_attachments ta
set position = ordered.rn
from ordered
where ordered.id = ta.id;

create index idx_task_attachments_position on task_attachments(task_id, variant_id, position);
