-- A aba Configurações do Tracking passa a ser legível por toda a equipe.
--
-- As sub-abas Pessoas e Configurações sumiam pra quem não é admin, e o
-- bloqueio estava em três camadas: o menu (adminOnly), as rotas de API
-- (hasRole "admin") e estas duas políticas. Abrir só as duas primeiras
-- deixaria a tela aparecer vazia — pior que não aparecer, porque parece
-- "não tem nada configurado" em vez de "você não pode ver".
--
-- LEITURA abre; ESCRITA continua sendo de admin aqui dentro. Não é meio
-- termo tímido: todo caminho por onde a interface cria, edita ou rotaciona
-- endpoint passa pelas rotas de /api, que usam a service key e não são
-- afetadas por estas políticas. A regra de quem pode escrever mora lá (e
-- agora é "aprovado"). O que sobra aqui é o acesso DIRETO ao PostgREST com
-- o token do navegador — e pra esse caminho, que nenhuma tela usa, escrever
-- continua trancado.

-- ── Endpoints de webhook ────────────────────────────────────────────────
drop policy if exists "tracking_webhook_endpoints_admin_all" on tracking_webhook_endpoints;

create policy "tracking_webhook_endpoints_admin_write" on tracking_webhook_endpoints
  for all using (public.is_admin()) with check (public.is_admin());

-- encrypted_secret continua nesta tabela e passa a ser legível por aprovado.
-- É texto cifrado com CREDENTIALS_ENCRYPTION_KEY, que só existe no servidor:
-- sem a chave, o que sai daqui não abre. O token em claro só aparece uma vez,
-- na janela de criação, e nunca mais.
create policy "tracking_webhook_endpoints_select_equipe" on tracking_webhook_endpoints
  for select using (public.eh_aprovado() or public.is_admin());

-- ── Contas de anúncio (Meta / Google) ───────────────────────────────────
drop policy if exists "ad_platform_credentials_admin_all" on ad_platform_credentials;

create policy "ad_platform_credentials_admin_write" on ad_platform_credentials
  for all using (public.is_admin()) with check (public.is_admin());

create policy "ad_platform_credentials_select_equipe" on ad_platform_credentials
  for select using (public.eh_aprovado() or public.is_admin());

-- Pode rodar antes ou depois do deploy: sozinha, ela só amplia leitura de
-- tabelas que a tela antiga nem consultava pra quem não é admin.
