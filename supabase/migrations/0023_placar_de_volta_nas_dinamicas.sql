-- Traz de volta o placar (${winsX}x${lossX}) nos templates das dinâmicas,
-- reinserido imediatamente antes de cada "${acertoX}%" — inverso pontual da
-- 0013_strip_placar_mentions.sql, que tinha removido esse trecho quando as
-- variáveis pararam de existir no motor. Agora que winsP/lossP/winsL/lossL/
-- winsC/lossC voltaram a ser calculadas (0022 trouxe wins/losses de volta
-- na trading_performance_stats), o texto pode referenciá-las de novo.
-- Confirmado nos 106 usos atuais: "${acertoX}" sempre é seguido direto por
-- "%", então o replace literal é seguro (sem risco de pegar ocorrência
-- parcial ou fora de contexto).
update message_dynamic_slots
set template = replace(template, '${acertoP}%', '${winsP}x${lossP} · ${acertoP}%')
where position('${acertoP}%' in template) > 0;

update message_dynamic_slots
set template = replace(template, '${acertoL}%', '${winsL}x${lossL} · ${acertoL}%')
where position('${acertoL}%' in template) > 0;

update message_dynamic_slots
set template = replace(template, '${acertoC}%', '${winsC}x${lossC} · ${acertoC}%')
where position('${acertoC}%' in template) > 0;
