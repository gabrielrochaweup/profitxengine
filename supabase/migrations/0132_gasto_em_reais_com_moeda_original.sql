-- O gasto de anúncio passa a ser SEMPRE em reais em spend_cents.
--
-- As contas de anúncio da Meta são em dólar (CA 06 e CA 04 são USD), e a
-- API devolve o "spend" na moeda da conta. Até aqui esse número entrava
-- direto em spend_cents e todas as telas o liam como real: US$ 644 virava
-- "R$ 644", e ROAS, CPA e lucro comparavam dólar de gasto com real de venda.
--
-- Agora o sync converte cada dia pela cotação daquele dia e guarda os três:
--   spend_cents          → em reais (o que todas as telas e relatórios usam)
--   gasto_original_cents → como veio da plataforma, na moeda da conta
--   moeda                → a moeda da conta (USD, BRL...)
--   cambio               → a cotação usada na conversão (1 se já era BRL)
--
-- As linhas que já existem ficam com moeda nula até a próxima sincronização,
-- que reescreve os últimos 30 dias (todo o gasto salvo hoje está nessa janela).

alter table ad_campaign_spend
  add column if not exists moeda text,
  add column if not exists gasto_original_cents integer,
  add column if not exists cambio numeric(12, 6);

alter table ad_entity_spend
  add column if not exists moeda text,
  add column if not exists gasto_original_cents integer,
  add column if not exists cambio numeric(12, 6);
