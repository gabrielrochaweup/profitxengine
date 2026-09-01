-- Botão "Testar endpoint": chama o próprio webhook com um payload sintético
-- (mesmo formato que a plataforma real mandaria) pra confirmar que
-- URL+token+adapter estão certos ANTES de colar isso no painel externo,
-- em vez de só saber se deu certo esperando o primeiro evento real chegar.
alter table tracking_webhook_endpoints
  add column last_test_at timestamptz,
  add column last_test_ok boolean;
