-- Nova dinâmica "Upgrade Direto": sem alavancagem, foco em upgrade de
-- plano (mais acesso/conteúdo). Mantém os horários do Pepe (10h/14h/19h)
-- e da Live (20h), mantém a prova social (17h), reduz o resto pra 14
-- mensagens focadas em upgrade + mercado de memecoin como gancho, e deixa
-- 1 mensagem (21h) em aberto pra equipe encaixar conteúdo ao vivo depois.
-- Aprovado pelo usuário: tom "mais acesso/conteúdo" como argumento central
-- de upgrade (sem prometer alavancagem/multiplicador de banca).

insert into message_dynamics (id, slug, name, icon, subtitle, rules, vagas_config, rotating_banks, extra_vars, active) values (
  '78200aa9-35fb-4179-8922-362c7818e645',
  'upgrade',
  'Upgrade Direto',
  '🚀',
  'Cronograma 14 msgs · Sem alavancagem — foco em upgrade de plano (mais acesso/conteúdo) · Mercado de memecoin como gancho · Horários do Pepe/Live mantidos · 1 espaço aberto pra conteúdo ao vivo',
  ARRAY['Sem alavancagem — foco 100% em upgrade de plano (mais acesso/conteúdo, não multiplicador de banca)','Horário do Pepe (10h/14h/19h) e da Live (20h) mantidos iguais aos das outras dinâmicas','Mensagem das 21h fica em aberto pra equipe preencher com conteúdo ao vivo extra (aula, Q&A, análise ao vivo)','Prova social (17h) usa o mesmo banco de depoimentos das outras dinâmicas','Pode citar o mercado de memecoin como gancho de conteúdo/urgência, sem prometer resultado financeiro','1 link por mensagem (Upgrade OU Live) — mensagens de transição pra Live são exceção']::text[],
  '{"mode": "none"}'::jsonb,
  '{"cta": ["FAZ UPGRADE E TEM ACESSO COMPLETO — mais sessões Pepe, prioridade na Live com Felipe Trader e Copy Trader liberado", "FAZ UPGRADE E RECEBE AS ANÁLISES PRIMEIRO — mais conteúdo, mais sessões, mais prioridade", "FAZ UPGRADE PRA TER ACESSO TOTAL — todas as sessões Pepe, Live completa e Copy Trader 24h", "FAZ UPGRADE E NÃO FICA DE FORA DE NADA — mais análises de mercado, mais sessões liberadas", "FAZ UPGRADE AGORA — acesso prioritário a tudo que a equipe libera todos os dias", "FAZ UPGRADE E APROVEITA O MERCADO DE VERDADE — mais conteúdo, mais análises, mais oportunidade"], "urgS": ["_A condição de hoje é só até 22h — depois, só semana que vem._", "_Quem faz upgrade hoje já entra com prioridade na próxima sessão._", "_Não é sempre que a janela de upgrade fica aberta assim — aproveita._", "_Hoje é o dia certo pra upar — memecoin não espera ninguém._", "_Perdeu hoje, só semana que vem._"], "vagN2": ["*O mercado de memecoin se move rápido — quem tem mais acesso, sai na frente!*", "*Análises da equipe liberadas todo dia — upgrade te dá prioridade nelas!*", "*Memecoin bomba do nada — importante é tar no lugar certo quando isso acontece!*", "*Mais sessões, mais análises, mais chance de pegar a próxima oportunidade!*", "*Upgrade não é sobre alavancar — é sobre ter acesso ao que a equipe libera primeiro!*"], "fechoLive": ["*Se perde hoje, perdeu — não tem replay!*", "*É AO VIVO — quem tá dentro, lucra!*", "*Sem repetição — quem tá online copia!*", "*Live é AO VIVO — não tem replay, sem exceção!*", "*Última sessão de hoje — não perde!*"], "headerRot": ["🚀 *DIA DE UPGRADE — MAIS ACESSO, MAIS ANÁLISE, MAIS OPORTUNIDADE!*", "📈 *MERCADO DE MEMECOIN NÃO PARA — BORA GARANTIR TEU ACESSO COMPLETO!*", "🚀 *HOJE TEM TRIAD COMPLETO — UPGRADE TE DÁ PRIORIDADE EM TUDO!*", "💎 *DIA DE OPORTUNIDADE — QUEM TÁ NO PLANO CERTO SAI NA FRENTE!*", "🚀 *DIA CHEIO — QUEM UPA HOJE PEGA CADA SESSÃO COM PRIORIDADE!*"], "headerMSG1": ["🚀 *HOJE TEM SESSÃO PEPE + LIVE COM FELIPE TRADER + COPY TRADER — E ESPAÇO PRA VOCÊ SUBIR DE PLANO!*", "📈 *DIA CHEIO — MEMECOIN BOMBANDO E VOCÊ COM ACESSO TOTAL SE FIZER O UPGRADE!*", "🚀 *AGENDA DE HOJE ATIVA — E QUEM TÁ NO PLANO CERTO PEGA TUDO PRIMEIRO!*", "💎 *TRIAD RODANDO HOJE — UPGRADE PRA TER PRIORIDADE EM CADA SESSÃO!*"], "headerNoite": ["⏰ *ÚLTIMA CHANCE DE UPGRADE HOJE — DEPOIS SÓ SEMANA QUE VEM!*", "🚨 *JANELA DE UPGRADE FECHANDO — GARANTE TEU ACESSO AINDA HOJE!*", "⚡ *RETA FINAL DO DIA — NÃO PERDE A CONDIÇÃO DE HOJE!*"], "headerPepeVivo": ["🐸 *COMEÇOU! PEPE AO VIVO — CADA OPERAÇÃO É LUCRO NA CONTA!*", "🐸 *TÁ RODANDO! PEPE AO VIVO — NÃO PERDE NENHUMA ENTRADA!*", "🐸 *É AGORA! PEPE AO VIVO — BORA COPIAR CADA WIN!*", "🐸 *SESSÃO PEPE VALENDO — COPIA CADA OPERAÇÃO EM TEMPO REAL!*", "🐸 *PEPE AO VIVO — ENTRA E LUCRA JUNTO COM A GENTE!*", "🐸 *SESSÃO COMEÇOU — PEPE AO VIVO NO APP AGORA!*", "🐸 *ATENÇÃO! PEPE AO VIVO — CADA MINUTO É OPORTUNIDADE!*", "🐸 *PEPE OPERANDO AO VIVO — ENTRA COM A GENTE E LUCRA!*"], "BANCO_NOMES": ["Rafael Souza", "Amanda Ferreira", "Bruno Costa", "Camila Santos", "Diego Oliveira", "Eduarda Lima", "Felipe Almeida", "Gabriela Rocha", "Henrique Barbosa", "Isabela Martins", "João Pedro", "Karina Silva", "Lucas Ribeiro", "Mariana Duarte", "Nicolas Ferraz", "Olívia Cardoso", "Pedro Henrique", "Queila Nogueira", "Rodrigo Andrade", "Sabrina Melo", "Tiago Vieira", "Ursula Machado", "Vinícius Cruz", "Wagner Teixeira", "Yasmin Batista", "Antônio Pires", "Beatriz Cavalcante", "Carlos Eduardo", "Daniela Ramos", "Enzo Prado", "Fernanda Peixoto", "Gustavo Freitas", "Helena Corrêa", "Ícaro Braga", "Julia Novaes", "Kaique Bittencourt", "Larissa Mendes", "Matheus Gomes", "Natália Bastos", "Otávio Pinto", "Patrícia Lopes", "Quintino Farias", "Renato Aragão", "Sofia Miranda", "Thales Diniz", "Vitor Hugo", "Willian Sá", "Ximena Rocha", "Yago Amaral", "Zeca Torres"], "BANCO_VALORES": ["600", "1.200", "1.800", "2.400", "3.600", "6.000", "8.400", "12.000", "18.000", "24.000", "30.000", "36.000", "48.000", "60.000", "72.000", "84.000", "96.000", "120.000"], "BANCO_SITUACOES": ["$50", "$100", "$150", "$200", "$300", "$500", "$700", "$1.000", "$1.500", "$2.000", "$2.500", "$3.000", "$4.000", "$5.000", "$6.000", "$7.000", "$8.000", "$10.000"], "ctaP": ["FAZ UPGRADE E TEM ACESSO COMPLETO — mais sessões Pepe, prioridade na Live com Felipe Trader e Copy Trader liberado", "FAZ UPGRADE E RECEBE AS ANÁLISES PRIMEIRO — mais conteúdo, mais sessões, mais prioridade", "FAZ UPGRADE PRA TER ACESSO TOTAL — todas as sessões Pepe, Live completa e Copy Trader 24h", "FAZ UPGRADE E NÃO FICA DE FORA DE NADA — mais análises de mercado, mais sessões liberadas", "FAZ UPGRADE AGORA — acesso prioritário a tudo que a equipe libera todos os dias", "FAZ UPGRADE E APROVEITA O MERCADO DE VERDADE — mais conteúdo, mais análises, mais oportunidade"], "ctaU": ["FAZ UPGRADE E TEM ACESSO COMPLETO — mais sessões Pepe, prioridade na Live com Felipe Trader e Copy Trader liberado", "FAZ UPGRADE E RECEBE AS ANÁLISES PRIMEIRO — mais conteúdo, mais sessões, mais prioridade", "FAZ UPGRADE PRA TER ACESSO TOTAL — todas as sessões Pepe, Live completa e Copy Trader 24h", "FAZ UPGRADE E NÃO FICA DE FORA DE NADA — mais análises de mercado, mais sessões liberadas", "FAZ UPGRADE AGORA — acesso prioritário a tudo que a equipe libera todos os dias", "FAZ UPGRADE E APROVEITA O MERCADO DE VERDADE — mais conteúdo, mais análises, mais oportunidade"]}'::jsonb,
  '{"link": "https://wa.me/554796988463?text=QUERO%20FAZER%20UPGRADE", "linkL": "https://meet.google.com/krn-xujt-efj", "linkU": "https://lives.escolaprofitx.com/grupo"}'::jsonb,
  true
);

insert into message_dynamic_slots (dynamic_id, position, msg_key, time_label, role_label, cta_tags, template, has_fonte_selector, fonte_default) values (
  '78200aa9-35fb-4179-8922-362c7818e645',
  1,
  '1',
  '08h',
  'Primordial abertura',
  ARRAY['🔗 Upgrade']::text[],
  '${headerMSG1}

📅 *AGENDA DO DIA:*

🐸 *3 SESSÕES DE PEPE:* 10h · 14h · 19h
📺 *LIVE COM FELIPE TRADER:* 20h
💰 *COPY TRADER:* Rodando 24h no automático
━━━━━━━━━━━━━━━━━━━
🚀 *Hoje também tem: quem tá no plano Elite acessa tudo isso com prioridade e mais análises — bora ver se compensa upar?*

⬇️ *${cta}*

👉 ${link}',
  false,
  null
);

insert into message_dynamic_slots (dynamic_id, position, msg_key, time_label, role_label, cta_tags, template, has_fonte_selector, fonte_default) values (
  '78200aa9-35fb-4179-8922-362c7818e645',
  2,
  '2',
  '09h45',
  'Pré-Pepe manhã',
  ARRAY['🔗 Upgrade']::text[],
  '🐸 *O PEPE DEU A LETRA! SESSÃO PEPE EM 15 MINUTOS!*

Sessão começa às *10h* — abre o app e fica atento pra não perder!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% DE ACERTO!*
━━━━━━━━━━━━━━━━━━━
🚀 *Quem tá no plano Elite recebe a sessão com prioridade e mais análises de memecoin depois — vale a pena dar uma olhada no upgrade.*

⬇️ *${cta}*

👉 ${link}',
  true,
  'semana'
);

insert into message_dynamic_slots (dynamic_id, position, msg_key, time_label, role_label, cta_tags, template, has_fonte_selector, fonte_default) values (
  '78200aa9-35fb-4179-8922-362c7818e645',
  3,
  '3',
  '10h',
  'Pepe manhã AO VIVO',
  ARRAY['🔗 Upgrade']::text[],
  '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% DE ACERTO!*
━━━━━━━━━━━━━━━━━━━
📈 ${vagN2}

⬇️ *${cta}*

👉 ${link}',
  true,
  'semana'
);

insert into message_dynamic_slots (dynamic_id, position, msg_key, time_label, role_label, cta_tags, template, has_fonte_selector, fonte_default) values (
  '78200aa9-35fb-4179-8922-362c7818e645',
  4,
  '4',
  '11h',
  'UPGRADE — mais acesso',
  ARRAY['🔗 UPGRADE']::text[],
  '📈 *MEMECOINS BOMBANDO — TEM QUE TAR NO LUGAR CERTO PRA APROVEITAR!*

O mercado de memecoin não para, e quem tá no plano Elite recebe as análises da equipe primeiro, com mais sessões liberadas e prioridade na Live.

💎 *O que muda de plano pra plano:*
🥉 *START* → acesso às sessões Pepe + Copy Trader
🥈 *PRÓ* → + análises extras e prioridade nas sessões
🏆 *ELITE* → acesso completo: todas as sessões, todas as análises, prioridade máxima na Live com Felipe Trader

*Quanto mais alto o plano, mais cedo você recebe cada oportunidade.*

⬇️ *${ctaU}*

👉 ${linkU}',
  false,
  null
);

insert into message_dynamic_slots (dynamic_id, position, msg_key, time_label, role_label, cta_tags, template, has_fonte_selector, fonte_default) values (
  '78200aa9-35fb-4179-8922-362c7818e645',
  5,
  '5',
  '13h45',
  'Pré-Pepe tarde',
  ARRAY['🔗 Upgrade']::text[],
  '🐸 *O PEPE DEU A LETRA! SESSÃO DA TARDE EM 15 MINUTOS!*

Sessão começa às *14h* — abre o app e fica atento!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% DE ACERTO!*
━━━━━━━━━━━━━━━━━━━
🚀 *Quem tá no plano Elite recebe a sessão com prioridade — vale a pena dar uma olhada no upgrade.*

⬇️ *${cta}*

👉 ${link}',
  true,
  'semana'
);

insert into message_dynamic_slots (dynamic_id, position, msg_key, time_label, role_label, cta_tags, template, has_fonte_selector, fonte_default) values (
  '78200aa9-35fb-4179-8922-362c7818e645',
  6,
  '6',
  '14h',
  'Pepe tarde AO VIVO',
  ARRAY['🔗 Upgrade']::text[],
  '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% DE ACERTO!*
━━━━━━━━━━━━━━━━━━━
📈 ${vagN2}

⬇️ *${cta}*

👉 ${link}',
  true,
  'semana'
);

insert into message_dynamic_slots (dynamic_id, position, msg_key, time_label, role_label, cta_tags, template, has_fonte_selector, fonte_default) values (
  '78200aa9-35fb-4179-8922-362c7818e645',
  7,
  '7',
  '15h',
  'UPGRADE — memecoin/conteúdo',
  ARRAY['🔗 UPGRADE']::text[],
  '${headerRot}

Enquanto o mercado de memecoin se move, a equipe tá de olho — e quem faz upgrade recebe cada análise assim que ela sai, sem atraso.

💰 *COPY TRADER:* rodando 24h no automático, disponível em todos os planos.
🐸 *PEPE:* mais sessões liberadas pra quem tá no Pró/Elite.
📺 *LIVE:* prioridade de acesso com Felipe Trader pra quem tá no Elite.

*Não é sobre alavancar mais — é sobre não ficar de fora de nada.*

⬇️ *${ctaU}*

👉 ${linkU}',
  false,
  null
);

insert into message_dynamic_slots (dynamic_id, position, msg_key, time_label, role_label, cta_tags, template, has_fonte_selector, fonte_default) values (
  '78200aa9-35fb-4179-8922-362c7818e645',
  8,
  '8',
  '17h',
  'Depoimento / prova social',
  ARRAY['🔗 Upgrade']::text[],
  '🏆 *ALUNO DA PROFIT LUCROU R$ ${depValor} EM UM ÚNICO DIA!*

*${depNome}* ${depSituacao} — *lucro real, entregue na conta.*
━━━━━━━━━━━━━━━━━━━
🚀 *ISSO ACONTECE COM QUEM TÁ NO PLANO CERTO!*

Quem faz upgrade tem acesso a mais sessões, mais análises e prioridade em tudo que a equipe libera — inclusive nos dias em que o mercado de memecoin dá as melhores oportunidades.

${vagN2}

⬇️ *${cta}*

👉 ${link}',
  true,
  'semana'
);

insert into message_dynamic_slots (dynamic_id, position, msg_key, time_label, role_label, cta_tags, template, has_fonte_selector, fonte_default) values (
  '78200aa9-35fb-4179-8922-362c7818e645',
  9,
  '9',
  '18h45',
  'Pré-Pepe noite',
  ARRAY['🔗 Upgrade']::text[],
  '🐸 *O PEPE DEU A LETRA! ÚLTIMA SESSÃO EM 15 MINUTOS!*

App na tela — sessão das *19h* começando — última chance Pepe hoje!

📊 *PLACAR ${fontePlacar}:* *${acertoP}% DE ACERTO!*
━━━━━━━━━━━━━━━━━━━
${headerNoite}

⬇️ *${cta}*

👉 ${link}',
  true,
  'semana'
);

insert into message_dynamic_slots (dynamic_id, position, msg_key, time_label, role_label, cta_tags, template, has_fonte_selector, fonte_default) values (
  '78200aa9-35fb-4179-8922-362c7818e645',
  10,
  '10',
  '19h',
  'Pepe noite AO VIVO',
  ARRAY['🔗 Upgrade']::text[],
  '${headerPepeVivo}

📊 *PLACAR ${fontePlacar}:* *${acertoP}% DE ACERTO!*
━━━━━━━━━━━━━━━━━━━
📺 *Daqui a pouco tem Live com Felipe Trader às 20h — quem tá no Elite entra com prioridade.*

⬇️ *${cta}*

👉 ${link}',
  true,
  'semana'
);

insert into message_dynamic_slots (dynamic_id, position, msg_key, time_label, role_label, cta_tags, template, has_fonte_selector, fonte_default) values (
  '78200aa9-35fb-4179-8922-362c7818e645',
  11,
  '11',
  '19h45',
  'Pré-Live',
  ARRAY['🔗 UPGRADE']::text[],
  '🔴 *LIVE EM 15 MINUTOS — 20h!*

Felipe Trader entra ao vivo, opera na tua frente e você copia tudo na hora! Isso não tem replay — quem fica de fora perde a oportunidade.

📊 *PLACAR ${fonteLivePlacar} da LIVE:* *${acertoL}% DE ACERTO!*
━━━━━━━━━━━━━━━━━━━
🚀 *Quem tá no plano Elite entra com prioridade máxima na Live — dá uma olhada no upgrade antes de começar.*

⬇️ *${ctaU}*

👉 ${linkU}',
  true,
  'semana'
);

insert into message_dynamic_slots (dynamic_id, position, msg_key, time_label, role_label, cta_tags, template, has_fonte_selector, fonte_default) values (
  '78200aa9-35fb-4179-8922-362c7818e645',
  12,
  '12',
  '20h',
  'LIVE AO VIVO',
  ARRAY['🔗 Live (Meet)']::text[],
  '🔴 *COMEÇOU! LIVE COM FELIPE TRADER — AO VIVO AGORA!*

Felipe Trader opera na tua frente e você copia tudo na hora — sem replay, só ao vivo!

${fechoLive}

👉 ${linkL}',
  false,
  null
);

insert into message_dynamic_slots (dynamic_id, position, msg_key, time_label, role_label, cta_tags, template, has_fonte_selector, fonte_default) values (
  '78200aa9-35fb-4179-8922-362c7818e645',
  13,
  '13',
  '21h',
  'Espaço livre — conteúdo ao vivo',
  ARRAY['🔗 Upgrade']::text[],
  '🎥 *[ESPAÇO LIVRE — CONTEÚDO AO VIVO]*

_Este espaço fica em aberto pra equipe preencher com um conteúdo ao vivo extra (ex: aula rápida, Q&A, análise ao vivo de memecoin, etc.)._

⬇️ *${cta}*

👉 ${link}',
  false,
  null
);

insert into message_dynamic_slots (dynamic_id, position, msg_key, time_label, role_label, cta_tags, template, has_fonte_selector, fonte_default) values (
  '78200aa9-35fb-4179-8922-362c7818e645',
  14,
  '14',
  '22h',
  'Encerramento — UPGRADE final',
  ARRAY['🔗 UPGRADE']::text[],
  '${headerNoite}

📊 *RESULTADO DE HOJE:*
🐸 *PEPE:* *— ${acertoP}% DE ACERTO!*
📺 *LIVE:* *— ${acertoL}% DE ACERTO!*
💰 *COPY:* *— ${acertoC}% DE ACERTO!*
━━━━━━━━━━━━━━━━━━━
🚀 *Amanhã tem tudo de novo — quem tá no plano certo pega cada oportunidade primeiro.*

⬇️ *${ctaU}*

👉 ${linkU}',
  true,
  'semana'
);

