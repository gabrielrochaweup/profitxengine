-- A 0029 marcou needs_realtime_update = true em qualquer mensagem que só
-- MENCIONA "TOP 5" no texto corrido (ex: "TOP 5 ACUMULANDO!"), não apenas
-- as que de fato mostram o ranking. A tarja deve aparecer só em quem tem o
-- bloco ${top5_bloco} de verdade — desmarca o resto.
update message_dynamic_slots
set needs_realtime_update = false
where needs_realtime_update = true
  and template not like '%${top5_bloco}%';
