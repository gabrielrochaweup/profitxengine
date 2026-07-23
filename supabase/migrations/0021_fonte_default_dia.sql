-- Muda o padrão do seletor Dia/Semana/Mês/Total das dinâmicas de "semana"
-- para "dia" (pedido do usuário). Todos os 109 slots com seletor de fonte
-- hoje têm fonte_default = 'semana' (valor herdado da criação), então
-- atualizamos em massa em vez de deixar como decisão deliberada por slot.
update message_dynamic_slots
set fonte_default = 'dia'
where fonte_default = 'semana';

alter table message_dynamic_slots
  alter column fonte_default set default 'dia';
