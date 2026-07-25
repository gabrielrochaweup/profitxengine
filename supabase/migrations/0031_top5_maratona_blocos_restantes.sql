-- A 0029 só pegou 9 dos 13 blocos de TOP 5 escritos na mão na "Alavancagem
-- com Maratona" — essas 4 tinham o bloco mais abaixo no texto (não logo
-- após a primeira menção a "TOP 5"), então passaram batido. Mesma correção:
-- substitui o bloco fixo por ${top5_bloco}.
update message_dynamic_slots
set template = replace(
  template,
  '🏆 *TOP 5 ACUMULADO DO FDS:*

🥇 1º → *$600*
🥈 2º → *$500*
🥉 3º → *$400*
4º → *$300*
5º → *$200*

💡 *Deposite $201 ou mais pra JÁ ENTRAR no TOP 5!*

_Não está no TOP 5? Fique tranquilo — apuração está em andamento e sempre é feito a dupla conferência para que ninguém fique de fora._',
  '${top5_bloco}'
)
where dynamic_id = (select id from message_dynamics where name = 'Alavancagem com Maratona')
  and msg_key = 'S5';

update message_dynamic_slots
set template = replace(
  template,
  '🏆 *TOP 5 ACUMULADO DO FDS:*

🥇 1º → *$1,300*
🥈 2º → *$1,083*
🥉 3º → *$867*
4º → *$650*
5º → *$433*

💡 *Deposite $434 ou mais pra JÁ ENTRAR no TOP 5!*

_Não está no TOP 5? Fique tranquilo — apuração está em andamento e sempre é feito a dupla conferência para que ninguém fique de fora._',
  '${top5_bloco}'
)
where dynamic_id = (select id from message_dynamics where name = 'Alavancagem com Maratona')
  and msg_key = 'D5';

update message_dynamic_slots
set template = replace(
  template,
  '🏆 *TOP 5 ACUMULADO DO FDS:*

🥇 1º → *$1,200*
🥈 2º → *$1,000*
🥉 3º → *$800*
4º → *$600*
5º → *$400*

💡 *Deposite $401 ou mais pra JÁ ENTRAR no TOP 5!*

_Não está no TOP 5? Fique tranquilo — apuração está em andamento e sempre é feito a dupla conferência para que ninguém fique de fora._',
  '${top5_bloco}'
)
where dynamic_id = (select id from message_dynamics where name = 'Alavancagem com Maratona')
  and msg_key = 'S20';

update message_dynamic_slots
set template = replace(
  template,
  '🏆 *TOP 5 ACUMULADO DO FDS:*

🥇 1º → *$1,700*
🥈 2º → *$1,417*
🥉 3º → *$1,133*
4º → *$850*
5º → *$567*

💡 *Deposite $568 ou mais pra JÁ ENTRAR no TOP 5!*

_Não está no TOP 5? Fique tranquilo — apuração está em andamento e sempre é feito a dupla conferência para que ninguém fique de fora._',
  '${top5_bloco}'
)
where dynamic_id = (select id from message_dynamics where name = 'Alavancagem com Maratona')
  and msg_key = 'D18';

-- Marca as 4 com a mesma flag das outras já corrigidas (a tarja já
-- apareceria de qualquer forma, via detecção automática de ${top5_bloco},
-- mas mantém o dado consistente com as demais).
update message_dynamic_slots
set needs_realtime_update = true
where dynamic_id = (select id from message_dynamics where name = 'Alavancagem com Maratona')
  and msg_key in ('S5', 'D5', 'S20', 'D18');
