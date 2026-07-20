-- Simplifica o registro de performance de trading: em vez de contagem
-- bruta de wins/losses ("placar", ex: 30x10), passa a guardar direto a %
-- de acerto por janela (dia/semana/mês/total). Faz backfill a partir dos
-- valores existentes antes de derrubar as colunas antigas, pra não perder
-- o dado já preenchido. Lucro em R$ do Pepe/Live saiu do app (dependia da
-- contagem real de operações, que deixou de existir); Copy Trader não é
-- afetado, pois seu rendimento já era só percentual (rendimento_pct + banca).

alter table trading_performance_stats
  add column if not exists acerto_pct numeric not null default 0;

update trading_performance_stats
  set acerto_pct = case
    when (wins + losses) > 0 then round((wins::numeric / (wins + losses)) * 100)
    else 0
  end;

alter table trading_performance_stats
  drop column wins,
  drop column losses;
