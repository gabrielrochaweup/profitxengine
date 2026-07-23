-- A 0025 criou top5_stats com enabled default true ("bloco visível"). A
-- semântica mudou: enabled agora significa "usar estes 5 valores fixos" em
-- vez do cálculo fictício crescente — o padrão certo é false (fictício) até
-- alguém preencher o TOP 5 real em Performance de Trading.
alter table top5_stats alter column enabled set default false;
update top5_stats set enabled = false where id = 1;
