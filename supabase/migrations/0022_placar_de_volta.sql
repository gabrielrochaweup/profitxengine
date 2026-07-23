-- Traz de volta o "placar" (vitórias x derrotas) na Performance de Trading,
-- agora JUNTO com o % de acerto (que continua existindo e alimentando as
-- dinâmicas normalmente) — não é uma reversão total da 0012, e sim um campo
-- adicional editável lado a lado.
alter table trading_performance_stats
  add column if not exists wins int not null default 0,
  add column if not exists losses int not null default 0;
