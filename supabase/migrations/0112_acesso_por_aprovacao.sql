-- Quem foi aprovado passa a enxergar os produtos ativos, sem liberação
-- individual.
--
-- O modelo antigo tinha dois portões em série: um admin aprovava o cadastro
-- (profiles.status = 'approved') e DEPOIS precisava marcar a pessoa produto a
-- produto em product_access. Na prática o segundo portão era esquecido — os
-- cinco editores aprovados da equipe estavam sem nenhuma linha, e o efeito
-- não era uma mensagem de "peça acesso": era o app inteiro vazio, com
-- "Você não tem acesso a nenhum produto ainda" em Tracking, Tarefas, Blog e
-- Dashboard. Ninguém relacionava isso a uma caixinha não marcada no Admin.
--
-- Aprovar alguém já é a decisão de confiança. Ela passa a valer sozinha.
--
-- UMA função resolve tudo: has_product_access() é o que as 91 políticas de
-- RLS deste banco chamam. Mudando o corpo dela, nenhuma política precisa ser
-- reescrita — e não há risco de deixar uma pra trás com a regra velha.
create or replace function public.has_product_access(product_id_param uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  -- product_id_param deixa de ser consultado, mas CONTINUA na assinatura de
  -- propósito: é o que mantém as 91 políticas válidas sem tocar em nenhuma.
  select public.eh_aprovado() or public.is_admin();
$$;

-- A tabela product_access e as linhas dela ficam onde estão.
--
-- Nada mais lê essas linhas pra decidir acesso, mas apagá-las seria destruir
-- o registro de quem liberou o quê — e é o que permite voltar atrás
-- restaurando o corpo antigo da função, sem perder nada.
--
-- Pra TIRAR alguém agora, os caminhos são dois, e os dois já existem:
--   - mudar o status da pessoa em Admin → Equipe (deixa de ser 'approved');
--   - desativar o produto (products.active = false), que o some pra todos.
