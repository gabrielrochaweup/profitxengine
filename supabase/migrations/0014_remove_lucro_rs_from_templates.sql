-- Reescreve as 75 mensagens (nas 6 dinamicas) que ainda citavam lucro em
-- R$ do Pepe/Live ou o bloco TRIAD somado, removidos na Adendo 23. Cada
-- UPDATE tem o texto final ja revisado (aprovado pelo usuario), nao e um
-- regex generico -- e id por id, sobre o conteudo real de cada slot.

update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🚀 *BATALHA DE TRADERS A TODO VAPOR — NÃO PERDE!*

*Investe $5.000 copiando os 3 traders da Profit*, lucra até *R$ 22.000* → *R$ 49.500 na conta!*

_Isso é só um exemplo — você deposita o valor que quiser._

⬇️ *${cta}*

👉 ${link}' where id = '9a08c794-9354-48b9-990f-1f676874e9be';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! ÚLTIMA SESSÃO EM 20 MINUTOS!*

App na tela — sessão das *19h* começando — última chance Pepe hoje!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🔥 *Aproveite — Pepe agora, Live 20h em seguida!*' where id = 'dc47937d-c207-49bc-9589-1b3da9f2d0dc';
update message_dynamic_slots set template = '🏆 *PLACAR ATUALIZADO DO MÉTODO TRIAD!*

*Resultado consolidado do MÉTODO TRIAD ${fonteTriadPlacar}:*
━━━━━━━━━━━━━━━━━━━
🐸 *PEPE:* *— ${acertoP}% acerto!*
📺 *LIVE:* *— ${acertoL}% acerto!*
💰 *COPY:* *— ${acertoC}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏆 *TOTAL:* *${acertoT}% acerto!*
━━━━━━━━━━━━━━━━━━━
💰 *RESULTADO DO COPY TRADER ${fonteTriadLucro}:* banca $${bancaCopy} → *R$ ${rendimentoCopyR}!*
━━━━━━━━━━━━━━━━━━━
🚨 *PRA PEGAR TUDO ISSO você precisa ter acesso COMPLETO NO TRIAD — Pepe + Live + Copy — Entre para a ELITE!*

Quem é Elite pega:
✅ Todas as sessões Pepe (seg-dom, não só seg-sex)
✅ Live completa com trader profissional (seg-sex)
✅ Copy Trader Todas equipes rodando 24h!
✅ +20% bônus em todas as Alavancagens
✅ Aumento de no mínimo 20% de Lucratividade mensal

⬇️ *${ctaU}*

👉 ${linkU}' where id = '85d07480-690e-487c-b650-21406f935879';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🚀 *MARATONA A TODO VAPOR — quem tá dentro tá alavancando!*

*Investe $7.500*, lucra até *R$ ${mLucro7500}* → *R$ ${mTotal7500} na conta!*
*Investe $15.000*, lucra até *R$ ${mLucro15000}* → *R$ ${mTotal15000} na conta!*

_Isso é só um exemplo — quanto mais você deposita, MAIS ESCALA!_

⬇️ *${cta}*

👉 ${link}' where id = 'aa4364a6-1707-4f3a-b5a2-529ca1d93c9d';
update message_dynamic_slots set template = '🏁 *MARATONA — RETA FINAL DE HOJE!*

*Sessão Pepe encerrada. Agora é você fazer teu depósito antes das 22h!*

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏁 *ESCALA MARATONA — CONTA REGRESSIVA:*

Investe *$1.000* → *R$ ${mTotal1000} na conta!*
Investe *$3.000* → *R$ ${mTotal3000} na conta!*
Investe *$5.000* → *R$ ${mTotal5000} na conta!*
Investe *$10.000* → *R$ ${mTotal10000} na conta!* (DOBRA)
Investe *$20.000* → *R$ ${mTotal20000} na conta!* (TRIPLICA)

*Quanto MAIOR o teu aporte, MAIOR a porcentagem — e cumulativo pro TOP 5!*

⬇️ *${cta}*

👉 ${link}' where id = '00364a68-25e8-4ce3-bf53-76ab46762e0f';
update message_dynamic_slots set template = '⚡ *PEPE MANHÃ EM 10 MINUTOS — FICA LIGADO!*

Falta pouco pra sessão das *10h* — deixa o app aberto!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏁 *VAI ACABAR — MARATONA ATIVA AGORA, DEPOSITA E ALAVANCA!*

*Investe $5.000* → *R$ ${mLucro5000} de lucro* → *R$ ${mTotal5000} na conta!*

*Só nesse FDS! Segunda já era, próxima só daqui 7 dias.*

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = '4f6bc1e5-d27a-4cff-9319-a4323d05f7f8';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! SESSÃO PEPE EM 30 MINUTOS!*

Sessão começa às *10h* — abre o app e fica atento pra não perder!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
⚔️ *BATALHA DE TRADERS RODANDO!*

Deposita e eu alavanco tua banca *automaticamente* SEM RISCO e 100% AUTOMÁTICO!

*Investe $2.000* copiando os 3 traders da Profit → *Lucra até R$ 7.700* → *R$ 18.700 na conta!* 💰

⬇️ *${cta}*

👉 ${link}' where id = '2b33a1e0-e51e-4044-ac11-dbc99959a474';
update message_dynamic_slots set template = '⚡ *PEPE MANHÃ EM 10 MINUTOS — FICA LIGADO!*

Falta pouco pra sessão das *10h* — deixa o app aberto!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
⚔️ *BATALHA DE TRADERS ATIVA!*

*Investe $2.000 copiando os 3 traders da Profit* → *R$ 7.700* → *R$ 18.700 na conta!*

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = '38d8a51e-649a-4cc5-92aa-3954d7ca9f75';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
⚔️ *BATALHA DE TRADERS EM PARALELO — depois da sessão faz teu aporte:*

*Investe $5.000 copiando os 3 traders da Profit* → Lucra *R$ 22.000* → *R$ 49.500 na conta!*

⬇️ *${cta}*

👉 ${link}' where id = 'f66dbcb7-9f98-4479-b6b3-3e32c352056f';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! SESSÃO DA TARDE EM 30 MINUTOS!*

Sessão começa às *14h em ponto* — abre o app e fica atento!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*

━━━━━━━━━━━━━━━━━━━
⚔️ *BATALHA DE TRADERS SEGUE RODANDO!*

*Investe $3.000 copiando os 3 traders da Profit* → *R$ 11.550* de lucro → *R$ 28.050 na conta!*

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = 'a715852e-21c7-4ba1-8c21-3801106622a8';
update message_dynamic_slots set template = '⚡ *PEPE TARDE EM 10 MINUTOS!*

App na tela — sessão das *14h* começando!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
⚔️ *Veja quanto você lucra na Batalha:*

*Investe $10.000 copiando os 3 traders da Profit (Elite)*
Lucra até *R$ 66.000* → *R$ 121.000 na conta* (DOBRA!)

*A gente opera pra você, 100% automático e sem risco. É só depositar e aguardar!*

⬇️ *${cta}*

👉 ${link}' where id = '63bd8307-1021-4fa1-a5c6-a20eadb3e6c9';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🎁 *ALAVANCAGEM COM BÔNUS RODANDO EM PARALELO!*

Depois da sessão, faz teu aporte que o bônus vai em cima:

*Investe $5.000 sendo do plano Elite*
Lucra até *R$ 22.000* → *R$ 49.500 na conta!*

⬇️ *${cta}*

👉 ${link}' where id = 'dd5b9f16-4cb5-41fd-874e-a00f6f4cc91f';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! ÚLTIMA SESSÃO EM 20 MINUTOS!*

App na tela — sessão das *19h* começando — última chance Pepe hoje!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
⚔️ *BATALHA FECHA HOJE — perdeu, só daqui 7 dias:*

*Investe $1.000 copiando os 3 traders da Profit* → Lucra *R$ 3.300* → *R$ 8.800 na conta!*

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = '6726455b-99b4-4a6e-8d65-473aa9437262';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
⚔️ *BATALHA FECHA ÀS 22h — perdeu, só daqui 7 dias:*

*Investe $5.000 copiando os 3 traders da Profit* → *R$ 22.000!* → *R$ 49.500 na conta!*
*Investe $10.000 copiando os 3 traders da Profit* → *R$ 66.000!* → *R$ 121.000 na conta!*

⬇️ *${cta}*

👉 ${link}' where id = '8f8b4779-0adb-4289-bd1b-6a8105f98248';
update message_dynamic_slots set template = '🔴 *LIVE EM 30 MINUTOS — 20h!*

Trader profissional entra ao vivo, opera na tua frente e você copia tudo na hora! Isso não tem replay — quem FICA DE FORA PERDE DINHEIRO!

OLHA ESSES RESULTADOS! 👇🏻

📊 *PLACAR ${fonteLivePlacar} da LIVE:* *${acertoL}% acerto!*

⚠️ *Live é AO VIVO — não tem replay.*
${fechoLive}
*Deixa a banca pronta e fica online. 20h em ponto começa!*' where id = 'a58bc41d-e9cd-4fd0-bd9f-c62e4cdddfc6';
update message_dynamic_slots set template = '🚨 *LIVE COMEÇA EM 5 MINUTOS — FICA ONLINE!*

Última chamada — *trader profissional já se preparando pra operar!*

📊 *PLACAR ${fonteLivePlacar} da LIVE:* *${acertoL}% acerto!*

⚠️ *Só AO VIVO. Sem replay.*
${fechoLive}

*20h em ponto. Fica online AGORA!*' where id = '3278e68f-2ec0-4222-9e86-532395ac0728';
update message_dynamic_slots set template = '🏆 *PLACAR ATUALIZADO DO MÉTODO TRIAD!*

*Resultado consolidado do MÉTODO TRIAD ${fonteTriadPlacar}:*
━━━━━━━━━━━━━━━━━━━
🐸 *PEPE:* *— ${acertoP}% acerto!*
📺 *LIVE:* *— ${acertoL}% acerto!*
💰 *COPY:* *— ${acertoC}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏆 *TOTAL:* *${acertoT}% acerto!*
━━━━━━━━━━━━━━━━━━━
💰 *RESULTADO DO COPY TRADER ${fonteTriadLucro}:* banca $${bancaCopy} → *R$ ${rendimentoCopyR}!*
━━━━━━━━━━━━━━━━━━━
🚨 *PRA PEGAR TUDO ISSO você precisa ter acesso COMPLETO NO TRIAD — Pepe + Live + Copy — Entre para a ELITE!*

Quem é Elite pega:
✅ Todas as operações das sessões Pepe
✅ Copy Trader Todas equipes!
✅ +20% de bônus nas Alavancagens
✅ Aumento de no mínimo 20% de Lucratividade mensal
✅ Mais vantagens em todas as Alavancagens!

⬇️ *${ctaU}*

👉 ${linkU}' where id = '24ead78c-c60a-4978-a4e2-46b7b7c9a11b';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! SESSÃO PEPE EM 30 MINUTOS!*

Sessão começa às *10h* — abre o app e fica atento pra não perder!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🎁 *ALAVANCAGEM COM BÔNUS RODANDO!*

Deposita e eu alavanco tua banca *automaticamente* SEM RISCO e 100% AUTOMÁTICO!

*Investe $2.000 sendo do plano Elite (+20%)*
Lucra até *R$ 7.700* → *R$ 18.700 na conta!* 💰

⬇️ *${cta}*

👉 ${link}' where id = '249918d5-baed-4753-afdb-d8cb316c74be';
update message_dynamic_slots set template = '⚡ *PEPE MANHÃ EM 10 MINUTOS — FICA LIGADO!*

Falta pouco pra sessão das *10h* — deixa o app aberto!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🎁 *ALAVANCAGEM COM BÔNUS ATIVA!*

*Investe $2.000 sendo do plano Elite* → Lucra *R$ 7.700* → *R$ 18.700 na conta!*

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = 'd7ed13f3-348a-42d4-8d7d-06eba47c1b6b';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! SESSÃO DA TARDE EM 30 MINUTOS!*

Sessão começa às *14h em ponto* — abre o app e fica atento!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*

━━━━━━━━━━━━━━━━━━━
🎁 *ALAVANCAGEM COM BÔNUS SEGUE RODANDO!*

*Investe $3.000 sendo do plano Elite (+20%)*
Lucra até *R$ 11.550* → *R$ 28.050 na conta!*

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = 'f7814934-6afd-439a-9fe2-5bfceec0cc43';
update message_dynamic_slots set template = '⚡ *PEPE TARDE EM 10 MINUTOS!*

App na tela — sessão das *14h* começando!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🎁 *Veja quanto você pode lucrar de acordo com o seu plano na Alavancagem:*

*Investe $10.000 sendo do plano Elite*
Lucra até *R$ 66.000* → *R$ 121.000 na conta!*

*A gente opera pra você, 100% automático e sem risco. É só depositar e aguardar!*

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = '39f23a04-edb1-4248-b049-496136286a2d';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🚀 *ALAVANCAGEM COM BÔNUS A TODO VAPOR — NÃO PERDE!*

*Investe $5.000*, lucra até *R$ 22.000* → *R$ 49.500 na conta!*

_Isso é só um exemplo — você deposita o valor que quiser._

⬇️ *${cta}*

👉 ${link}' where id = '855fa1fc-d3cb-4958-8f95-135c1bcb27bc';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! ÚLTIMA SESSÃO EM 20 MINUTOS!*

App na tela — sessão das *19h* começando — última chance Pepe hoje!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🎁 *ALAVANCAGEM COM BÔNUS FECHA HOJE — perdeu, só daqui 7 dias:*

*Investe $1.000 sendo do plano Elite (+20%)*
Lucra até *R$ 3.300* → *R$ 8.800 na conta!*

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = '148a4af4-8d7d-4423-a4e3-c602b4619fc0';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🎁 *ALAVANCAGEM COM BÔNUS FECHA ÀS 22h — perdeu, só daqui 7 dias:*

*Investe $5.000 sendo do plano Elite* → Lucra *R$ 22.000* → *R$ 49.500 na conta!*
*Com $10.000 Elite* → Lucra *R$ 66.000* → *R$ 121.000 na conta* (DOBRA!)

⬇️ *${cta}*

👉 ${link}' where id = 'a372feec-a917-42a1-a051-389a4f9c62ff';
update message_dynamic_slots set template = '🔴 *LIVE EM 30 MINUTOS — 20h!*

Trader profissional entra ao vivo, opera na tua frente e você copia tudo na hora! Isso não tem replay — quem FICA DE FORA PERDE DINHEIRO!

OLHA ESSES RESULTADOS! 👇🏻

📊 *PLACAR ${fonteLivePlacar} da LIVE:* *${acertoL}% acerto!*

⚠️ *Live é AO VIVO — não tem replay.*
${fechoLive}
*Deixa a banca pronta e fica online. 20h em ponto começa!*' where id = 'ea8c7d7c-c4c0-4f18-ab33-15b63b06f7bd';
update message_dynamic_slots set template = '🚨 *LIVE COMEÇA EM 5 MINUTOS — FICA ONLINE!*

Última chamada — *trader profissional já se preparando pra operar!*

📊 *PLACAR ${fonteLivePlacar} da LIVE:* *${acertoL}% acerto!*

⚠️ *Só AO VIVO. Sem replay.*
${fechoLive}

*20h em ponto. Fica online AGORA!*' where id = '315d9851-d209-4b23-933a-fc4889b5d4f8';
update message_dynamic_slots set template = '🏆 *PLACAR ATUALIZADO DO MÉTODO TRIAD!*

*Resultado consolidado do MÉTODO TRIAD ${fonteTriadPlacar}:*
━━━━━━━━━━━━━━━━━━━
🐸 *PEPE:* *— ${acertoP}% acerto!*
📺 *LIVE:* *— ${acertoL}% acerto!*
💰 *COPY:* *— ${acertoC}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏆 *TOTAL:* *${acertoT}% acerto!*
━━━━━━━━━━━━━━━━━━━
💰 *RESULTADO DO COPY TRADER ${fonteTriadLucro}:* banca $${bancaCopy} → *R$ ${rendimentoCopyR}!*
━━━━━━━━━━━━━━━━━━━
🚨 *PRA PEGAR TUDO ISSO você precisa ter acesso COMPLETO NO TRIAD — Pepe + Live + Copy — Entre para a ELITE!*

Quem é Elite pega:
✅ Todas as operações das sessões Pepe
✅ Copy Trader Todas equipes!
✅ +20% de bônus nas Alavancagens
✅ Aumento de no mínimo 20% de Lucratividade mensal
✅ Mais vantagens em todas as Alavancagens!

⬇️ *${ctaU}*

👉 ${linkU}' where id = 'd6e075a9-87d4-4ea3-89d2-2e9df13e6e2c';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! SESSÃO EM 30 MINUTOS!*

Sessão começa às *10h em ponto* — abre o app e fica atento pra não perder!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*

━━━━━━━━━━━━━━━━━━━
🔥 *E HOJE TEM KAMIKAZE ATIVA!*

*Aproveite as análises profissionais da nossa equipe — são as mesmas análises que utilizamos pra operar nas alavancagens.*

*Bora lucrar!*' where id = '5114a531-1454-4e7c-8969-4d54d50fc538';
update message_dynamic_slots set template = '⚡ *PEPE MANHÃ EM 5 MINUTOS — FICA ONLINE!*

App na tela — sessão das *10h em ponto* já vai começar!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🔥 *KAMIKAZE + PEPE — aproveite tudo hoje!*

*Bora lucrar!*' where id = '3ccfae5f-b78d-4eb2-840f-93f9f0738094';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🔥 *DEPOIS DO PEPE TEM KAMIKAZE — próxima análise às ${proximaAnalise2}!*

*Fica atento ao grupo — não perde a próxima tendência!*' where id = '688ebf54-3597-4e2e-aea3-8acdbfb7bd0e';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! SESSÃO DA TARDE EM 30 MINUTOS!*

Sessão começa às *14h em ponto* — abre o app e fica atento!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*

━━━━━━━━━━━━━━━━━━━
🔥 *KAMIKAZE RODANDO — aproveite as análises de tendência profissional!*

*Não perde — possibilidade alta de lucro e alavancagem no dia!*' where id = 'a81bdff9-5919-4a6b-929b-3c3f076260a9';
update message_dynamic_slots set template = '⚡ *PEPE TARDE EM 5 MINUTOS!*

App na tela — sessão das *14h em ponto* começando!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🔥 *KAMIKAZE + PEPE JUNTOS — aproveite a onda de oportunidades!*

*Bora lucrar!*' where id = 'b00af123-79b3-4051-a5ff-cdaff97e6275';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🔥 *DEPOIS DO PEPE TEM PRÓXIMA KAMIKAZE — fica atento ao grupo!*

*Aproveita cada oportunidade — combo Pepe + Kamikaze rodando!*' where id = '48d9fc7c-9fe0-4cd1-8c35-5edc8c9997f2';
update message_dynamic_slots set template = '🔥 *VAI ACABAR! Última sessão do PEPE às 19h e LIVE às 20h! Dá tempo de lucrar muito — não perde!*

*_Reta final do dia — aproveita cada oportunidade:_*

🐸 *PEPE:* última sessão do dia às *19h em ponto*!
📺 *LIVE:* sessão com trader profissional às 20h!
🔥 *KAMIKAZE:* Pode ser que ocorra mais — fica atento no grupo!
💰 *COPY:* rodando 24h no automático!
━━━━━━━━━━━━━━━━━━━
😱 **VEJA COMO O TRIAD TÁ PERFORMANDO ${fonteTriadPlacar}:**

🐸 *Pepe:* *— ${acertoP}% acerto!*
📺 *Live:* *— ${acertoL}% acerto!*
💰 *Copy:* *— ${acertoC}% acerto!* — banca $${bancaCopy} → *R$ ${rendimentoCopyR}!*
━━━━━━━━━━━━━━━━━━━
🚨 *QUER PEGAR TUDO ISSO TODO DIA? FAZ TEU UPGRADE!*

✅ Todas as sessões Pepe (seg-dom)
✅ Live completa com trader profissional (seg-sex)
✅ Copy Trader rodando 24h no automático
✅ +20% bônus em todas as Alavancagens
✅ Aumento de no mínimo 20% de Lucratividade mensal

⬇️ *${ctaU}*

👉 ${linkU}' where id = '2836f660-6ce3-44af-85f7-3dd1c5357d38';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🔥 *Última sessão Pepe do dia — depois vem a Live 20h em ponto!*' where id = 'abd1e0ba-cb2e-49ee-b505-a1718dbb79b2';
update message_dynamic_slots set template = '🔴 *LIVE EM 30 MINUTOS — 20h!*

Trader profissional entra ao vivo, opera na tua frente e você copia tudo na hora!

📊 *PLACAR ${fonteLivePlacar} da LIVE:* *${acertoL}% acerto!*

⚠️ *Live é AO VIVO, não tem replay — se ficar de fora deixa passar TUDO isso.*

🔥 *Prepara a banca e fica online. 20h em ponto começa!*' where id = '95013ec4-94f3-43bf-a26a-7faf81afe039';
update message_dynamic_slots set template = '🚨 *LIVE COMEÇA EM 5 MINUTOS — FICA ONLINE!*

Última chamada — *trader profissional já se preparando pra operar!*

📊 *PLACAR ${fonteLivePlacar} da LIVE:* *${acertoL}% acerto!*

⚠️ *Sem replay — se ficar de fora perde TUDO isso.*

🔥 *AGORA é a tua chance — não perde, entra com vontade!*

*20h em ponto. Fica online AGORA!*' where id = 'ad92e366-1f31-4199-a84a-5eadc51da7dc';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! SESSÃO PEPE EM 30 MINUTOS!*

Sessão começa às *10h* — abre o app e fica atento pra não perder!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏁 *NÃO PERDE A MARATONA — VAI ACABAR ANTES DE DOMINGO!*

*Investe $2.000* → Lucra até *R$ ${mLucro2000}* → *R$ ${mTotal2000} na conta!* 💰

*Cada $1.000 que você deposita = +5% de lucro extra na alavancagem!*

⬇️ *${cta}*

👉 ${link}' where id = 'b181a3b1-7fcb-45ee-bd4c-f9d7320cca8e';
update message_dynamic_slots set template = '⚡ *PEPE MANHÃ EM 10 MINUTOS — FICA LIGADO!*

Falta pouco pra sessão das *10h* — deixa o app aberto!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏁 *VAI ACABAR — MARATONA ATIVA AGORA, DEPOSITA E ALAVANCA!*

*Investe $5.000* → *R$ ${mLucro5000} de lucro* → *R$ ${mTotal5000} na conta!*

*Só nesse FDS! Segunda já era, próxima só daqui 7 dias.*

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = 'e1027d3a-a2e9-4298-b621-13d7dba8d246';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏁 *DEPOIS DO PEPE FAZ TEU APORTE NA MARATONA — vai acabar antes de domingo!*

*Investe $10.000* → Lucra *R$ ${mLucro10000}* → *R$ ${mTotal10000} na conta!* (DOBRA)

⬇️ *${cta}*

👉 ${link}' where id = 'df740d63-f6a0-4ccb-aa17-c8c62deab0fb';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! ÚLTIMA SESSÃO EM 20 MINUTOS!*

App na tela — sessão das *19h* começando — última chance Pepe hoje!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏁 *MARATONA FECHA HOJE — DEPOIS SÓ DAQUI 7 DIAS:*

*Investe $1.000* → *R$ ${mLucro1000} de lucro* → *R$ ${mTotal1000} na conta!*
*Investe $10.000* → *R$ ${mLucro10000} de lucro* → *R$ ${mTotal10000} na conta!* (DOBRA)
*Investe $20.000* → *R$ ${mLucro20000} de lucro* → *R$ ${mTotal20000} na conta!* (TRIPLICA)

*O TOP 5 fecha até 22h de domingo — 5 maiores DOBRAM a banca!*

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = 'e16a5ed8-5256-49af-b11a-4e6c3051e080';
update message_dynamic_slots set template = '⚡ *PEPE TARDE EM 10 MINUTOS!*

App na tela — sessão das *14h* começando!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏁 *Veja quanto você lucra na Maratona (escala $10K = DOBRA):*

*Investe $10.000* → *R$ ${mLucro10000} de lucro* → *R$ ${mTotal10000} na conta* (DOBRA!)

*A gente opera pra você, 100% automático e sem risco. É só depositar e aguardar!*

⬇️ *${cta}*

👉 ${link}' where id = '41332456-9ccc-4071-a716-924ba44e0e78';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🚀 *MARATONA A TODO VAPOR — quem tá dentro tá alavancando!*

*Investe $7.500*, lucra até *R$ ${mLucro7500}* → *R$ ${mTotal7500} na conta!*
*Investe $15.000*, lucra até *R$ ${mLucro15000}* → *R$ ${mTotal15000} na conta!*

_Isso é só um exemplo — quanto mais você deposita, MAIS ESCALA!_

⬇️ *${cta}*

👉 ${link}' where id = '7a146748-2e23-4b35-8127-09f41d5c4fc9';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! SESSÃO PEPE EM 30 MINUTOS!*

Sessão começa às *10h* — abre o app e fica atento pra não perder!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏁 *NÃO PERDE A MARATONA — VAI ACABAR ANTES DE DOMINGO!*

*Investe $2.000* → Lucra até *R$ ${mLucro2000}* → *R$ ${mTotal2000} na conta!* 💰

*Cada $1.000 que você deposita = +5% de lucro extra na alavancagem!*

⬇️ *${cta}*

👉 ${link}' where id = '8aac70f6-ae3e-416f-a678-037f5a337247';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏁 *DEPOIS DO PEPE FAZ TEU APORTE NA MARATONA — vai acabar antes de domingo!*

*Investe $10.000* → Lucra *R$ ${mLucro10000}* → *R$ ${mTotal10000} na conta!* (DOBRA)

⬇️ *${cta}*

👉 ${link}' where id = 'f120e447-0492-441c-8af2-8dd24cd120f4';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! SESSÃO DA TARDE EM 30 MINUTOS!*

Sessão começa às *14h em ponto* — abre o app e fica atento!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*

━━━━━━━━━━━━━━━━━━━
🏁 *NÃO DEIXA A MARATONA PASSAR — vai acabar antes do fim de semana!*

*Investe $3.000* → *R$ ${mLucro3000}* → *R$ ${mTotal3000} na conta!*
*Investe $7.500* → *R$ ${mLucro7500}* → *R$ ${mTotal7500} na conta!*

*Cada $1.000 que você deposita = +5% de lucro extra na alavancagem!*

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = '76978f36-9aa8-435b-a6fc-d1851a0d1c2b';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! ÚLTIMA SESSÃO EM 20 MINUTOS!*

App na tela — sessão das *19h* começando — última chance Pepe hoje!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏁 *MARATONA FECHA HOJE — DEPOIS SÓ DAQUI 7 DIAS:*

*Investe $1.000* → *R$ ${mLucro1000} de lucro* → *R$ ${mTotal1000} na conta!*
*Investe $10.000* → *R$ ${mLucro10000} de lucro* → *R$ ${mTotal10000} na conta!* (DOBRA)
*Investe $20.000* → *R$ ${mLucro20000} de lucro* → *R$ ${mTotal20000} na conta!* (TRIPLICA)

*O TOP 5 fecha até 22h de domingo — 5 maiores DOBRAM a banca!*

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = 'b9f81e14-57d8-4fa0-acb2-56f32dc2ddc3';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏁 *MARATONA FECHA ÀS 22h — última chance antes de 7 dias:*

*Investe $5.000* → *R$ ${mTotal5000} na conta!*
*Investe $10.000* → *R$ ${mTotal10000} na conta!* (DOBRA!)
━━━━━━━━━━━━━━━━━━━
🏆 *TOP 5 ACUMULADO DO FDS:*

🥇 1º → *$1,500*
🥈 2º → *$1,250*
🥉 3º → *$1,000*
4º → *$750*
5º → *$500*

💡 *Deposite $501 ou mais pra JÁ ENTRAR no TOP 5!*

_Não está no TOP 5? Fique tranquilo — apuração está em andamento e sempre é feito a dupla conferência para que ninguém fique de fora._
━━━━━━━━━━━━━━━━━━━
⬇️ *${cta}*

👉 ${link}' where id = '84fd11de-2111-4cd6-8da8-b318203ab53c';
update message_dynamic_slots set template = '🏁 *MARATONA — RETA FINAL DE HOJE!*

*Sessão Pepe encerrada. Agora é você fazer teu depósito antes das 22h!*

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏁 *ESCALA MARATONA — CONTA REGRESSIVA:*

Investe *$1.000* → *R$ ${mTotal1000} na conta!*
Investe *$3.000* → *R$ ${mTotal3000} na conta!*
Investe *$5.000* → *R$ ${mTotal5000} na conta!*
Investe *$10.000* → *R$ ${mTotal10000} na conta!* (DOBRA)
Investe *$20.000* → *R$ ${mTotal20000} na conta!* (TRIPLICA)

*Quanto MAIOR o teu aporte, MAIOR a porcentagem — e cumulativo pro TOP 5!*

⬇️ *${cta}*

👉 ${link}' where id = '3fd104b6-629a-4965-91a8-9717badc792a';
update message_dynamic_slots set template = '🏆 *PLACAR ATUALIZADO DO MÉTODO TRIAD!*

*Resultado consolidado do MÉTODO TRIAD ${fonteTriadPlacar}:*
━━━━━━━━━━━━━━━━━━━
🐸 *PEPE:* *— ${acertoP}% acerto!*
📺 *LIVE:* *— ${acertoL}% acerto!*
💰 *COPY:* *— ${acertoC}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏆 *TOTAL:* *${acertoT}% acerto!*
━━━━━━━━━━━━━━━━━━━
💰 *RESULTADO DO COPY TRADER ${fonteTriadLucro}:* banca $${bancaCopy} → *R$ ${rendimentoCopyR}!*
━━━━━━━━━━━━━━━━━━━
🚨 *PRA PEGAR TUDO ISSO você precisa ter acesso COMPLETO NO TRIAD — Pepe + Live + Copy — Entre para a ELITE!*

Quem é Elite pega:
✅ Todas as operações das sessões Pepe
✅ Copy Trader Todas equipes!
✅ +20% de bônus nas Alavancagens
✅ Aumento de no mínimo 20% de Lucratividade mensal
✅ Mais vantagens em todas as Alavancagens!

⬇️ *${ctaU}*

👉 ${linkU}' where id = '79398b5e-a4d8-431e-8901-e75f0522b1e0';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! SESSÃO PEPE EM 30 MINUTOS!*

Sessão começa às *10h* — abre o app e fica atento pra não perder!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🎓 *ALAVANCAGEM COM MENTORIA RODANDO!*

Deposita e eu alavanco tua banca *automaticamente* SEM RISCO e 100% AUTOMÁTICO!

*Investe $2.000* → Lucra até *R$ 5.500* → *R$ 16.500 na conta* + *Mentoria gravada!*

⬇️ *${cta}*

👉 ${link}' where id = 'a43beaac-18dd-4608-a46a-5f8891fff4f6';
update message_dynamic_slots set template = '⚡ *PEPE MANHÃ EM 10 MINUTOS — FICA LIGADO!*

Falta pouco pra sessão das *10h* — deixa o app aberto!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🎓 *MENTORIA ATIVA HOJE — 1x POR MÊS!*

*Investe $2.000* → Lucra *R$ 5.500* → *R$ 16.500 na conta* + Mentoria!

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = 'f2e82bba-7bbe-40eb-9419-091275abdfcd';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🎓 *MENTORIA RODANDO EM PARALELO — HOJE!*

Depois da sessão, faz teu aporte:

*Investe $5.000* → Lucra *R$ 16.500* → *R$ 44.000 na conta* + *Pacote VIP Vitalício!*

⬇️ *${cta}*

👉 ${link}' where id = '0b11caa9-7b5c-4ca3-8c8b-ac4ece6e3767';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! SESSÃO DA TARDE EM 30 MINUTOS!*

Sessão começa às *14h em ponto* — abre o app e fica atento!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*

━━━━━━━━━━━━━━━━━━━
🎓 *MENTORIA COMPLETA + ALAVANCAGEM ROLANDO HOJE!*

*Investe $3.000* → Lucra *R$ 8.250* → *R$ 24.750 na conta* + Mentoria!

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = '873a6e7a-3ff4-4ec3-9aaa-584e7f5f7274';
update message_dynamic_slots set template = '⚡ *PEPE TARDE EM 10 MINUTOS!*

App na tela — sessão das *14h* começando!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🎓 *Veja quanto você lucra hoje na Mentoria:*

*Investe $10.000*
Lucra *R$ 55.000* → *R$ 110.000 na conta* (DOBRA!) + *Pacote VIP Vitalício!*

*A gente opera pra você, 100% automático e sem risco. É só depositar e aguardar!*

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = '5e07ffd1-fea7-4203-9907-db7a1533fe00';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🚀 *MENTORIA A TODO VAPOR — NÃO PERDE!*

*Investe $5.000*, lucra até *R$ 16.500* → *R$ 44.000 na conta* + *Pacote VIP!*

_Isso é só um exemplo — você deposita o valor que quiser._

⬇️ *${cta}*

👉 ${link}' where id = '0dd0cc8c-49a8-4698-b335-2f83ac45601e';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! ÚLTIMA SESSÃO EM 20 MINUTOS!*

App na tela — sessão das *19h* começando — última chance Pepe hoje!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🎓 *MENTORIA FECHA HOJE — próxima só daqui 30 dias:*

*Investe $1.000* → Lucra *R$ 2.200* → *R$ 7.700 na conta* + Mentoria!

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = '8a56a7ac-bc29-4750-8413-dd4346d58290';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🎓 *MENTORIA FECHA ÀS 22h — perdeu, só daqui 30 dias:*

*Investe $5.000* → *R$ 44.000 na conta* + Pacote VIP!
*Investe $10.000* → *R$ 110.000 na conta* (DOBRA!) + Pacote VIP!

⬇️ *${cta}*

👉 ${link}' where id = '44b1d0e8-eeab-45a9-9a5b-e9010cb8fdd6';
update message_dynamic_slots set template = '🔴 *LIVE EM 30 MINUTOS — 20h!*

Trader profissional entra ao vivo, opera na tua frente e você copia tudo na hora! Isso não tem replay — quem FICA DE FORA PERDE DINHEIRO!

OLHA ESSES RESULTADOS! 👇🏻

📊 *PLACAR ${fonteLivePlacar} da LIVE:* *${acertoL}% acerto!*

⚠️ *Live é AO VIVO — não tem replay.*
${fechoLive}
*Deixa a banca pronta e fica online. 20h em ponto começa!*' where id = '1b22cb3f-d19a-4d3d-b657-275cd06070e7';
update message_dynamic_slots set template = '🚨 *LIVE COMEÇA EM 5 MINUTOS — FICA ONLINE!*

Última chamada — *trader profissional já se preparando pra operar!*

📊 *PLACAR ${fonteLivePlacar} da LIVE:* *${acertoL}% acerto!*

⚠️ *Só AO VIVO. Sem replay.*
${fechoLive}

*20h em ponto. Fica online AGORA!*' where id = '5ca36dea-25d8-49d2-80f2-6c83eba4bb72';
update message_dynamic_slots set template = '🏆 *PLACAR ATUALIZADO DO MÉTODO TRIAD!*

*Resultado consolidado do MÉTODO TRIAD ${fonteTriadPlacar}:*
━━━━━━━━━━━━━━━━━━━
🐸 *PEPE:* *— ${acertoP}% acerto!*
📺 *LIVE:* *— ${acertoL}% acerto!*
💰 *COPY:* *— ${acertoC}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏆 *TOTAL:* *${acertoT}% acerto!*
━━━━━━━━━━━━━━━━━━━
💰 *RESULTADO DO COPY TRADER ${fonteTriadLucro}:* banca $${bancaCopy} → *R$ ${rendimentoCopyR}!*
━━━━━━━━━━━━━━━━━━━
🚨 *PRA PEGAR TUDO ISSO você precisa ter acesso COMPLETO NO TRIAD — Pepe + Live + Copy — Entre para a ELITE!*

Quem é Elite pega:
✅ Todas as operações das sessões Pepe
✅ Copy Trader Todas equipes!
✅ +20% de bônus nas Alavancagens
✅ Aumento de no mínimo 20% de Lucratividade mensal
✅ Mais vantagens em todas as Alavancagens!

⬇️ *${ctaU}*

👉 ${linkU}' where id = '44b3e539-814b-4fb3-9ef6-6df1e62cf3b8';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! SESSÃO EM 30 MINUTOS!*

Sessão começa às *10h em ponto* — abre o app e fica atento pra não perder!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*

━━━━━━━━━━━━━━━━━━━
💎 *ALAVANCAGEM ATIVA — CADA $1.000 = +1 SNIPER EXTRA!*

▸ Investe *$5.000* → Lucra *R$ 44.000* + ganha *5 OPERAÇÕES SNIPERS EXTRAS* que podem multiplicar ainda mais teu resultado, além da rentabilidade garantida!

⬇️ *${cta}*

👉 ${link}' where id = '9bfe34cb-1ef9-43c9-96bc-c7e392d2a761';
update message_dynamic_slots set template = '⚡ *PEPE MANHÃ EM 10 MINUTOS — FICA LIGADO!*

Falta pouco pra sessão das *10h* — deixa o app aberto!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
💎 *ALAVANCAGEM COM SNIPERS EXTRAS — HOJE É O DIA:*

▸ Investe *$10.000* → *DOBRA teu capital* pra *R$ 110.000* + ganha *10 SNIPERS EXTRAS* que podem levar teu lucro ainda mais alto!

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = 'ef1f3abd-67c0-44b8-82a5-39924ab25b19';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
💎 *ALAVANCAGEM COM SNIPERS — depois da sessão faz teu aporte:*

▸ Investe *$5.000* → Lucra *R$ 44.000* + ganha *5 SNIPERS EXTRAS* que podem aumentar muito teu resultado!

▸ Investe *$10.000* → *DOBRA teu capital* pra *R$ 110.000* + ganha *10 SNIPERS EXTRAS* que podem multiplicar ainda mais teu lucro!

⬇️ *${cta}*

👉 ${link}' where id = '22d80c69-8895-4cd0-937b-ea33d301e279';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! SESSÃO DA TARDE EM 30 MINUTOS!*

Sessão começa às *14h em ponto* — abre o app e fica atento!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*

━━━━━━━━━━━━━━━━━━━
💎 *NÃO DEIXA A ALAVANCAGEM PASSAR — vai acabar antes do fim do dia!*

▸ Investe *$3.000* → Lucra *R$ 24.750* + ganha *3 SNIPERS EXTRAS* que podem aumentar muito teu resultado!

▸ Investe *$7.500* → Lucra *R$ 66.000* + ganha *7 SNIPERS EXTRAS* que podem multiplicar ainda mais teu lucro!

⬇️ *${cta}*

👉 ${link}' where id = '16ef4792-7e4c-4ccf-a635-462a4baadf50';
update message_dynamic_slots set template = '⚡ *PEPE TARDE EM 10 MINUTOS!*

App na tela — sessão das *14h* começando!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
💎 *ALAVANCAGEM COM SNIPERS — veja quanto você lucra:*

▸ Investe *$10.000* → *DOBRA teu capital* pra *R$ 110.000* + ganha *10 SNIPERS EXTRAS* que podem multiplicar ainda mais teu lucro!

*A gente opera pra você, 100% automático e sem risco. É só depositar e aguardar!*

⬇️ *${cta}*

👉 ${link}' where id = '8853d37b-cf02-47f5-b96b-652fa418e628';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🚀 *ALAVANCAGEM COM SNIPERS EXTRAS — RENTABILIDADE MAIOR HOJE:*

▸ Investe *$7.500* → Lucra *R$ 66.000* + ganha *7 SNIPERS EXTRAS* que podem aumentar muito teu resultado!

▸ Investe *$15.000* → *DOBRA teu capital* pra *R$ 165.000* + ganha *15 SNIPERS EXTRAS* que podem levar teu lucro pra outro patamar!

_Quanto mais deposita, maior a alavancagem + mais snipers extras!_

⬇️ *${cta}*

👉 ${link}' where id = '9ea34681-28c4-474c-b405-97b103a00a42';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! ÚLTIMA SESSÃO EM 20 MINUTOS!*

App na tela — sessão das *19h* começando — última chance Pepe hoje!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
💎 *ALAVANCAGEM FECHA HOJE — perdeu, só daqui 7 dias:*

▸ Investe *$1.000* → Lucra *R$ 7.700* + ganha *1 SNIPER EXTRA*!

▸ Investe *$10.000* → *DOBRA teu capital* pra *R$ 110.000* + ganha *10 SNIPERS EXTRAS* que podem multiplicar teu lucro!

▸ Investe *$20.000* → *DOBRA teu capital* pra *R$ 220.000* + ganha *20 SNIPERS EXTRAS* — combo poderoso pra fechar!

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = 'efc2142e-935c-478d-ac57-156d65ed54a1';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
💎 *ALAVANCAGEM FECHA ÀS 22h — última chance antes de 7 dias:*

▸ Investe *$10.000* → *DOBRA teu capital* pra *R$ 110.000* + ganha *10 SNIPERS EXTRAS* que podem multiplicar teu lucro!

▸ Investe *$20.000* → *DOBRA teu capital* pra *R$ 220.000* + ganha *20 SNIPERS EXTRAS* — combo poderoso!
${top5_bloco}
⬇️ *${cta}*

👉 ${link}' where id = 'def66a8c-204f-470f-be69-8c28107eef80';
update message_dynamic_slots set template = '🔴 *LIVE EM 30 MINUTOS — 20h!*

Trader profissional entra ao vivo, opera na tua frente e você copia tudo na hora!

📊 *PLACAR ${fonteLivePlacar} da LIVE:* *${acertoL}% acerto!*

⚠️ *Live é AO VIVO, não tem replay — se ficar de fora deixa passar TUDO isso.*

🔥 *Agora é a TUA chance — entra com vontade de DOBRAR tua banca, enfia o pé e opera junto com o trader profissional!*

*Deixa a banca pronta e fica online. 20h em ponto começa!*' where id = '0fa99a42-86c6-44ba-b96b-0b5624eca97e';
update message_dynamic_slots set template = '🚨 *LIVE COMEÇA EM 5 MINUTOS — FICA ONLINE!*

Última chamada — *trader profissional já se preparando pra operar!*

📊 *PLACAR ${fonteLivePlacar} da LIVE:* *${acertoL}% acerto!*

⚠️ *Sem replay — se ficar de fora perde TUDO isso.*

🔥 *AGORA é a tua chance — não perde, entra com vontade de dobrar tua banca!*

*20h em ponto. Fica online AGORA!*' where id = 'c63dc589-6a53-4040-9147-3b2469643c83';
update message_dynamic_slots set template = '🏆 *PLACAR ATUALIZADO DO MÉTODO TRIAD!*

*Resultado consolidado do MÉTODO TRIAD ${fonteTriadPlacar}:*
━━━━━━━━━━━━━━━━━━━
🐸 *PEPE:* *— ${acertoP}% acerto!*
📺 *LIVE:* *— ${acertoL}% acerto!*
💰 *COPY:* *— ${acertoC}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏆 *TOTAL:* *${acertoT}% acerto!*
━━━━━━━━━━━━━━━━━━━
💰 *RESULTADO DO COPY TRADER ${fonteTriadLucro}:* banca $${bancaCopy} → *R$ ${rendimentoCopyR}!*
━━━━━━━━━━━━━━━━━━━
🚨 *PRA PEGAR TUDO ISSO você precisa ter acesso COMPLETO NO TRIAD — Pepe + Live + Copy — Entre para a ELITE!*

Quem é Elite pega:
✅ Todas as operações das sessões Pepe
✅ Copy Trader Todas equipes!
✅ +20% de bônus nas Alavancagens
✅ Aumento de no mínimo 20% de Lucratividade mensal
✅ Mais vantagens em todas as Alavancagens!

⬇️ *${ctaU}*

👉 ${linkU}' where id = '1e7fd80e-0d76-41ea-ad54-df8c6b0149ea';
update message_dynamic_slots set template = '🐸 *O PEPE DEU A LETRA! SESSÃO DA TARDE EM 30 MINUTOS!*

Sessão começa às *14h em ponto* — abre o app e fica atento!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*

━━━━━━━━━━━━━━━━━━━
🏁 *NÃO DEIXA A MARATONA PASSAR — vai acabar antes do fim de semana!*

*Investe $3.000* → *R$ ${mLucro3000}* → *R$ ${mTotal3000} na conta!*
*Investe $7.500* → *R$ ${mLucro7500}* → *R$ ${mTotal7500} na conta!*

*Cada $1.000 que você deposita = +5% de lucro extra na alavancagem!*

${vagN2}

⬇️ *${cta}*

👉 ${link}' where id = '2e03c5d6-eea6-4436-bf65-3659066c9302';
update message_dynamic_slots set template = '⚡ *PEPE TARDE EM 10 MINUTOS!*

App na tela — sessão das *14h* começando!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏁 *Veja quanto você lucra na Maratona (escala $10K = DOBRA):*

*Investe $10.000* → *R$ ${mLucro10000} de lucro* → *R$ ${mTotal10000} na conta* (DOBRA!)

*A gente opera pra você, 100% automático e sem risco. É só depositar e aguardar!*

⬇️ *${cta}*

👉 ${link}' where id = 'd7d7d1b7-9dfb-45fc-89fb-13e98e46d12d';
update message_dynamic_slots set template = '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% acerto!*
━━━━━━━━━━━━━━━━━━━
🏁 *MARATONA FECHA ÀS 22h — última chance antes de 7 dias:*

*Investe $5.000* → *R$ ${mTotal5000} na conta!*
*Investe $10.000* → *R$ ${mTotal10000} na conta!* (DOBRA!)
━━━━━━━━━━━━━━━━━━━
🏆 *TOP 5 ACUMULADO DO FDS:*

🥇 1º → *$800*
🥈 2º → *$667*
🥉 3º → *$533*
4º → *$400*
5º → *$267*

💡 *Deposite $268 ou mais pra JÁ ENTRAR no TOP 5!*

_Não está no TOP 5? Fique tranquilo — apuração está em andamento e sempre é feito a dupla conferência para que ninguém fique de fora._
━━━━━━━━━━━━━━━━━━━
⬇️ *${cta}*

👉 ${link}' where id = '51bf0264-50ce-426d-a48e-1d67a39e0417';
