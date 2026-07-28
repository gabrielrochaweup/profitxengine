-- A 0038 (prompts da Sessão Kamikaze) acabou rodando duas vezes por engano
-- num teste anterior — remove a duplicata de cada uma das 29 mensagens,
-- mantendo a linha de menor id (conteúdo idêntico nas duas, confirmado
-- antes de rodar isso).
delete from image_prompt_templates a
using image_prompt_templates b
where a.name = b.name
  and a.name like 'Kamikaze %'
  and a.id > b.id;
