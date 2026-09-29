-- % da banca arriscada por operação no Copy Trader.
--
-- O "R$ X no dia" das mensagens das dinâmicas sai de rendimento% × banca, e
-- o rendimento% era um campo à parte do placar: mudava o V x D (e o % de
-- acerto junto) e o R$ continuava igual, muitas vezes em R$ 0. Agora, quando
-- o rendimento NÃO vem informado (Vortex ou digitado), ele é estimado do
-- próprio placar:
--
--   rendimento% = (vitórias × payout − derrotas) × entrada_copy_pct
--
-- Esta coluna é o "entrada_copy_pct" da fórmula: quanto da banca vai em cada
-- operação. O payout já existe (payout_copy). Rendimento informado pela
-- Vortex continua valendo sempre — a estimativa só entra quando ele está
-- vazio ou zerado e existe placar.
--
-- Padrão 1 (1% da banca por operação). Ajustável em Configurações >
-- Performance de Trading. Nenhum dado existente é alterado.
alter table trading_config
  add column if not exists entrada_copy_pct numeric not null default 1;
