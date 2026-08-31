-- Bug achado testando em produção: o índice único de tracking_events
-- (source, external_id) foi criado como PARCIAL ("where external_id is
-- not null", 0067). Postgres não aceita índice parcial como alvo de
-- ON CONFLICT a menos que a mesma cláusula WHERE apareça no ON CONFLICT —
-- e o supabase-js não dá suporte a isso, então todo upsert em
-- tracking_events (collect + os 3 webhooks) falhava com
-- "42P10: there is no unique or exclusion constraint matching the ON
-- CONFLICT specification".
--
-- A cláusula parcial nem era necessária: unique constraint normal do
-- Postgres já trata NULL como distinto de qualquer outro NULL (múltiplas
-- linhas com external_id nulo continuam permitidas), então uma constraint
-- comum (não-parcial) preserva o comportamento pretendido E funciona como
-- alvo de ON CONFLICT.
drop index if exists idx_tracking_events_source_external_id;

alter table tracking_events
  add constraint tracking_events_source_external_id_key unique (source, external_id);
