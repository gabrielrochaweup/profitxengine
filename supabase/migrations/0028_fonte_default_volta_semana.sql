-- Reverte a 0021: o padrão do seletor Dia/Semana/Mês/Total das dinâmicas
-- volta de "dia" pra "semana" (pedido do usuário). Mesma lógica da 0021 —
-- atualiza em massa os slots que ainda estão no valor default anterior em
-- vez de tratar como decisão deliberada por slot.
update message_dynamic_slots
set fonte_default = 'semana'
where fonte_default = 'dia';

alter table message_dynamic_slots
  alter column fonte_default set default 'semana';
