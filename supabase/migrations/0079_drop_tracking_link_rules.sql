-- Reverte a tabela tracking_link_rules criada numa tentativa anterior
-- (registrar link no banco) — trocada por uma abordagem sem estado: o
-- Gerador de link agora entrega a URL já com "ref="/"sck=" vazio embutido
-- nela mesma, e o script de rastreamento (pixel.js) preenche isso sozinho
-- no clique, sem precisar consultar nada salvo no banco.
drop table if exists tracking_link_rules;
