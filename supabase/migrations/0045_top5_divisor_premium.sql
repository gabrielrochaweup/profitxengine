-- A Premium é a única dinâmica com TOP5 que nunca teve linha divisória
-- (━━━) em volta de ${top5_bloco} — a Maratona já tinha isso escrito no
-- template original. Adiciona a mesma divisão antes/depois nas 6 mensagens
-- da Premium que usam o bloco.
update message_dynamic_slots set template = replace(template, '
${top5_bloco}
⬇️', '
━━━━━━━━━━━━━━━━━━━
${top5_bloco}
━━━━━━━━━━━━━━━━━━━
⬇️') where id = 'eba64bdd-3229-4810-9763-2c8346128d48';
update message_dynamic_slots set template = replace(template, '
${top5_bloco}
⬇️', '
━━━━━━━━━━━━━━━━━━━
${top5_bloco}
━━━━━━━━━━━━━━━━━━━
⬇️') where id = '7dad37de-038f-4889-84f6-0b7e86a4edc4';
update message_dynamic_slots set template = replace(template, '
${top5_bloco}
⬇️', '
━━━━━━━━━━━━━━━━━━━
${top5_bloco}
━━━━━━━━━━━━━━━━━━━
⬇️') where id = 'def66a8c-204f-470f-be69-8c28107eef80';
update message_dynamic_slots set template = replace(template, '
${top5_bloco}
⬇️', '
━━━━━━━━━━━━━━━━━━━
${top5_bloco}
━━━━━━━━━━━━━━━━━━━
⬇️') where id = '6a52bea0-5ec9-46f6-9ee2-dbd466c56f70';
update message_dynamic_slots set template = replace(template, '
${top5_bloco}
⬇️', '
━━━━━━━━━━━━━━━━━━━
${top5_bloco}
━━━━━━━━━━━━━━━━━━━
⬇️') where id = '149f86c5-a0a8-4f1b-8d49-29c167476ae8';
update message_dynamic_slots set template = replace(template, '
${top5_bloco}
⬇️', '
━━━━━━━━━━━━━━━━━━━
${top5_bloco}
━━━━━━━━━━━━━━━━━━━
⬇️') where id = '98739c0c-d609-4867-a6e2-d11633f6cc9f';
