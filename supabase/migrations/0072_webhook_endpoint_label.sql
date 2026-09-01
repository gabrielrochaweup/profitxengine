-- Suporte a múltiplas páginas de venda / checkouts / áreas de membros por
-- produto: até aqui dava pra criar vários endpoints do mesmo tipo+plataforma
-- (nada impedia), mas todos apareciam com o mesmo rótulo na lista ("Checkout
-- · hotmart" duas vezes, por exemplo), sem jeito de saber qual é qual. Um
-- "label" livre resolve isso — mesmo padrão já usado em
-- ad_platform_credentials pra diferenciar várias contas Meta/Google.
alter table tracking_webhook_endpoints
  add column label text;
