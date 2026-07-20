-- Resultado do dia: a equipe marca a dinâmica do dia como concluída e
-- preenche os números reais (volume de operação, depósitos, faturamento).
-- Fica no mesmo registro de daily_dynamic_selection (1 linha por dia, já
-- ligada à dinâmica que rodou naquele dia) em vez de uma tabela nova —
-- evita join extra e mantém "o que rodou + como foi" juntos.

alter table daily_dynamic_selection
  add column concluded boolean not null default false,
  add column concluded_at timestamptz,
  add column concluded_by uuid references profiles(id),
  add column pepe_pessoas int,
  add column pepe_valor numeric,
  add column live_pessoas int,
  add column live_valor numeric,
  add column copy_pessoas int,
  add column copy_valor numeric,
  add column depositos_valor numeric,
  add column depositos_qtd int,
  add column faturamento_bruto numeric,
  add column faturamento_liquido numeric,
  add column observacoes text;
