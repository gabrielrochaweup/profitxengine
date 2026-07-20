-- Limpeza de conteúdo: os templates das dinâmicas foram escritos antes da
-- Adendo 23 (que removeu ${winsP}/${lossP}/${winsL}/${lossL}/${winsC}/${lossC}
-- do motor de variáveis) e alguns ainda têm esse placar bruto hardcoded no
-- texto (ex: "${winsC}x${lossC} | 79% acerto!"). Como a variável não existe
-- mais, ela aparecia literal na mensagem em vez de sumir. Este UPDATE remove
-- o par wins/losses + separador "|" que costuma vir logo depois, mantendo só
-- a % (que já resolve certinho via ${acertoP}/${acertoL}/${acertoC}).
update message_dynamic_slots
set template = regexp_replace(
  template,
  '\$\{wins[PLC]\}\s*[xX×]\s*\$\{loss[PLC]\}\s*(\|\s*)?',
  '',
  'g'
)
where template ~ '\$\{wins[PLC]\}';

-- Rode esta consulta depois pra revisar manualmente o que sobrou (ex: um
-- rótulo "PLACAR da semana:" que é texto editorial, não variável — só você
-- sabe se quer trocar a palavra "placar" ali por algo tipo "Resultado da
-- semana:"). O UPDATE acima não mexe em texto solto, só nas variáveis.
select id, dynamic_id, msg_key, template
from message_dynamic_slots
where template ilike '%placar%' or template ilike '%${wins%' or template ilike '%${loss%';
