-- Estado de cada checkout: ativo, teste ou pausado.
--
-- Até aqui um endpoint só tinha "active" (liga/desliga). Pra colocar um
-- checkout novo em paralelo ao que já vende, sem parar nada, precisa de um
-- meio-termo:
--
--   ativo   → grava a venda, entra nos KPIs e manda Purchase pra Meta
--   teste   → recebe o pedido e CONFERE (o sck chegou? achou o lead?), mas não
--             grava a venda, não conta nos KPIs, não manda nada pra Meta e
--             não dispara mensagem pro comprador
--   pausado → recusa a chamada
--
-- "active" continua existindo e continua valendo "o webhook responde":
-- fica verdadeiro em ativo e em teste, falso só em pausado. O app mantém os
-- dois em sincronia ao trocar o estado.
--
-- Quem já estava desligado vira "pausado"; o resto continua "ativo".

alter table tracking_webhook_endpoints
  add column if not exists modo text not null default 'ativo'
  check (modo in ('ativo', 'teste', 'pausado'));

update tracking_webhook_endpoints
  set modo = 'pausado'
  where active = false and modo = 'ativo';
