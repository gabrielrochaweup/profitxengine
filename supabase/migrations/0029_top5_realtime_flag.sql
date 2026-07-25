-- 1) A dinâmica "Alavancagem com Maratona" tinha 9 mensagens com o bloco de
-- TOP 5 escrito na mão (números fixos crescendo manualmente por slot, ex:
-- $900, $1.000, $1.100...) em vez de usar ${top5_bloco} — por isso nunca
-- puxavam o valor real/fictício automático e não pegavam a tarja de aviso.
-- Substitui pelo padrão já usado em "Alavancagem Premium".
update message_dynamic_slots
set template = replace(
  template,
  '🏆 *TOP 5 ACUMULADO DO FDS:*

🥇 1º → *$900*
🥈 2º → *$750*
🥉 3º → *$600*
4º → *$450*
5º → *$300*

💡 *Deposite $301 ou mais pra JÁ ENTRAR no TOP 5!*

_Não está no TOP 5? Fique tranquilo — apuração está em andamento e sempre é feito a dupla conferência para que ninguém fique de fora._',
  '${top5_bloco}'
)
where dynamic_id = (select id from message_dynamics where name = 'Alavancagem com Maratona')
  and msg_key = 'S17';

update message_dynamic_slots
set template = replace(
  template,
  '🏆 *TOP 5 ACUMULADO DO FDS:*

🥇 1º → *$1,000*
🥈 2º → *$833*
🥉 3º → *$667*
4º → *$500*
5º → *$333*

💡 *Deposite $334 ou mais pra JÁ ENTRAR no TOP 5!*

_Não está no TOP 5? Fique tranquilo — apuração está em andamento e sempre é feito a dupla conferência para que ninguém fique de fora._',
  '${top5_bloco}'
)
where dynamic_id = (select id from message_dynamics where name = 'Alavancagem com Maratona')
  and msg_key = 'S18';

update message_dynamic_slots
set template = replace(
  template,
  '🏆 *TOP 5 ACUMULADO DO FDS:*

🥇 1º → *$1,100*
🥈 2º → *$917*
🥉 3º → *$733*
4º → *$550*
5º → *$367*

💡 *Deposite $368 ou mais pra JÁ ENTRAR no TOP 5!*

_Não está no TOP 5? Fique tranquilo — apuração está em andamento e sempre é feito a dupla conferência para que ninguém fique de fora._',
  '${top5_bloco}'
)
where dynamic_id = (select id from message_dynamics where name = 'Alavancagem com Maratona')
  and msg_key = 'S19';

update message_dynamic_slots
set template = replace(
  template,
  '🏆 *TOP 5 ACUMULADO DO FDS:*

🥇 1º → *$700*
🥈 2º → *$583*
🥉 3º → *$467*
4º → *$350*
5º → *$233*

💡 *Deposite $234 ou mais pra JÁ ENTRAR no TOP 5!*

_Não está no TOP 5? Fique tranquilo — apuração está em andamento e sempre é feito a dupla conferência para que ninguém fique de fora._',
  '${top5_bloco}'
)
where dynamic_id = (select id from message_dynamics where name = 'Alavancagem com Maratona')
  and msg_key = 'S10';

update message_dynamic_slots
set template = replace(
  template,
  '🏆 *TOP 5 ACUMULADO DO FDS:*

🥇 1º → *$800*
🥈 2º → *$667*
🥉 3º → *$533*
4º → *$400*
5º → *$267*

💡 *Deposite $268 ou mais pra JÁ ENTRAR no TOP 5!*

_Não está no TOP 5? Fique tranquilo — apuração está em andamento e sempre é feito a dupla conferência para que ninguém fique de fora._',
  '${top5_bloco}'
)
where dynamic_id = (select id from message_dynamics where name = 'Alavancagem com Maratona')
  and msg_key = 'S15';

update message_dynamic_slots
set template = replace(
  template,
  '🏆 *TOP 5 ACUMULADO DO FDS:*

🥇 1º → *$1,400*
🥈 2º → *$1,167*
🥉 3º → *$933*
4º → *$700*
5º → *$467*

💡 *Deposite $468 ou mais pra JÁ ENTRAR no TOP 5!*

_Não está no TOP 5? Fique tranquilo — apuração está em andamento e sempre é feito a dupla conferência para que ninguém fique de fora._',
  '${top5_bloco}'
)
where dynamic_id = (select id from message_dynamics where name = 'Alavancagem com Maratona')
  and msg_key = 'D10';

update message_dynamic_slots
set template = replace(
  template,
  '🏆 *TOP 5 ACUMULADO DO FDS:*

🥇 1º → *$1,500*
🥈 2º → *$1,250*
🥉 3º → *$1,000*
4º → *$750*
5º → *$500*

💡 *Deposite $501 ou mais pra JÁ ENTRAR no TOP 5!*

_Não está no TOP 5? Fique tranquilo — apuração está em andamento e sempre é feito a dupla conferência para que ninguém fique de fora._',
  '${top5_bloco}'
)
where dynamic_id = (select id from message_dynamics where name = 'Alavancagem com Maratona')
  and msg_key = 'D15';

update message_dynamic_slots
set template = replace(
  template,
  '🏆 *TOP 5 ACUMULADO DO FDS:*

🥇 1º → *$1,600*
🥈 2º → *$1,333*
🥉 3º → *$1,067*
4º → *$800*
5º → *$533*

💡 *Deposite $534 ou mais pra JÁ ENTRAR no TOP 5!*

_Não está no TOP 5? Fique tranquilo — apuração está em andamento e sempre é feito a dupla conferência para que ninguém fique de fora._',
  '${top5_bloco}'
)
where dynamic_id = (select id from message_dynamics where name = 'Alavancagem com Maratona')
  and msg_key = 'D17';

update message_dynamic_slots
set template = replace(
  template,
  '🏆 *TOP 5 ACUMULADO DO FDS:*

🥇 1º → *$1,800*
🥈 2º → *$1,500*
🥉 3º → *$1,200*
4º → *$900*
5º → *$600*

💡 *Deposite $601 ou mais pra JÁ ENTRAR no TOP 5!*

_Não está no TOP 5? Fique tranquilo — apuração está em andamento e sempre é feito a dupla conferência para que ninguém fique de fora._',
  '${top5_bloco}'
)
where dynamic_id = (select id from message_dynamics where name = 'Alavancagem com Maratona')
  and msg_key = 'D19';

-- 2) Flag manual "precisa ser atualizada em tempo real antes de agendar" —
-- independente de ser sobre TOP 5 ou não, gerenciável no editor de slots.
-- Complementa (não substitui) a detecção automática de ${top5_bloco}.
alter table message_dynamic_slots
  add column if not exists needs_realtime_update boolean not null default false;

-- 3) Backfill: toda mensagem que já menciona "TOP 5"/"TOP5" (bloco dinâmico
-- ou só o texto de marketing) fica marcada — cobre as 6 da Premium + as 9
-- corrigidas acima da Maratona + as demais menções em texto corrido.
update message_dynamic_slots
set needs_realtime_update = true
where template ~* 'top ?5';
