-- Marca os disparos feitos pelo botão de teste do painel. Sem isso, um
-- teste fica idêntico a um envio real na tabela "Disparos" e ainda entra
-- na conta de enviados — quem abrisse o painel depois não saberia dizer
-- se o aluno recebeu de verdade ou se foi alguém testando.
alter table public.sendpulse_dispatch_log add column teste boolean not null default false;
