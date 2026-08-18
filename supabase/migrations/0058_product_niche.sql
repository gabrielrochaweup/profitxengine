-- Nicho do produto — usado pra decidir a fonte de notícias mostrada no
-- Dashboard/Calendário/Dinâmicas do Dia (cada produto pode ser de um
-- nicho diferente, ex: cripto/trading vs. saúde/bem-estar). Lista de
-- valores fica em código (src/lib/products.ts NICHE_OPTIONS), não é enum
-- de banco — assim dá pra adicionar opção nova sem migration.
alter table products add column niche text;

update products set niche = 'cripto-trading' where slug = 'profitx';
