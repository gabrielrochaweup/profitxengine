-- Etiqueta opcional de "variação" nos anexos das tarefas — pra organizar
-- várias versões do mesmo post (ex: "Variação A"/"Variação B") dentro da
-- mesma tarefa, com abas alternáveis na tela em vez de tudo misturado.
alter table task_attachments add column variant_label text;
