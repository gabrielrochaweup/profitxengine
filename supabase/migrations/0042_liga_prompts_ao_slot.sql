-- Liga cada template de imagem por-mensagem ao slot exato (dinâmica +
-- msg_key) que ele foi feito pra representar. Isso permite o gerador de
-- imagem filtrar o dropdown pra mostrar só o template genérico + o
-- específico da mensagem sendo editada, em vez da lista inteira de 180.
alter table image_prompt_templates add column if not exists dynamic_id uuid references message_dynamics(id) on delete cascade;
alter table image_prompt_templates add column if not exists msg_key text;

create index if not exists idx_image_prompt_templates_dynamic_msg on image_prompt_templates(dynamic_id, msg_key);

-- Alavancagem de Batalha (24)
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '1' where name = 'Batalha 08h — Time de traders se apresentando';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '2' where name = 'Batalha 09h30 — PEPE checando o resultado';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '3' where name = 'Batalha 09h50 — Contagem regressiva 10min';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '4' where name = 'Batalha 10h — Pepe ao vivo em batalha paralela';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '5' where name = 'Batalha 11h — Comparativo Start Pró Elite';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '6' where name = 'Batalha 12h — Traders competindo ao meio-dia';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '7' where name = 'Batalha 13h30 — PEPE com resultado da manhã';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '8' where name = 'Batalha 13h50 — Pepe e Robô em alerta';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '9' where name = 'Batalha 14h — Batalha a todo vapor';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '10' where name = 'Batalha 15h — Elite vs Start gap de lucro';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '11' where name = 'Batalha 16h — Traders no ringue (combo poderoso)';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '12' where name = 'Batalha 17h — Aluno vitorioso (depoimento)';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '13' where name = 'Batalha 18h — Portões fechando ao entardecer';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '14' where name = 'Batalha 18h40 — PEPE com lanterna na última chamada';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '15' where name = 'Batalha 19h — Batalha noturna fecha às 22h';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '16' where name = 'Batalha 19h30 — Estúdio de Live se preparando';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '17' where name = 'Batalha 19h55 — Contagem final pra Live';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '18' where name = 'Batalha 20h — Ao vivo agora';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '19' where name = 'Batalha 20h05 — Live em ritmo acelerado';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '20' where name = 'Batalha 21h — Última hora, exemplos de lucro';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '21' where name = 'Batalha 21h30 — Pancadaria final';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '22' where name = 'Batalha 21h50 — Última chamada, portão fechando';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '23' where name = 'Batalha 22h — Encerramento e apuração';
update image_prompt_templates set dynamic_id = 'ff62960b-46f1-4a1e-bf71-fc8d4b04680e', msg_key = '24' where name = 'Batalha 22h30 — Placar TRIAD consolidado';

-- Alavancagem com Bônus de Plano (24)
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '1' where name = 'Bônus de Plano 08h — Baú se abrindo';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '2' where name = 'Bônus de Plano 09h30 — PEPE conferindo o bônus';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '3' where name = 'Bônus de Plano 09h50 — Contagem regressiva do bônus';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '4' where name = 'Bônus de Plano 10h — Pepe ao vivo com bônus ativo';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '5' where name = 'Bônus de Plano 11h — Comparativo de planos';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '6' where name = 'Bônus de Plano 12h — Abrindo o bônus ao meio-dia';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '7' where name = 'Bônus de Plano 13h30 — PEPE com resultado da manhã';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '8' where name = 'Bônus de Plano 13h50 — Pepe e Robô em alerta';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '9' where name = 'Bônus de Plano 14h — Bônus a todo vapor';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '10' where name = 'Bônus de Plano 15h — Elite vs Start gap de bônus';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '11' where name = 'Bônus de Plano 16h — Combo poderoso com bônus explodindo';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '12' where name = 'Bônus de Plano 17h — Aluno vitorioso (depoimento)';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '13' where name = 'Bônus de Plano 18h — Cofre fechando ao entardecer';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '14' where name = 'Bônus de Plano 18h40 — PEPE com lanterna dourada';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '15' where name = 'Bônus de Plano 19h — Bônus fecha às 22h';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '16' where name = 'Bônus de Plano 19h30 — Estúdio de Live se preparando';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '17' where name = 'Bônus de Plano 19h55 — Contagem final pra Live';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '18' where name = 'Bônus de Plano 20h — Ao vivo agora';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '19' where name = 'Bônus de Plano 20h05 — Live em ritmo acelerado';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '20' where name = 'Bônus de Plano 21h — Última hora, exemplos de lucro';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '21' where name = 'Bônus de Plano 21h30 — Explosão final de bônus';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '22' where name = 'Bônus de Plano 21h50 — Última chamada, cofre fechando';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '23' where name = 'Bônus de Plano 22h — Encerramento e apuração';
update image_prompt_templates set dynamic_id = '7cf25ddc-6539-4198-82bd-e787dc756f04', msg_key = '24' where name = 'Bônus de Plano 22h30 — Placar TRIAD consolidado';

-- Alavancagem com Mentoria (24)
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '1' where name = 'Mentoria 08h — Mestre recebendo os alunos';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '2' where name = 'Mentoria 09h30 — PEPE conferindo o resultado';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '3' where name = 'Mentoria 09h50 — Contagem regressiva da mentoria';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '4' where name = 'Mentoria 10h — Pepe ao vivo com mentoria rodando';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '5' where name = 'Mentoria 11h — Aportes e pacote vitalício';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '6' where name = 'Mentoria 12h — Pacote VIP ao meio-dia';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '7' where name = 'Mentoria 13h30 — PEPE com resultado da manhã';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '8' where name = 'Mentoria 13h50 — Pepe e Robô estudando';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '9' where name = 'Mentoria 14h — Mentoria a todo vapor';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '10' where name = 'Mentoria 15h — Copy Trader rendimento passivo';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '11' where name = 'Mentoria 16h — Dobra a banca e leva mentoria';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '12' where name = 'Mentoria 17h — Aluno vitorioso (depoimento)';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '13' where name = 'Mentoria 18h — Portas da academia fechando';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '14' where name = 'Mentoria 18h40 — PEPE com lanterna de conhecimento';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '15' where name = 'Mentoria 19h — Mentoria fecha às 22h';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '16' where name = 'Mentoria 19h30 — Estúdio de Live se preparando';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '17' where name = 'Mentoria 19h55 — Contagem final pra Live';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '18' where name = 'Mentoria 20h — Ao vivo agora';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '19' where name = 'Mentoria 20h05 — Live em ritmo acelerado';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '20' where name = 'Mentoria 21h — Última hora, exemplos de lucro';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '21' where name = 'Mentoria 21h30 — Reta final da mentoria';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '22' where name = 'Mentoria 21h50 — Última chamada, portas fechando';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '23' where name = 'Mentoria 22h — Encerramento e envio da mentoria';
update image_prompt_templates set dynamic_id = '036f91e4-c7f8-400d-b9db-559323f91478', msg_key = '24' where name = 'Mentoria 22h30 — Placar TRIAD consolidado';

-- Alavancagem Premium (24)
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '1' where name = 'Premium 08h — Elite se preparando com precisão';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '2' where name = 'Premium 09h30 — PEPE conferindo o resultado';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '3' where name = 'Premium 09h50 — Contagem regressiva com snipers';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '4' where name = 'Premium 10h — Pepe ao vivo com snipers ativas';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '5' where name = 'Premium 11h — Alavancagem acumulando com TOP 5';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '6' where name = 'Premium 12h — Explicando o combo ao meio-dia';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '7' where name = 'Premium 13h30 — PEPE com resultado da manhã';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '8' where name = 'Premium 13h50 — Snipers em posição';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '9' where name = 'Premium 14h — Rentabilidade maior com snipers extras';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '10' where name = 'Premium 15h — Copy Trader com UPGRADE e TOP 5';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '11' where name = 'Premium 16h — Reta final, snipers e TOP 5 acumulando';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '12' where name = 'Premium 17h — Aluno vitorioso (depoimento)';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '13' where name = 'Premium 18h — Janela de precisão fechando';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '14' where name = 'Premium 18h40 — PEPE com mira noturna';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '15' where name = 'Premium 19h — Alavancagem fecha às 22h com TOP 5';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '16' where name = 'Premium 19h30 — Estúdio de Live se preparando';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '17' where name = 'Premium 19h55 — Contagem final pra Live';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '18' where name = 'Premium 20h — Ao vivo agora';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '19' where name = 'Premium 20h05 — Live em ritmo acelerado';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '20' where name = 'Premium 21h — Última hora, TOP 5 e exemplos';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '21' where name = 'Premium 21h30 — Fechamento com TOP 5';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '22' where name = 'Premium 21h50 — Última chamada, janela fechando';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '23' where name = 'Premium 22h — Encerramento e apuração';
update image_prompt_templates set dynamic_id = '6729698e-7ab4-41df-a30e-89957f77b2c6', msg_key = '24' where name = 'Premium 22h30 — Placar TRIAD e TOP 5 final';

-- Sessão Kamikaze (29)
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '1' where name = 'Kamikaze 07h30 — Agenda do dia no radar';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '2' where name = 'Kamikaze 08h — Alerta 1: tendência identificada';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '3' where name = 'Kamikaze 09h — Alerta 2: tendência identificada';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '4' where name = 'Kamikaze 09h30 — Pepe com camada Kamikaze';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '5' where name = 'Kamikaze 09h55 — Contagem regressiva Pepe + Kamikaze';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '6' where name = 'Kamikaze 10h — Pepe ao vivo, próxima análise chegando';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '7' where name = 'Kamikaze 10h30 — Equipe analisando a próxima tendência';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '8' where name = 'Kamikaze 11h — Alerta 3: tendência identificada';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '9' where name = 'Kamikaze 12h — Opera junto na Kamikaze';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '10' where name = 'Kamikaze 13h — Alerta 4: tendência identificada';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '11' where name = 'Kamikaze 13h30 — Pepe tarde com Kamikaze rodando';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '12' where name = 'Kamikaze 13h55 — Contagem regressiva tarde';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '13' where name = 'Kamikaze 14h — Pepe ao vivo, próxima Kamikaze';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '14' where name = 'Kamikaze 14h30 — Equipe finalizando análise';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '15' where name = 'Kamikaze 15h — Alerta 5: tendência identificada';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '16' where name = 'Kamikaze 15h30 — Copy dedicado rodando';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '17' where name = 'Kamikaze 16h — Alerta 6: tendência identificada';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '18' where name = 'Kamikaze 16h30 — Depoimento e próxima análise';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '19' where name = 'Kamikaze 17h — Alerta 7: tendência identificada';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '20' where name = 'Kamikaze 18h — Reta final do dia, agenda restante';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '21' where name = 'Kamikaze 18h40 — Pepe última sessão da noite';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '22' where name = 'Kamikaze 19h — Pepe ao vivo, última sessão';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '23' where name = 'Kamikaze 19h30 — Chamada pra Live';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '24' where name = 'Kamikaze 19h55 — Contagem final pra Live';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '25' where name = 'Kamikaze 20h — Sessão com trader profissional ao vivo';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '26' where name = 'Kamikaze 20h05 — Reforço da Live';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '27' where name = 'Kamikaze 20h30 — Equipe decidindo análise extra';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '28' where name = 'Kamikaze 20h50 — Alerta 8: tendência extra identificada';
update image_prompt_templates set dynamic_id = 'b4a63a99-9bf0-4856-9843-b8c4be3e5fdc', msg_key = '29' where name = 'Kamikaze 22h — Placar TRIAD consolidado';

-- Upgrade Direto (14)
update image_prompt_templates set dynamic_id = '78200aa9-35fb-4179-8922-362c7818e645', msg_key = '1' where name = 'Upgrade Direto 08h — Agenda do dia com rocket launch';
update image_prompt_templates set dynamic_id = '78200aa9-35fb-4179-8922-362c7818e645', msg_key = '2' where name = 'Upgrade Direto 09h45 — Pepe com prioridade Elite';
update image_prompt_templates set dynamic_id = '78200aa9-35fb-4179-8922-362c7818e645', msg_key = '3' where name = 'Upgrade Direto 10h — Pepe ao vivo';
update image_prompt_templates set dynamic_id = '78200aa9-35fb-4179-8922-362c7818e645', msg_key = '4' where name = 'Upgrade Direto 11h — Memecoins bombando';
update image_prompt_templates set dynamic_id = '78200aa9-35fb-4179-8922-362c7818e645', msg_key = '5' where name = 'Upgrade Direto 13h45 — Pepe tarde com prioridade';
update image_prompt_templates set dynamic_id = '78200aa9-35fb-4179-8922-362c7818e645', msg_key = '6' where name = 'Upgrade Direto 14h — Pepe ao vivo tarde';
update image_prompt_templates set dynamic_id = '78200aa9-35fb-4179-8922-362c7818e645', msg_key = '7' where name = 'Upgrade Direto 15h — Upgrade memecoin conteúdo';
update image_prompt_templates set dynamic_id = '78200aa9-35fb-4179-8922-362c7818e645', msg_key = '8' where name = 'Upgrade Direto 17h — Aluno vitorioso (depoimento)';
update image_prompt_templates set dynamic_id = '78200aa9-35fb-4179-8922-362c7818e645', msg_key = '9' where name = 'Upgrade Direto 18h45 — Pepe última sessão';
update image_prompt_templates set dynamic_id = '78200aa9-35fb-4179-8922-362c7818e645', msg_key = '10' where name = 'Upgrade Direto 19h — Pepe ao vivo noite';
update image_prompt_templates set dynamic_id = '78200aa9-35fb-4179-8922-362c7818e645', msg_key = '11' where name = 'Upgrade Direto 19h45 — Chamada pra Live';
update image_prompt_templates set dynamic_id = '78200aa9-35fb-4179-8922-362c7818e645', msg_key = '12' where name = 'Upgrade Direto 20h — Ao vivo agora';
update image_prompt_templates set dynamic_id = '78200aa9-35fb-4179-8922-362c7818e645', msg_key = '13' where name = 'Upgrade Direto 21h — Conteúdo ao vivo extra';
update image_prompt_templates set dynamic_id = '78200aa9-35fb-4179-8922-362c7818e645', msg_key = '14' where name = 'Upgrade Direto 22h — Encerramento e resultado do dia';

-- Alavancagem com Maratona (41)
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S1' where name = 'Maratona Sáb 08h — Largada da corrida';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S2' where name = 'Maratona Sáb 09h30 — PEPE conferindo o relógio';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S3' where name = 'Maratona Sáb 09h50 — Contagem regressiva na largada';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S4' where name = 'Maratona Sáb 10h — Pepe correndo ao vivo';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S5' where name = 'Maratona Sáb 11h — Escala crescendo, TOP 5 acumulando';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S6' where name = 'Maratona Sáb 12h — Posto de reabastecimento ao meio-dia';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S7' where name = 'Maratona Sáb 13h30 — PEPE com resultado da manhã';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S8' where name = 'Maratona Sáb 13h50 — Pepe se preparando pra próxima etapa';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S9' where name = 'Maratona Sáb 14h — Corrida a todo vapor';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S10' where name = 'Maratona Sáb 15h — Bastão de revezamento (Copy)';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S11' where name = 'Maratona Sáb 16h — Rajada final, TOP 5 acumulando';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S12' where name = 'Maratona Sáb 17h — Aluno cruzando a linha (depoimento)';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S13' where name = 'Maratona Sáb 18h — Pista se apagando ao entardecer';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S14' where name = 'Maratona Sáb 18h40 — PEPE com tocha ao entardecer';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S15' where name = 'Maratona Sáb 19h — Corrida noturna, fecha às 22h';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S16' where name = 'Maratona Sáb 20h — Reta final de hoje';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S17' where name = 'Maratona Sáb 21h — Encerramento, amanhã tem mais';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S18' where name = 'Maratona Sáb 21h30 — Reta final de sábado';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S19' where name = 'Maratona Sáb 21h50 — Última chamada de sábado';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'S20' where name = 'Maratona Sáb 22h — Encerramento, continua amanhã';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D1' where name = 'Maratona Dom 08h — Largada da reta final';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D2' where name = 'Maratona Dom 09h30 — PEPE no domingo';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D3' where name = 'Maratona Dom 09h50 — Contagem regressiva de domingo';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D4' where name = 'Maratona Dom 10h — Pepe correndo no domingo';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D5' where name = 'Maratona Dom 11h — TOP 5 acumulando no domingo';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D6' where name = 'Maratona Dom 12h — Último posto de reabastecimento';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D7' where name = 'Maratona Dom 13h30 — PEPE com resultado do domingo';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D8' where name = 'Maratona Dom 13h50 — Pepe na reta final da tarde';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D9' where name = 'Maratona Dom 14h — Corrida final a todo vapor';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D10' where name = 'Maratona Dom 15h — Bastão final de revezamento (Copy)';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D11' where name = 'Maratona Dom 16h — Rajada final, TOP 5 quase fechado';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D12' where name = 'Maratona Dom 17h — Aluno cruzando a linha final (depoimento)';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D13' where name = 'Maratona Dom 18h — Última luz antes do fechamento da semana';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D14' where name = 'Maratona Dom 18h40 — PEPE com tocha na última noite';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D15' where name = 'Maratona Dom 19h — Corrida da última noite, fecha às 22h';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D16' where name = 'Maratona Dom 20h — Reta final de hoje (última do FDS)';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D17' where name = 'Maratona Dom 21h — Encerramento, última da semana';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D18' where name = 'Maratona Dom 21h30 — Reta final de domingo';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D19' where name = 'Maratona Dom 21h50 — Última chamada da semana';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D20' where name = 'Maratona Dom 22h — Encerramento final da Maratona';
update image_prompt_templates set dynamic_id = '732e6972-badd-482f-be6e-71b78d0647a8', msg_key = 'D21' where name = 'Maratona Dom 22h30 — Placar TRIAD consolidado';

