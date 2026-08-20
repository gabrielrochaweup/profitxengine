-- Data/hora de vencimento da tarefa — usada pro indicador de urgência
-- (verde/amarelo/vermelho) e pra mostrar no card do quadro.
alter table tasks add column due_at timestamptz;
