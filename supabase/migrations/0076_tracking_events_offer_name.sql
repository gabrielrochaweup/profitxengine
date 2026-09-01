-- Um webhook de checkout recebe compra de qualquer plano/oferta da mesma
-- plataforma (a Onprofit já manda "offer_name" no payload de cada venda) —
-- guarda isso pra dar pra ver depois qual plano cada campanha vende mais,
-- em vez de só "teve uma compra de R$ X".
alter table tracking_events
  add column offer_name text;
