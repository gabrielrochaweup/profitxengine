-- Acessos passa a ser área de admin.
--
-- A tabela nasceu liberada pra quem tem acesso ao produto, com o argumento
-- de que a equipe inteira precisa entrar nas contas. A decisão foi revista:
-- aqui moram as senhas das contas da empresa e a anotação de em qual celular
-- está o segundo fator.
--
-- A senha em si já era cifrada (o que vaza numa leitura direta é texto
-- embaralhado), mas o resto da linha não: nome da conta, login, responsável,
-- onde está o 2FA e as observações saem em claro — e, juntos, são metade do
-- caminho pra entrar.
--
-- A tela e as rotas /api/acessos já exigem admin. Esta política fecha o
-- caminho que sobrava: chamar o PostgREST direto com o token de um editor.

drop policy if exists "acessos_produto" on acessos;

create policy "acessos_admin" on acessos
  for all using (public.is_admin() and public.has_product_access(product_id))
  with check (public.is_admin() and public.has_product_access(product_id));
