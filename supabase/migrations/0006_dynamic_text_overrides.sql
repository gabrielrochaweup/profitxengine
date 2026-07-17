-- Guarda a variação de mensagem "usada" por horário/dia (gerada por IA a
-- partir do template calculado da dinâmica), sem alterar o template original
-- da dinâmica — é um override específico daquele dia.

alter table daily_dynamic_selection
  add column if not exists text_overrides jsonb default '{}'::jsonb;
