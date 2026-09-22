-- A lista da equipe deixa de ser legível por qualquer conta autenticada.
--
-- A política era `auth.role() = 'authenticated'`: bastava ter sessão. E
-- criar sessão ficou a um clique quando o login com Google entrou — quem se
-- cadastra nasce como 'pending', não alcança dado de cliente (sem linha em
-- product_access o resto fica fechado), mas conseguia LISTAR a equipe:
-- nome, papel e status de todo mundo, direto no PostgREST, antes de
-- qualquer aprovação.
--
-- Agora são três caminhos, e o primeiro é o que evita quebrar o app:
--
-- 1. O PRÓPRIO PERFIL, SEMPRE. Sem isso, quem está pendente não consegue
--    ler a própria linha — e é exatamente lendo `status` que o layout
--    descobre que a pessoa é pendente pra mandá-la pra /pendente. A
--    checagem viraria `undefined`, ninguém seria redirecionado, e o
--    pendente entraria numa versão quebrada do app em vez de na tela de
--    espera.
-- 2. A equipe, pra quem já foi aprovado.
-- 3. Admin, sempre — inclusive pra não perder o painel de aprovação se um
--    dia um admin ficar com status diferente de 'approved'.
--
-- eh_aprovado() e is_admin() são `security definer`: elas consultam
-- profiles por dentro, e é isso que evita a política recursionar sobre a
-- própria tabela.

-- O DROP É A PARTE QUE IMPORTA. Política permissiva no Postgres SOMA com as
-- outras (OR), então criar a nova sem derrubar a antiga não apertaria nada:
-- o `auth.role() = 'authenticated'` continuaria liberando tudo, e a
-- migration pareceria ter funcionado. O nome da antiga é
-- "profiles_select_authenticated", da 0001.
drop policy if exists "profiles_select_authenticated" on profiles;
drop policy if exists "profiles_select" on profiles;

create policy "profiles_select" on profiles
  for select using (
    auth.uid() = id
    or public.eh_aprovado()
    or public.is_admin()
  );
