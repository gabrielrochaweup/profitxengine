-- Importa 30 prompts de imagem do PDF "Biblioteca de Prompts ProfitX v2"
-- (Freepik Spaces), organizados em 7 colunas novas — uma por personagem/tema,
-- espelhando as seções do próprio documento. Cada prompt guarda variáveis,
-- o prompt completo em inglês e as restrições fixas, prontos pra copiar e
-- preencher.

insert into prompt_categories (id, name, position) values ('f073aad3-2f96-48c3-996d-4ba79c85d08a', 'Imagens Pepe', 4);
insert into prompt_categories (id, name, position) values ('2a99ef3a-2fd2-407e-bf33-40fcfe860f8a', 'Imagens Robson', 5);
insert into prompt_categories (id, name, position) values ('6c6a9e3a-32c4-46b5-9b46-2d5bf5ec7baf', 'Imagens Felipe', 6);
insert into prompt_categories (id, name, position) values ('a41e2bc3-5c44-417c-ab34-8cecdecb437e', 'Imagens Robson + Felipe', 7);
insert into prompt_categories (id, name, position) values ('6944ec2d-68bc-408c-a457-6eff494cbf44', 'Imagens Copy Trader', 8);
insert into prompt_categories (id, name, position) values ('27e5340c-410d-4780-a7bf-538e5c56977e', 'Imagens Dinâmicas Temáticas', 9);
insert into prompt_categories (id, name, position) values ('b1ae3199-5e73-42b8-875d-bfcb71e656cf', 'Imagens Cards Comparativos', 10);

insert into prompts (category_id, title, content, tags) values ('f073aad3-2f96-48c3-996d-4ba79c85d08a', '1.1 PEPE — Variante Padrão (Anúncio / Chamada de Live)', 'Uso: Chamada geral para live, anúncio de sessão, bom dia, convite.

=== VARIÁVEIS — preencha antes de usar ===
[TITULO]: ex: LIVE DE ALAVANCAGEM ← título principal em destaque
[SUBTITULO]: ex: HOJE ÀS 20H ← horário ou subtítulo
[CTA]: ex: ENTRA AGORA ← chamada para ação
[COR_DESTAQUE]: ex: neon green / gold / red ← cor do texto principal
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Generate a premium Brazilian trading banner featuring PEPE the famous green frog meme.

Main character — PEPE:
PEPE the famous green frog meme — bold detailed cartoon style — same consistent rendering
as all previous images — dark black zip-up hoodie — confident knowing smirk —
one eyebrow slightly raised — NOT sad NOT drooping — neon green glowing eyes — winner energy.
PEPE positioned on the left side — large and dominant — upper body visible.
Neon green glow around PEPE — his signature energy field.

Background elements:
Deep black background — neon green circuit pattern faintly visible — candlestick charts rising
in the background — gold particle glow — broadcast signal waves — green particle atmosphere.

Lighting: neon green rim lighting from behind outlining PEPE — dark cinematic atmosphere.

Composition: horizontal landscape layout — wide format 16:9 — PEPE large on the left —
right side reserved for text overlay — no ground visible — tight upper body crop.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [TITULO] — very large bold [COR_DESTAQUE] 3D font with gold outline — most dominant element
Item 2: [SUBTITULO] — large bold gold font with green border box
Item 3: [CTA] — bold white font with green urgent border

DO NOT add any other text. DO NOT add subtitles, slogans, scores or signatures.
Final output: Premium PEPE trading banner — neon green and black — [TITULO] dominant — [CTA] closing.

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['pepe','chamada','anuncio']::text[]);
insert into prompts (category_id, title, content, tags) values ('f073aad3-2f96-48c3-996d-4ba79c85d08a', '1.2 PEPE — Variante Celebração / Resultado de Sessão', 'Uso: Após resultado positivo de sessão. Placar, faturamento, vitória.

=== VARIÁVEIS — preencha antes de usar ===
[PLACAR]: ex: 3X0 / 5X1 / 7X1 ← placar da sessão
[FATURAMENTO]: ex: LUCRAMOS MAIS 1 DIA / +R$2.500 ← resultado financeiro
[MENSAGEM]: ex: SESSÃO ENCERRADA / E AMANHÃ VAI SER SINISTRO ← mensagem de encerramento
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Generate a premium Brazilian trading VICTORY banner featuring PEPE the famous green frog meme.

Main character — PEPE:
PEPE the famous green frog meme — bold detailed cartoon style — dark black zip-up hoodie —
seated at a trading desk — one hand pointing at the monitor — casual and confident.
Multiple monitors in front showing green winning candlestick charts.
Screen light casting neon green glow on PEPE''s face.
PEPE''s expression: satisfied smirk with one eyebrow slightly raised — calm dominance —
the look of someone who just closed another winning session.
Neon green glow around PEPE — energy field active.

Scoreboard element:
Bold prominent scoreboard visible in the upper right or center right area.
The [PLACAR] score — winning number in bright neon green — X in gold — losing number in muted grey.
Gold crown above the scoreboard.

Background elements:
Deep black background — green candlestick charts rising — gold coins and dollar bills raining —
gold particle shower — dark ominous energy at the edges if MENSAGEM is a teaser —
gold and green atmospheric depth.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [PLACAR] — massive bold neon green and gold 3D font — absolute dominant element
Item 2: [FATURAMENTO] — bold white font with green border box
Item 3: [MENSAGEM] — bold gold brush style lettering — closing punchline

DO NOT add any other text. DO NOT add subtitles or signatures.
Final output: PEPE victory banner — [PLACAR] dominant — [FATURAMENTO] — [MENSAGEM] closing.

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['pepe','resultado','vitoria']::text[]);
insert into prompts (category_id, title, content, tags) values ('f073aad3-2f96-48c3-996d-4ba79c85d08a', '1.3 PEPE — Variante Operando ao Vivo', 'Uso: PEPE na sessão operando. Sessão já começou, entra agora.

=== VARIÁVEIS — preencha antes de usar ===
[SESSAO]: ex: SESSÃO DO PEPE AO VIVO / COPY TRADER ATIVO ← nome da sessão
[STATUS]: ex: JÁ COMEÇOU / AO VIVO AGORA ← status da operação
[CTA]: ex: ENTRA AGORA / ACESSA JÁ ← chamada para ação
[PROVA]: ex: ELE JÁ ESTÁ OPERANDO / LUCRO CHEGANDO ← prova de que está funcionando
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Generate a premium Brazilian trading LIVE SESSION banner featuring PEPE the famous green frog meme.

Main character — PEPE:
PEPE the famous green frog meme — bold detailed cartoon style — dark black zip-up hoodie —
seated at a trading desk — actively operating — one hand on keyboard —
other hand pointing directly at the camera — pulling the viewer in right now.
PEPE''s expression: electric and alive — eyes wide and glowing green — enormous excited smile —
the session just started and results are already coming in.
Multiple monitors in front showing active green candlestick charts — all positions winning.
Screen light casting neon green glow on PEPE''s face and hoodie.
Small stack of US dollar bills on the desk corner — first profits already arriving.
Neon green glow around PEPE — energy at maximum.

Background elements:
Very large pulsing red circle AO VIVO indicator — dominant upper area.
Strong broadcast signal waves radiating aggressively outward.
Green candlestick charts rising sharply in the background.
Red and green particle atmosphere — live broadcast energy at maximum.
Gold coins and dollar bills floating throughout — profits flowing now.
White strobe light flares — studio on air energy.

Composition: horizontal landscape 16:9 — PEPE large on left — monitors filling background —
AO VIVO indicator dominant upper right — text overlay on right side.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: pulsing red dot + [SESSAO] AO VIVO — very large bold red and white 3D font
Item 2: [STATUS] — massive bold neon green 3D font — dominant element
Item 3: [CTA] — bold white font with red urgent border
Item 4: [PROVA] — bold gold font with green border box

DO NOT add any other text. DO NOT add subtitles or signatures.
Final output: PEPE live session banner — [STATUS] dominant — pulsing AO VIVO indicator — [CTA].

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['pepe','ao-vivo','sessao']::text[]);
insert into prompts (category_id, title, content, tags) values ('2a99ef3a-2fd2-407e-bf33-40fcfe860f8a', '2.1 ROBSON — Chamada Antecipada (Manhã do dia)', 'Uso: Anunciar a live com antecedência. Gerar curiosidade e antecipação.

=== VARIÁVEIS — preencha antes de usar ===
[TITULO_LIVE]: ex: LIVE DE ALAVANCAGEM ← nome da live
[HORARIO]: ex: HOJE ÀS 20H ← horário
[TEASER]: ex: HOJE TEM SEGREDO / ALGO GRANDE VEM AÍ ← gancho de curiosidade
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.
Use the provided portrait image as the identity source for the human expert.
The central subject must clearly and realistically represent the person from the portrait image.
Preserve accurate facial structure, skin tone, hair, beard, proportions, and identity with maximum fidelity.
Do NOT blend faces. Do NOT add glasses or any eyewear.

Scene construction:
One dominant figure positioned on the right side of the frame, upper body visible from head to waist.
Arms crossed firmly over the chest — calm authority — already planning the night session.
Expression: serious and composed with a subtle knowing energy — the look of someone who
already knows tonight is going to be big and is simply informing you.
Subject wearing a dark fitted outfit — black turtleneck or dark shirt — clean minimal no logos.
Body slightly angled but face directed straight toward the camera.

Art direction:
Ultra-realistic cinematic portrait photography.
Dark background — deep black transitioning into deep green gradient on the left — tonight energy building.
Single dramatic key light from slightly above and front — controlled and clean.
Cool green rim lighting from behind — calm and composed.
Subtle atmosphere — no particles no embers no chaos — clean and still.
Realistic skin texture, beard stubble, hair detail and fabric weave.

Background visual elements — left side only:
Simple calendar icon glowing softly — tonight is the new date.
Subtle clock element — time reference.
Very faint green candlestick chart barely visible — the market continues.
Small sunrise or dawn element — morning energy building toward tonight.
Muted dark background with minimal elements — this is a calm announcement card.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: calendar icon + HOJE TEM [TITULO_LIVE] — large bold neon green font with dark border
Item 2: [TEASER] — massive bold gold 3D font — dominant curiosity trigger
Item 3: [HORARIO] — bold white font with green border box
Item 4: SÓ PARA ALUNOS — bold white font with subtle green border

DO NOT add any other text. DO NOT add subtitles, scores or signatures.
Final output: Expert calm announcement — [TEASER] dominant — [HORARIO] anchor — green tone.

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['robson','chamada','antecipada']::text[]);
insert into prompts (category_id, title, content, tags) values ('2a99ef3a-2fd2-407e-bf33-40fcfe860f8a', '2.2 ROBSON — Falta 2 Horas para a Live', 'Uso: Disparo 2 horas antes da live. Urgência começa a construir.

=== VARIÁVEIS — preencha antes de usar ===
[TITULO_LIVE]: ex: LIVE DE ALAVANCAGEM ← nome da live
[HORARIO]: ex: ÀS 20H / ÀS 21H ← horário da live
[INSTRUCAO]: ex: PREPARA A BANCA / DEIXA A CONTA PRONTA ← instrução de preparação
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.
Use the provided portrait image as the identity source for the human expert.
The central subject must clearly and realistically represent the person from the portrait image.
Preserve accurate facial structure, skin tone, hair, beard, proportions, and identity with maximum fidelity.
Do NOT blend faces. Do NOT add glasses or any eyewear.

Scene construction:
One dominant figure positioned on the right side of the frame, upper body visible from head to waist.
One hand raised with index finger pointing upward — 2 hours remaining gesture — direct and instructional.
Other arm crossed or fist resting at chest — locked in energy.
Expression: serious and commanding — the look of a coach giving final instructions — focused.
Subject wearing a dark outfit — black turtleneck or dark shirt — clean minimal no logos.

Art direction:
Ultra-realistic cinematic portrait photography.
Dark background — deep black transitioning into intense orange and gold gradient on the left.
Single dramatic key light from slightly above and front — high contrast and sharp.
Warm orange and gold rim lighting from behind — heat and urgency building.
Fire and ember particles subtly floating — countdown energy.
Near empty hourglass element glowing in the background — 2 hours remaining.

Background visual elements — left side only:
Large glowing hourglass with approximately 2 hours of sand remaining — orange and gold glow.
Large flame element rising from the lower left — countdown heat.
Green candlestick chart building upward in the background — market about to move.
Fire ember particles floating throughout — Gold coins subtly visible.
Orange and gold light rays building — countdown energy.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: hourglass icon + FALTAM 2 HORAS — very large bold orange and white 3D font
Item 2: [TITULO_LIVE] — large bold neon green 3D font with gold outline
Item 3: [HORARIO] — bold gold font with orange border box
Item 4: [INSTRUCAO] — bold white font with orange border

DO NOT add any other text. DO NOT add subtitles, scores or signatures.
Final output: Expert 2h countdown — FALTAM 2 HORAS dominant — [TITULO_LIVE] — [INSTRUCAO].

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['robson','countdown','2h']::text[]);
insert into prompts (category_id, title, content, tags) values ('2a99ef3a-2fd2-407e-bf33-40fcfe860f8a', '2.3 ROBSON — Falta 1 Hora para a Live', 'Uso: Disparo 1 hora antes da live. Urgência e preparação da banca.

=== VARIÁVEIS — preencha antes de usar ===
[TITULO_LIVE]: ex: LIVE DE ALAVANCAGEM ← nome da live
[HORARIO]: ex: ÀS 20H ← horário
[TEASER]: ex: VAI SER SINISTRO / PREPARE-SE ← teaser de antecipação
[CTA]: ex: PREPARA A BANCA AGORA / DEPOSITE AGORA ← instrução de ação
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.
Use the provided portrait image as the identity source for the human expert.
The central subject must clearly and realistically represent the person from the portrait image.
Preserve accurate facial structure, skin tone, hair, beard, proportions, and identity with maximum fidelity.
Do NOT blend faces. Do NOT add glasses or any eyewear.

Scene construction:
One dominant figure positioned on the right side of the frame, upper body visible from head to waist.
One hand raised with index finger pointing upward — 1 hour remaining gesture.
Other arm crossed or fist resting at chest — locked in energy.
Expression: serious and intensely focused — the look of someone already mentally inside the session.
Subject wearing a dark outfit — black turtleneck or dark shirt — clean minimal no logos.

Art direction:
Ultra-realistic cinematic portrait photography.
Dark background — deep black transitioning into intense orange and gold gradient — final hour fire.
Single dramatic key light from slightly above and front — high contrast and sharp.
Warm orange and gold rim lighting from behind outlining the shoulders — heat and urgency.
Fire and ember particles subtly floating in the background — countdown energy.
Near empty hourglass element glowing in background — one hour remaining.
Realistic skin texture, beard stubble, hair detail and fabric weave.

Background visual elements — left side only:
Large glowing hourglass with approximately one hour of sand remaining — orange and gold glow.
Large flame element rising from the lower left — countdown heat.
Green candlestick chart building upward — market about to move.
Fire ember particles floating. Gold coins subtly visible in lower background.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: hourglass icon + FALTA 1 HORA — very large bold orange and white 3D font
Item 2: [TITULO_LIVE] — large bold neon green 3D font with gold outline
Item 3: [HORARIO] — bold gold font with orange border box
Item 4: [TEASER] — massive bold gold brush style lettering
Item 5: [CTA] — bold white font with orange border

DO NOT add any other text. DO NOT add subtitles, scores or signatures.
Final output: Expert 1h countdown — FALTA 1 HORA dominant — [TITULO_LIVE] — [TEASER] closing.

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['robson','countdown','1h']::text[]);
insert into prompts (category_id, title, content, tags) values ('2a99ef3a-2fd2-407e-bf33-40fcfe860f8a', '2.4 ROBSON — Falta 30 Minutos', 'Uso: Disparo 30 minutos antes. Urgência máxima — carrega a banca.

=== VARIÁVEIS — preencha antes de usar ===
[TITULO_LIVE]: ex: LIVE DE ALAVANCAGEM ← nome da live
[INSTRUCAO]: ex: CARREGA A BANCA AGORA / BANCA CARREGADA FOCO TOTAL ← instrução final
[HORARIO]: ex: ÀS 20H ← horário
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.
Use the provided portrait image as the identity source for the human expert.
The central subject must clearly and realistically represent the person from the portrait image.
Preserve accurate facial structure, skin tone, hair, beard, proportions, and identity with maximum fidelity.
Do NOT blend faces. Do NOT add glasses or any eyewear.

Scene construction:
One dominant figure positioned on the right side of the frame, upper body visible from head to waist.
Both fists clenched at chest level — locked in and ready — war ready energy.
Expression: cold, electric and razor focused — more intense than the 1h version —
jaw set eyes burning — the countdown is almost over, zero tolerance for distraction.
Subject wearing a dark outfit — black turtleneck or dark shirt — clean minimal no logos.

Art direction:
Ultra-realistic cinematic portrait photography.
Dark background — deep black transitioning into intense orange and deep red gradient —
more fire than the 1h version — higher heat.
Intense orange and red rim lighting from behind — maximum heat building.
Larger fire and ember particles — more aggressive than 1h version.
Near empty hourglass with very little sand remaining — almost empty — visceral urgency.
Deep shadows on the sides — cinematic and razor sharp.

Background visual elements — left side only:
Larger more aggressive flame element — bigger than the 1h version.
Glowing hourglass with very little sand remaining — almost empty.
Green candlestick chart spiking sharply upward — market about to explode.
Dense fire ember particles filling more of the background than before.
Pulsing red live dot larger and more prominent in the upper left.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: flame icon + FALTAM 30 MINUTOS — very large bold red and white 3D font
Item 2: [TITULO_LIVE] — large bold neon green 3D with gold outline
Item 3: [INSTRUCAO] — bold white font with red border box — final action
Item 4: A SESSÃO COMEÇA [HORARIO] — bold gold font with green border

DO NOT add any other text. DO NOT add subtitles, scores or signatures.
Final output: Expert 30min countdown — both fists — FALTAM 30 MINUTOS dominant — [INSTRUCAO].

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.
• Do NOT make this feel the same as the 1h version — significantly more intense.', ARRAY['robson','countdown','30min']::text[]);
insert into prompts (category_id, title, content, tags) values ('2a99ef3a-2fd2-407e-bf33-40fcfe860f8a', '2.5 ROBSON — Estamos Ao Vivo', 'Uso: Disparo no momento exato em que a live começa.

=== VARIÁVEIS — preencha antes de usar ===
[TITULO_LIVE]: ex: LIVE DE ALAVANCAGEM ← nome da live
[MSG_ABERTURA]: ex: A SALA ESTÁ ABERTA / ENTREM AGORA ← mensagem de entrada
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.
Use the provided portrait image as the identity source for the human expert.
The central subject must clearly and realistically represent the person from the portrait image.
Preserve accurate facial structure, skin tone, hair, beard, proportions, and identity with maximum fidelity.
Do NOT blend faces. Do NOT add glasses or any eyewear.

Scene construction:
One dominant figure positioned on the right side of the frame, upper body visible from head to waist.
One arm fully extended forward pointing directly at the camera — urgent personal —
the live just started and he came personally to get you.
Other hand open and raised slightly — come now gesture — no more waiting.
Expression: electric, alive, demanding — eyebrows slightly raised, eyes wide and locked —
the look of someone who is live right now and personally pulling you in.
Subject wearing a dark outfit — black turtleneck or dark shirt — clean minimal no logos.

Art direction:
Ultra-realistic cinematic portrait photography.
Dark background — deep black with intense pulsing red and green broadcast energy.
Strong red and white strobe light effect from behind — broadcast is active and running.
Single dramatic key light from slightly above and front — high contrast and sharp.
Intense red rim lighting from behind outlining the shoulders and extended arm.
White light flares subtly suggesting live broadcast lights in the background.

Background visual elements — left side only:
Very large pulsing red circle AO VIVO indicator — biggest and most dominant.
Strong broadcast signal waves radiating aggressively outward — transmission at full power.
Green candlestick chart actively moving — live market data streaming.
Red and green particle atmosphere at maximum density.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: large pulsing red dot + ESTAMOS AO VIVO — very large bold red and white 3D font
Item 2: ENTREM AGORA — massive bold white font with red border — commanding CTA
Item 3: [TITULO_LIVE] — large bold neon green 3D font with gold outline
Item 4: [MSG_ABERTURA] — bold gold font with green border box

DO NOT add any other text. DO NOT add subtitles, scores or signatures.
Final output: Expert live banner — ESTAMOS AO VIVO dominant — ENTREM AGORA — [MSG_ABERTURA].

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['robson','ao-vivo']::text[]);
insert into prompts (category_id, title, content, tags) values ('2a99ef3a-2fd2-407e-bf33-40fcfe860f8a', '2.6 ROBSON — Resultado da Sessão', 'Uso: Após encerramento da live com resultado positivo.

=== VARIÁVEIS — preencha antes de usar ===
[PLACAR]: ex: 2X0 / 4X1 / 3X0 ← placar da sessão
[FATURAMENTO]: ex: ZEROU O MERCADO / LUCRO NO BOLSO ← resultado
[PROX]: ex: PRÓXIMA LIVE AMANHÃ / VOLTA SEGUNDA ← teaser próxima oportunidade
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.
Use the provided portrait image as the identity source for the human expert.
The central subject must clearly and realistically represent the person from the portrait image.
Preserve accurate facial structure, skin tone, hair, beard, proportions, and identity with maximum fidelity.
Do NOT blend faces. Do NOT add glasses or any eyewear.

Scene construction:
One dominant figure positioned on the right side of the frame, upper body visible from head to waist.
Both fists raised high above the shoulders — maximum victory celebration — the result was perfect.
Expression: explosive joy and triumph — wide open mouth laugh or shout — eyes alive —
the look of someone who just delivered a flawless session.
Subject wearing a dark outfit — black turtleneck or dark shirt — clean minimal no logos.

Art direction:
Ultra-realistic cinematic portrait photography.
Dark background — deep black transitioning into deep green and gold gradient — victory energy.
Single dramatic key light from slightly above and front — high contrast and sharp.
Gold and green rim lighting from behind outlining the shoulders and raised fists.
Gold particle shower raining heavily from above — clean sweep reward.
Green confetti or particle explosion around the subject.

Background visual elements — left side only:
Large gold trophy glowing prominently — clean sweep prize.
Green candlestick chart showing winning candles — the wins visualized.
Gold coins and dollar bills raining from above — both operations profitable.
Green upward arrows — all positions won. Gold particle shower throughout.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: PLACAR — small bold gold spaced caps label above the score
Item 2: [PLACAR] — massive bold neon green 3D — winning number in green, X in gold, losses in muted grey
Item 3: [FATURAMENTO] — bold white font with green border box
Item 4: [PROX] — massive bold gold brush style lettering — closing statement

DO NOT add any other text. DO NOT add subtitles, scores or signatures.
Final output: Expert victory banner — [PLACAR] dominant — [FATURAMENTO] — [PROX] closing.

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['robson','resultado','vitoria']::text[]);
insert into prompts (category_id, title, content, tags) values ('6c6a9e3a-32c4-46b5-9b46-2d5bf5ec7baf', '3.1 FELIPE — Falta 1 Hora para a Live', 'Uso: Disparo 1 hora antes da live do Felipe.

=== VARIÁVEIS — preencha antes de usar ===
[TITULO_LIVE]: ex: LIVE DE ALAVANCAGEM ← nome da live
[HORARIO]: ex: ÀS 20H / ÀS 10H ← horário
[TEASER]: ex: VAI SER SINISTRO / PREPARA A BANCA ← teaser
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.
Use the provided portrait image as the identity source for the human expert.
The central subject must clearly and realistically represent the person from the portrait image.
Preserve accurate facial structure, skin tone, hair, beard, proportions, and identity with maximum fidelity.
Do NOT blend faces. Do NOT add glasses or any eyewear.

Scene construction:
One dominant figure positioned on the right side — upper body visible from head to waist.
One finger raised at shoulder level — 1 hour remaining gesture — direct and commanding.
Other arm crossed or fist at chest — locked in energy.
Expression: serious and intensely focused — jaw set — the look of someone already in the zone.
Subject wearing a dark outfit — black turtleneck or dark shirt — clean minimal no logos.

Art direction and background:
Ultra-realistic cinematic portrait photography.
Dark background — intense orange and gold gradient on the left — final hour fire building.
Warm orange and gold rim lighting — countdown heat.
Near empty hourglass glowing in the background — one hour remaining.
Fire and ember particles floating — countdown energy building.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: hourglass icon + FALTA 1 HORA — very large bold orange and white 3D font
Item 2: [TITULO_LIVE] — large bold neon green 3D font with gold outline
Item 3: [HORARIO] — bold gold font with orange border box
Item 4: [TEASER] — massive bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, scores or signatures.
Final output: Felipe 1h countdown — FALTA 1 HORA dominant — [TITULO_LIVE] — [TEASER].

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['felipe','countdown','1h']::text[]);
insert into prompts (category_id, title, content, tags) values ('6c6a9e3a-32c4-46b5-9b46-2d5bf5ec7baf', '3.2 FELIPE — Estamos Ao Vivo', 'Uso: Disparo no momento em que a live do Felipe começa.

=== VARIÁVEIS — preencha antes de usar ===
[TITULO_LIVE]: ex: LIVE DE ALAVANCAGEM ← nome da live
[MSG_ABERTURA]: ex: A SALA ESTÁ ABERTA ← mensagem de entrada
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.
Use the provided portrait image as the identity source for the human expert.
The central subject must clearly and realistically represent the person from the portrait image.
Preserve accurate facial structure, skin tone, hair, beard, proportions, and identity with maximum fidelity.
Do NOT blend faces. Do NOT add glasses or any eyewear.

Scene construction:
One dominant figure positioned on the right side of the frame, upper body visible from head to waist.
One arm fully extended forward pointing directly at the camera — urgent personal live energy.
Other fist raised at shoulder level — victory and live energy combined.
Expression: electric and alive — eyes wide and locked — maximum urgency — live is on.
Subject wearing a dark outfit — black turtleneck or dark shirt — clean minimal no logos.
Body slightly angled but face and pointing arm directed straight toward the camera.

Art direction and background:
Ultra-realistic cinematic portrait photography.
Dark background — deep black with intense pulsing red and green broadcast energy.
Intense red and green mixed rim lighting from behind — broadcast at full power.
Red and white strobe light flares — studio on air energy.
Pulsing broadcast signal rings radiating outward from behind the subject.
Very large pulsing red circle AO VIVO indicator dominant upper left.
Green candlestick charts actively moving — live market data streaming.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: large pulsing red dot + ESTAMOS AO VIVO — very large bold red and white 3D
Item 2: ENTREM AGORA — massive bold white font with red border — most commanding CTA
Item 3: [TITULO_LIVE] — large bold neon green 3D font with gold outline
Item 4: [MSG_ABERTURA] — bold gold font with green border box

DO NOT add any other text. DO NOT add subtitles, scores or signatures.
Final output: Felipe live broadcast banner — ESTAMOS AO VIVO dominant — [MSG_ABERTURA].

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['felipe','ao-vivo']::text[]);
insert into prompts (category_id, title, content, tags) values ('6c6a9e3a-32c4-46b5-9b46-2d5bf5ec7baf', '3.3 FELIPE — Resultado da Sessão', 'Uso: Após encerramento de live do Felipe com resultado positivo.

=== VARIÁVEIS — preencha antes de usar ===
[PLACAR]: ex: 2X0 / 3X1 ← placar da sessão
[FATURAMENTO]: ex: VITÓRIA / LUCRO NO BOLSO ← resultado
[PROX]: ex: VOLTA AMANHÃ / PRÓXIMA LIVE ← próxima oportunidade
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.
Use the provided portrait image as the identity source for the human expert.
The central subject must clearly and realistically represent the person from the portrait image.
Preserve accurate facial structure, skin tone, hair, beard, proportions, and identity with maximum fidelity.
Do NOT blend faces. Do NOT add glasses or any eyewear.

Scene construction:
One dominant figure positioned on the right side — upper body visible from head to waist.
Both fists raised in controlled victory gesture — calm dominance.
Expression: serious controlled satisfaction — not loud celebration — the look of someone who
expected to win and did — quiet authority.
Subject wearing a dark outfit — black turtleneck or dark shirt — clean minimal no logos.

Art direction and background:
Ultra-realistic cinematic portrait photography.
Dark background — green and gold victory atmosphere.
Gold and green rim lighting — victory energy.
Gold particle shower — result achieved energy.
Large gold trophy glowing in the upper background.
Green candlestick chart showing clean upward move.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: PLACAR — small bold gold spaced caps label
Item 2: [PLACAR] — massive bold 3D — 1 in neon green, X in gold, 0 in dark muted grey
Item 3: [FATURAMENTO] — bold white font with green border box
Item 4: [PROX] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles or signatures.
Final output: Felipe victory banner — [PLACAR] dominant — [FATURAMENTO] — [PROX].

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['felipe','resultado','vitoria']::text[]);
insert into prompts (category_id, title, content, tags) values ('a41e2bc3-5c44-417c-ab34-8cecdecb437e', '4.1 DUPLA ROBSON + FELIPE — Falta 1 Hora', 'Uso: Quando os dois estão na live. Conectar DUAS fotos nos nós do Freepik.

=== VARIÁVEIS — preencha antes de usar ===
[TITULO_LIVE]: ex: LIVE DE ALAVANCAGEM ← nome da live
[HORARIO]: ex: HOJE ÀS 20H ← horário
[TEASER]: ex: VAI SER SINISTRO / PREPARE-SE ← teaser
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

There are TWO portrait reference images attached.
Image 1 is the identity source for Expert 1 — Robson — position him on the LEFT side of the frame.
Image 2 is the identity source for Expert 2 — Felipe — position him on the RIGHT side of the frame.
Both subjects must clearly and realistically represent the exact person from their respective portrait.
Preserve accurate facial structure, skin tone, hair, beard, proportions and identity for EACH person.
Do NOT blend faces. Do NOT merge identities. Do NOT add glasses to either subject.
Each person must be immediately recognizable as their own individual — two distinct people.

Scene construction:
Two dominant figures positioned side by side — equal visual weight — neither more prominent.
Both figures upper body visible from head to waist.
Robson on the left — arms crossed firmly — serious and commanding.
Felipe on the right — arms crossed firmly — same serious energy.
Both expressions: cold intense and focused — jaw set eyes burning — final countdown warriors.
Both wearing dark outfits — black turtleneck or dark shirt — clean minimal no logos.
Both bodies slightly angled inward toward each other — faces directed straight at camera.

Art direction and background:
Ultra-realistic cinematic portrait photography for both subjects.
Dark background — intense orange and gold gradient — final hour countdown fire.
Single dramatic key light illuminating both figures equally.
Intense orange and gold rim lighting outlining both figures from behind.
Near empty hourglass centered between them — glowing orange — almost out of time.
Large aggressive flame elements rising from the lower center.
Dense fire ember particles filling the background aggressively.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: hourglass icon + FALTA 1 HORA — very large bold orange and white 3D font — top center
Item 2: [TITULO_LIVE] — large bold neon green 3D with gold outline
Item 3: [HORARIO] — bold gold font with orange border box
Item 4: [TEASER] — massive bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, scores or signatures.
Final output: Robson + Felipe countdown — equal weight — FALTA 1 HORA dominant — [TITULO_LIVE].

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.
• Do NOT make one expert more prominent than the other — equal visual weight always.', ARRAY['robson','felipe','dupla','countdown']::text[]);
insert into prompts (category_id, title, content, tags) values ('a41e2bc3-5c44-417c-ab34-8cecdecb437e', '4.2 DUPLA ROBSON + FELIPE — Falta 30 Minutos', 'Uso: 30 minutos antes da live com os dois. Urgência máxima — dupla intensidade.

=== VARIÁVEIS — preencha antes de usar ===
[TITULO_LIVE]: ex: LIVE DE ALAVANCAGEM ← nome da live
[INSTRUCAO]: ex: CARREGA A BANCA AGORA / ÚLTIMA CHANCE DE ENTRAR ← instrução final
[HORARIO]: ex: ÀS 20H ← horário
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

There are TWO portrait reference images attached.
Image 1 = Robson — LEFT side. Image 2 = Felipe — RIGHT side.
Do NOT blend faces. Do NOT merge identities. Do NOT add glasses to either.

Scene construction:
Two dominant figures side by side — equal visual weight.
Both upper body visible from head to waist.
Robson on the left — both fists clenched at chest level — war ready energy.
Felipe on the right — both fists clenched at chest level — same war ready energy — mirror intensity.
Both expressions: cold electric and razor focused — jaw set — final 30 minutes — both in war mode.
Both wearing dark outfits — black turtleneck or dark shirt — clean minimal no logos.

Art direction and background:
Ultra-realistic cinematic portrait photography for both.
Dark background — intense red and orange gradient — more aggressive than the 1h version.
Intense red and orange rim lighting outlining both figures — heat at absolute maximum.
Near empty hourglass centered between them — barely any sand remaining — consumed by fire.
Larger more aggressive flame elements — bigger than before.
Dense aggressive fire ember particles filling the entire background.
Red warning strobe effect at the edges — alarm energy.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: flame icon + FALTAM 30 MINUTOS — very large bold red and white 3D — most aggressive
Item 2: [TITULO_LIVE] — large bold neon green 3D with gold outline
Item 3: [INSTRUCAO] — bold white font with red border — final action
Item 4: A SESSÃO COMEÇA [HORARIO] — bold gold font with green border

DO NOT add any other text. DO NOT add subtitles or signatures.
Final output: Robson + Felipe 30min — both fists — FALTAM 30 MINUTOS dominant — [INSTRUCAO].

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.
• Do NOT make one expert more prominent — equal visual weight always.
• Do NOT make this feel the same as the 1h version — significantly more intense and aggressive.', ARRAY['robson','felipe','dupla','countdown']::text[]);
insert into prompts (category_id, title, content, tags) values ('a41e2bc3-5c44-417c-ab34-8cecdecb437e', '4.3 DUPLA ROBSON + FELIPE — Estamos Ao Vivo', 'Uso: Momento exato da live com os dois experts juntos.

=== VARIÁVEIS — preencha antes de usar ===
[TITULO_LIVE]: ex: LIVE DE ALAVANCAGEM ← nome da live
[MSG_ABERTURA]: ex: A SALA ESTÁ ABERTA ← mensagem de entrada
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

There are TWO portrait reference images attached.
Image 1 = Robson — LEFT side. Image 2 = Felipe — RIGHT side.
Do NOT blend faces. Do NOT merge identities. Do NOT add glasses to either.

Scene construction:
Two dominant figures positioned side by side — equal visual weight.
Robson on the left — one arm fully extended forward pointing directly at the camera.
Felipe on the right — one fist raised at shoulder level and other arm open palm — come in now.
Both expressions: electric and alive — eyes wide and locked — live started — pulling you in now.
Both wearing dark outfits — black turtleneck or dark shirt — clean minimal no logos.

Art direction and background:
Ultra-realistic cinematic portrait photography for both.
Dark background — deep black with intense pulsing red and green broadcast energy.
Intense red and green mixed rim lighting outlining both figures — broadcast at full power.
Very large pulsing red circle AO VIVO indicator dominant upper center between them.
Strong broadcast signal waves radiating aggressively outward from both figures.
Red and white strobe light flares — studio on air energy at maximum.
Green candlestick charts actively moving — live market data streaming.
Dense red and green particle atmosphere at maximum density.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: large pulsing red dot + ESTAMOS AO VIVO — very large bold red and white 3D
Item 2: ENTREM AGORA — massive bold white font with red border — most commanding CTA
Item 3: [TITULO_LIVE] — large bold neon green 3D with gold outline
Item 4: [MSG_ABERTURA] — bold gold font with green border box

DO NOT add any other text. DO NOT add subtitles or signatures.
Final output: Robson + Felipe live — equal weight — ESTAMOS AO VIVO dominant — [MSG_ABERTURA].

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.
• Do NOT make one expert more prominent than the other — equal visual weight always.', ARRAY['robson','felipe','dupla','ao-vivo']::text[]);
insert into prompts (category_id, title, content, tags) values ('6944ec2d-68bc-408c-a457-6eff494cbf44', '5.1 COPY TRADER — Automático 24 Horas', 'Uso: Apresentação do produto. Conceito de automação — ele opera enquanto você descansa.

=== VARIÁVEIS — preencha antes de usar ===
[BENEFICIO]: ex: LUCRO NO AUTOMÁTICO 24H / ELE OPERA VOCÊ LUCRA ← promessa central
[CTA]: ex: ATIVE O SEU / ACESSE AGORA / NOSSO COPY OPERA POR VOCÊ ← chamada para ação
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Generate a premium Brazilian trading AUTOMATION banner featuring Copy Trader robot — no human expert.

Main character — Copy Trader Robot:
Same sleek dark metallic humanoid robot from all previous banners — dark suit jacket fitted —
gold circuit lines glowing beneath the fabric — calm active operation pose.
Robot seated at a trading desk or standing over it — one hand on holographic keyboard —
operating with total ease — pure automation — no effort.
Robot eyes: glowing gold — steady and precise — not intense or urgent — just consistently working.
Gold circuit lines at a steady rich pulse — the machine in its natural state — always on.

Day and night visual concept:
Split atmosphere behind the robot — left side suggests daytime — subtle warm light —
right side suggests nighttime — deep dark with stars or moon glow.
The robot operates through both — never stops for either.
A large circular 24H clock element glowing softly in the background — always running.
Sun and moon element subtly present on each side.
Faint human silhouette in the far background relaxing — suggesting freedom.

Background elements:
Deep black with day-to-night gradient — green candlestick charts rising steadily —
gold coins accumulating — clock element glowing — gold particle shower raining softly.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: COPY TRADER PROFISSIONAL — large bold neon green 3D with gold outline
Item 2: [BENEFICIO] — massive bold gold 3D — dominant promise — largest element
Item 3: ENQUANTO VOCÊ VIVE SUA VIDA — bold white font with green border box
Item 4: [CTA] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, scores or signatures.
DO NOT make the robot look urgent or stressed — calm relentless automated operation only.
Final output: Robot 24h automation banner — [BENEFICIO] dominant — day night split.

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['copy-trader','robo','automacao']::text[]);
insert into prompts (category_id, title, content, tags) values ('6944ec2d-68bc-408c-a457-6eff494cbf44', '5.2 COPY TRADER — Taxa de Acerto', 'Uso: Divulgação de performance histórica. Taxa de acerto e placar.

=== VARIÁVEIS — preencha antes de usar ===
[TAXA]: ex: 85% / 90% / 92% ← taxa de acerto histórico
[FERRAMENTA]: ex: COPY TRADER / IA PEPE ← nome da ferramenta
[PLACAR]: ex: 17X3 / 22X2 ← placar de operações
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Generate a premium Brazilian trading PERFORMANCE banner featuring Copy Trader robot — no human.

Main character — Copy Trader Robot:
Same sleek dark metallic humanoid robot — dark suit jacket — gold circuit lines — confident pose.
One arm raised pointing at a large circular performance ring floating beside it.
Robot eyes: glowing gold — cold precision — maximum processing mode.
Gold circuit lines pulsing intensely — calculating winning positions.

Performance data visual — floating beside the robot:
A large glowing circular progress ring — centered on the right side of the frame.
The ring filled to [TAXA] capacity — neon green fill showing the percentage — clean and precise.
Small data bars or tick marks around the ring — predominantly green ticks — very few red ticks.
Subtle holographic panel below showing a simple win loss scoreboard — more green than red.
Gold particle glow emanating from the performance ring outward.

Background elements:
Deep black atmospheric background — green candlestick chart rising in the far background —
gold particle shower — circuit pattern behind the robot — green upward arrows.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [FERRAMENTA] — large bold neon green font — tool label upper area
Item 2: [TAXA] DE TAXA DE ACERTO — massive bold gold 3D with neon green glow — dominant
Item 3: PLACAR: [PLACAR] — bold white font with green border box
Item 4: ELE NÃO ERRA — bold gold brush lettering — closing punchline

DO NOT add any other text. DO NOT add subtitles or signatures.
DO NOT show more red than green in the win rate visual — [TAXA] accuracy must be visually obvious.
Final output: Robot performance banner — [TAXA] dominant — performance ring — ELE NÃO ERRA.

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['copy-trader','robo','performance']::text[]);
insert into prompts (category_id, title, content, tags) values ('6944ec2d-68bc-408c-a457-6eff494cbf44', '5.3 COPY TRADER — Maratona do Robô', 'Uso: Maratona de fim de semana ou dia inteiro. Robô nunca para.

=== VARIÁVEIS — preencha antes de usar ===
[PERIODO]: ex: SÁBADO E DOMINGO / O DIA TODO ← período da maratona
[DESTAQUE]: ex: ELE NÃO PARA / LUCRO A CADA PASSO ← frase de impacto
[STATUS]: ex: MARATONA COMEÇOU / ÚLTIMO DIA / RETA FINAL ← status atual
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Generate a premium Brazilian trading MARATHON banner — Copy Trader robot as main character — no human.

Main character — Copy Trader Robot in running pose:
Same elevated premium robot — dark suit jacket — gold circuit lines blazing at full intensity.
Robot in a dynamic RUNNING pose — one leg forward one leg back — arms pumping forward —
full sprint energy — the machine is racing — motion blur on legs and arms.
The suit jacket slightly open from the speed — gold circuit lines on chest visible beneath.
Robot eyes: glowing gold at maximum intensity — locked on the finish line — laser focused.
Gold coins and dollar bills flying off the robot as it runs — profits generated with every stride.

Marathon race environment:
The robot running on a track made of glowing green candlestick bars — each bar a winning trade.
Finish line ahead made entirely of US dollar bills — stretched horizontally — close but not crossed.
Runner silhouettes far behind in the background — the robot has left everyone behind.

Background elements:
Deep black — gold trophy glowing in upper center — green candlestick track rising as robot runs —
dense gold particle trail behind the robot — green upward arrows — clock showing full day operation.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: MARATONA DE ALAVANCAGEM — large bold neon green 3D with gold outline
Item 2: [DESTAQUE] — massive bold gold 3D — dominant statement
Item 3: [PERIODO] — bold white font with green border box
Item 4: [STATUS] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles or signatures.
DO NOT make the robot standing still — full dynamic running stride only.
DO NOT make the finish line crossed yet — robot is still racing toward it.
Final output: Robot marathon banner — running pose — finish line in dollars — [DESTAQUE] dominant.

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['copy-trader','robo','maratona']::text[]);
insert into prompts (category_id, title, content, tags) values ('6944ec2d-68bc-408c-a457-6eff494cbf44', '5.4 COPY TRADER — Alavancagem Sniper', 'Uso: Sessão de precisão cirúrgica. Robô como atirador de elite.

=== VARIÁVEIS — preencha antes de usar ===
[TITULO]: ex: ALAVANCAGEM SNIPER / PRECISÃO TOTAL ← título principal
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Generate a premium cinematic action banner featuring the Copy Trader robot in a sniper pose.
Style inspired by high end video game cover — dark cinematic atmospheric composition.

Main character — Copy Trader Robot in sniper pose:
Same elevated premium robot from all previous banners — dark metallic body — dark suit jacket —
gold circuit lines glowing beneath.
Robot positioned on the right side of the frame — crouching or kneeling — body leaning forward
over the sniper rifle — same dramatic pose as a professional sniper.
Both mechanical hands gripping a large sleek futuristic sniper rifle — long barrel extending forward.
Robot head slightly lowered — optical sensor aligned with the rifle scope — targeting mode.
Robot eyes: glowing gold — locked on target — maximum precision mode.
Gold circuit lines on the robot body pulsing intensely — processing the perfect entry.

Scene environment:
Dark elevated position — the robot is on a rooftop or high vantage point overlooking the city.
Below in the far distance: glowing city lights at night — financial district — skyscrapers.
Night atmosphere — deep dark sky — dramatic cinematic lighting from the side.
Gold circuit light from robot serving as primary light source.
City lights below creating warm ambient glow reflecting subtly on the robot.
Shallow depth of field — robot sharp — city background beautifully blurred with bokeh.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [TITULO] — large bold white clean font — left side of frame — cinematic title position

DO NOT add any other text. DO NOT add subtitles or signatures.
DO NOT make the sniper rifle look toy-like — realistic futuristic weapon with gold accents.
DO NOT add any logos brand names or recognizable text.
Final output: Robot sniper banner — crouching pose — city lights bokeh — [TITULO] left side.

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['copy-trader','robo','sniper']::text[]);
insert into prompts (category_id, title, content, tags) values ('6944ec2d-68bc-408c-a457-6eff494cbf44', '5.5 COPY TRADER + EXPERT — Dupla operando juntos', 'Uso: Expert + Robô apresentando resultado ou chamada de live juntos.

=== VARIÁVEIS — preencha antes de usar ===
[TITULO]: ex: MARATONA COMEÇOU / COPY TRADER ATIVADO ← título principal
[INSTRUCAO]: ex: CHAME O COMERCIAL / FAÇA SEU DEPÓSITO AGORA ← instrução de ação
[PROVA]: ex: O ROBÔ JÁ ESTÁ OPERANDO / RESULTADO GARANTIDO ← prova social
[CTA]: ex: GARANTA SUA VAGA / ENTRA AGORA ← chamada para ação
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.
Use the provided portrait image as the identity source for the human expert.
The central subject must clearly and realistically represent the person from the portrait image.
Preserve accurate facial structure, skin tone, hair, beard, proportions, and identity with maximum fidelity.
Do NOT blend faces. Do NOT add glasses or any eyewear.

Scene construction — two dominant figures side by side:
Expert (Robson) positioned on the left — photorealistic — upper body visible —
one arm extended forward pointing directly at the camera — urgent personal CTA energy.
Expression: serious and electric — urgent delivery — act now.
Subject wearing a dark outfit — black turtleneck or dark shirt — clean minimal no logos.
Copy Trader robot positioned on the right — same elevated premium robot from previous prompts —
dark suit jacket — gold circuit lines glowing — arms open wide or one fist raised — fully activated.
Robot eyes: glowing gold — fully operational — session has begun.
Both figures at equal visual weight — human authority left — AI power right.
Subtle gold energy connection between expert and robot — unified team.

Art direction and background:
Ultra-realistic cinematic portrait photography for expert — premium elevated cartoon for robot.
Dark background — intense gold and green gradient — session is live energy.
Gold and green rim lighting outlining both figures from behind — unified team.
Gold particle explosion throughout — profits being generated right now.
Green candlestick charts rising sharply in background — session is live.
Gold coins and dollar bills raining from above — profits flowing now.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: fire icon + [TITULO] — very large bold neon green 3D font with gold outline — dominant
Item 2: [INSTRUCAO] — massive bold white font with red urgent border — primary CTA
Item 3: [PROVA] — bold white font with green border box
Item 4: [CTA] — bold gold brush style lettering — closing

DO NOT add any other text. DO NOT add subtitles or signatures.
Final output: Expert + Robot banner — [TITULO] dominant — [INSTRUCAO] as primary CTA.

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.
• Do NOT make the robot more dominant than the expert — equal visual weight.', ARRAY['copy-trader','robo','robson','dupla']::text[]);
insert into prompts (category_id, title, content, tags) values ('27e5340c-410d-4780-a7bf-538e5c56977e', '6.1 Alavancagem com Bônus de Plano', 'Uso: Bônus do plano disponível junto com a alavancagem. Expert + Robô juntos.

=== VARIÁVEIS — preencha antes de usar ===
[BONUS]: ex: ALAVANCAGEM BÔNUS DE PLANO ← nome do bônus
[BENEFICIO]: ex: DOBRA A BANCA + UPGRADE GRÁTIS ← o que o aluno ganha
[PERIODO]: ex: VÁLIDO O DIA TODO / SÓ HOJE ← quando expira
[CTA]: ex: GARANTA HOJE / ACESSE AGORA ← chamada para ação
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.
Use the provided portrait image as the identity source for the human expert.
The central subject must clearly and realistically represent the person from the portrait image.
Preserve accurate facial structure, skin tone, hair, beard, proportions, and identity with maximum fidelity.
Do NOT blend faces. Do NOT add glasses or any eyewear.

Scene construction — expert + robot:
Expert positioned on the left — arms crossed — serious and composed — exclusive bonus energy.
The look of someone delivering something special and exclusive today.
Subject wearing a dark outfit — black turtleneck or dark shirt — clean minimal no logos.
Copy Trader robot on the right — same premium style — dark suit jacket — gold circuit lines —
upright authoritative pose — fully activated and ready.
Robot eyes glowing gold — operational and precise.
Both figures equal visual weight — unified team presenting today''s bonus.
Subtle gold energy connection between the expert and the robot.

Art direction and background:
Ultra-realistic cinematic portrait for expert — premium cartoon for robot.
Dark background — deep black — gold and green premium gradient throughout.
Large gold crown or star element glowing in the upper background — bonus and exclusivity symbol.
Sun or sunrise element subtly visible — morning announcement energy.
Green candlestick chart rising — today''s session will be powerful.
Gold coins and dollar elements floating softly throughout.
Gold particle shower raining — today is special.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: sun icon + BOM DIA — large bold white font with gold glow
Item 2: [BONUS] — massive bold neon green 3D with gold outline — dominant announcement
Item 3: [BENEFICIO] — bold gold font with green border box
Item 4: [PERIODO] — bold white font with gold border
Item 5: [CTA] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, scores or signatures.
Final output: Expert + Robot bonus banner — [BONUS] dominant — [BENEFICIO] — [CTA].

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['dinamica','bonus','robson','robo']::text[]);
insert into prompts (category_id, title, content, tags) values ('27e5340c-410d-4780-a7bf-538e5c56977e', '6.2 Alavancagem com Maratona', 'Uso: Maratona de sábado e domingo ou dia inteiro. Expert + Robô correndo.

=== VARIÁVEIS — preencha antes de usar ===
[PERIODO]: ex: SÁBADO E DOMINGO / O FIM DE SEMANA TODO ← período da maratona
[DESTAQUE]: ex: FINAL DE SEMANA LUCRATIVO / ELE OPERA VOCÊ DESCANSA ← frase principal
[STATUS]: ex: JÁ COMEÇOU / ÚLTIMO DIA / RETA FINAL ← status da maratona
[CTA]: ex: FAÇA SEU DEPÓSITO / ENTRE NA MARATONA ← chamada para ação
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Generate a premium Brazilian trading MARATHON WEEKEND banner.
Central hero: Copy Trader robot as the marathon champion — no human expert.

Main character — Copy Trader Robot as marathon champion:
Same elevated premium robot — dark suit jacket — gold circuit lines blazing.
Robot in triumphant champion pose — arms spread wide — chest out — controlling everything.
The robot is the undisputed winner of the marathon — [PERIODO] of non-stop operation.
Robot eyes: glowing gold at maximum intensity.

Marathon scene elements:
Finish line made entirely of US dollar bills stretched horizontally across the frame.
The robot breaking through or standing triumphantly behind it.
Gold coins and dollar bills exploding outward in all directions as robot breaks through.
Runner silhouettes in the far background — the community also crossing.
The track: glowing gold and green path with candlestick chart patterns embedded.
Large gold trophy glowing prominently in the upper background.

Background elements:
Deep black — gold and green gradient — gold particle shower — green candlestick charts rising —
gold coins raining from above — green upward arrows — calendar showing [PERIODO].

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: trophy icon + MARATONA COPY TRADER — large bold neon green 3D with gold outline
Item 2: [DESTAQUE] — massive bold gold 3D — dominant weekend promise
Item 3: [PERIODO] — bold white font with green border box — the two day anchor
Item 4: [STATUS] — bold white font with orange border — current status
Item 5: [CTA] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles or signatures.
Final output: Robot marathon banner — finish line dollars — [DESTAQUE] dominant — [STATUS].

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['dinamica','maratona','robo']::text[]);
insert into prompts (category_id, title, content, tags) values ('27e5340c-410d-4780-a7bf-538e5c56977e', '6.3 Alavancagem com Mentoria', 'Uso: Mentoria disponível junto com a alavancagem. Urgência — hoje é o dia.

=== VARIÁVEIS — preencha antes de usar ===
[TITULO]: ex: ALAVANCAGEM COM MENTORIA COPY TRADER ← título do produto
[LUCRO]: ex: 100% / ATÉ 50% ← percentual de lucro
[PERIODO]: ex: HOJE É O DIA / ÚLTIMAS VAGAS ← urgência temporal
[CTA]: ex: GARANTA AGORA / ACESSE ← chamada para ação
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Generate a premium Brazilian trading MENTORSHIP banner — Copy Trader robot only — no human.

Main character — Copy Trader Robot in teaching pose:
Same elevated premium robot — dark suit jacket — gold circuit lines — commanding teaching pose.
One arm extended forward pointing directly at the viewer — the machine is personally selecting you.
Other arm gesturing at holographic curriculum panels floating beside it.
Robot eyes: glowing gold and direct — this machine is looking at you specifically.
Gold circuit lines at maximum pulse — robot in full operation and mentorship mode simultaneously.

Mentorship visual elements:
A glowing holographic classroom panel floating beside the robot — structured curriculum layout.
Each panel showing: candlestick charts with entry markers — operation sequences — copy trader steps.
Gold energy threads extending from robot toward the panels — knowledge transfer visualization.
A large gold key or unlock symbol subtly glowing — access being granted today only.
Small student silhouettes very faint in the far background — community receiving mentorship.

Background elements:
Deep black — gold and orange gradient on the left — urgency today energy.
Green candlestick chart rising sharply — gold particle shower — fire edges for urgency.
Gold and green light rays radiating from the robot outward.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: alarm icon + [PERIODO] — large bold orange and white 3D font
Item 2: [TITULO] — massive bold neon green 3D with gold outline — dominant product name
Item 3: ALAVANCAGEM ATÉ [LUCRO] + MENTORIA GRAVADA — bold white with green border
Item 4: [CTA] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, scores or signatures.
Final output: Robot mentorship banner — [TITULO] dominant — [LUCRO] — [CTA].

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['dinamica','mentoria','robo']::text[]);
insert into prompts (category_id, title, content, tags) values ('27e5340c-410d-4780-a7bf-538e5c56977e', '6.4 Mentoria Completa Copy Trader', 'Uso: Apresentação do produto completo. Sem urgência — produto atemporal.

=== VARIÁVEIS — preencha antes de usar ===
[CTA]: ex: ACESSE AGORA / GARANTA O SEU ← chamada para ação
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Generate a premium Brazilian trading COMPLETE MENTORSHIP product banner — robot only — no human.
No time references — no urgency — pure premium evergreen product presentation energy.

Main character — Copy Trader Robot in presenting pose:
Same elevated premium robot — dark suit jacket — gold circuit lines richly glowing.
Robot in a proud presenting pose — both arms slightly open and forward —
like a professor presenting the full curriculum — or one arm gesturing toward holographic panels.
Robot eyes: glowing gold — deep and intelligent — the look of total mastery.
Gold circuit lines at maximum richness — glowing with depth and precision.

Complete mentorship visual elements:
Multiple layered holographic panels floating around the robot on the left side.
Each panel showing a different aspect: candlestick charts — entry markers — percentage indicators —
operation sequences — copy trader activation steps — all in gold and green.
Panels arranged in a structured curriculum layout — suggesting completeness and depth.
Gold connecting lines between all panels — unified complete system.
A large gold open book or diploma element subtly visible — complete knowledge symbol.
Gold laurel or crown element above the robot — mastery and completeness.

Background elements:
Deep black — rich gold and deep green gradient — gold particle atmosphere — green chart rising.
Subtle gold circuit pattern behind the robot — the complete AI system.
Gold and green light rays radiating outward — full spectrum coverage.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: MENTORIA COMPLETA — very large bold white 3D with gold outline — product qualifier
Item 2: COPY TRADER — massive bold neon green 3D with gold outline — dominant — even bigger
Item 3: TUDO QUE VOCÊ PRECISA PARA OPERAR — bold gold font with green border box
Item 4: [CTA] — bold white font with green border

DO NOT add any other text. DO NOT add time references, hours or urgency elements.
DO NOT add any subtitles or signatures.
Final output: Robot complete mentorship — COPY TRADER dominant — MENTORIA COMPLETA qualifier.

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['dinamica','mentoria','robo','evergreen']::text[]);
insert into prompts (category_id, title, content, tags) values ('27e5340c-410d-4780-a7bf-538e5c56977e', '6.5 Alavancagem de Batalha', 'Uso: Sessão de alto risco e alto retorno. Energia agressiva de combate.

=== VARIÁVEIS — preencha antes de usar ===
[HORARIO]: ex: HOJE ÀS 20H / AGORA ← quando começa a batalha
[ALVO]: ex: DOBRAR A BANCA / DESTRUIR O MERCADO / TUDO OU NADA ← objetivo
[CTA]: ex: ENTRA NA BATALHA / PREPARA A BANCA ← chamada para ação
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.
Use the provided portrait image as the identity source for the human expert.
The central subject must clearly and realistically represent the person from the portrait image.
Preserve accurate facial structure, skin tone, hair, beard, proportions, and identity with maximum fidelity.
Do NOT blend faces. Do NOT add glasses or any eyewear.

Scene construction:
One dominant figure on the right — both fists raised high — battle stance —
expression: cold menacing war face — jaw set — warrior going into battle — zero fear.
Subject wearing a dark outfit — black turtleneck or dark shirt — clean minimal no logos.

Art direction and background:
Ultra-realistic cinematic portrait photography.
Dark background — intense red and dark crimson gradient — war and battle energy.
Large aggressive flame elements rising from lower areas — dramatic.
Explosion of fire and sparks — sword or battle element subtly visible.
Red warning strobe at edges — green candlestick chart spiking violently.
Ember particles everywhere — hotter than any other prompt.
Deep red and orange rim lighting — maximum battle energy.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: sword/crossed swords icon + ALAVANCAGEM DE BATALHA — large bold red and white 3D
Item 2: [ALVO] — massive bold neon green 3D with gold outline — the battle objective
Item 3: [HORARIO] — bold gold font with red border — time of battle
Item 4: [CTA] — bold white font with red urgent border

DO NOT add any other text. DO NOT add subtitles or signatures.
Final output: Expert battle banner — war pose — ALAVANCAGEM DE BATALHA — [ALVO] dominant.

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['dinamica','batalha','robson']::text[]);
insert into prompts (category_id, title, content, tags) values ('27e5340c-410d-4780-a7bf-538e5c56977e', '6.6 Alavancagem Premium', 'Uso: Sessão VIP exclusiva. Tom premium, luxuoso e seleto.

=== VARIÁVEIS — preencha antes de usar ===
[HORARIO]: ex: HOJE ÀS 20H ← horário
[EXCLUSIVIDADE]: ex: SÓ PARA ELITE / VAGAS LIMITADAS / VIP EXCLUSIVO ← fator de exclusividade
[LUCRO]: ex: ATÉ 100% / DOBRA A BANCA ← promessa de lucro
[CTA]: ex: GARANTA SUA VAGA VIP / ACESSA AGORA ← chamada para ação
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.
Use the provided portrait image as the identity source for the human expert.
The central subject must clearly and realistically represent the person from the portrait image.
Preserve accurate facial structure, skin tone, hair, beard, proportions, and identity with maximum fidelity.
Do NOT blend faces. Do NOT add glasses or any eyewear.

Scene construction:
One dominant figure on the right — arms crossed — composed cold dominance —
expression: the look of someone offering something rare and exclusive — premium authority.
Subject wearing a dark outfit — black turtleneck or dark shirt — clean minimal no logos.

Art direction and background:
Ultra-realistic cinematic portrait photography.
Dark background — rich gold and deep green gradient — exclusive premium atmosphere.
Large gold diamond or crown element glowing — VIP and exclusivity symbol.
Gold particle shower — velvet rope or VIP visual suggestion — candlestick chart in gold tones.
Premium luxurious atmosphere — gold and green only — zero red zero fire.
Warm gold rim lighting — exclusive premium energy.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: diamond icon + ALAVANCAGEM PREMIUM — large bold gold 3D with green outline
Item 2: [LUCRO] — massive bold neon green 3D — dominant profit promise
Item 3: [EXCLUSIVIDADE] — bold white font with gold border — VIP exclusivity
Item 4: [HORARIO] — bold gold font with green border box — time anchor
Item 5: [CTA] — bold gold brush style lettering

DO NOT add any other text. DO NOT add subtitles, scores or signatures.
Final output: Expert premium banner — gold luxury — [LUCRO] dominant — [EXCLUSIVIDADE].

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['dinamica','premium','vip']::text[]);
insert into prompts (category_id, title, content, tags) values ('27e5340c-410d-4780-a7bf-538e5c56977e', '6.7 Sessão Kamikaze', 'Uso: Sessão de risco extremo. Tom explosivo, radical e ousado.

=== VARIÁVEIS — preencha antes de usar ===
[HORARIO]: ex: HOJE ÀS 20H / AGORA ← horário
[RISCO]: ex: TUDO OU NADA / ALL IN / SEM LIMITES ← nível de risco
[CTA]: ex: SE TIVER CORAGEM / ENTRA SE QUISER ← chamada ousada
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.
Use the provided portrait image as the identity source for the human expert.
The central subject must clearly and realistically represent the person from the portrait image.
Preserve accurate facial structure, skin tone, hair, beard, proportions, and identity with maximum fidelity.
Do NOT blend faces. Do NOT add glasses or any eyewear.

Scene construction:
One dominant figure on the right — arms wide open and raised — explosive energy —
expression: wild intense and fearless — the look of someone about to do something extreme.
Subject wearing a dark outfit — black turtleneck or dark shirt — clean minimal no logos.

Art direction and background:
Ultra-realistic cinematic portrait photography.
Dark background — massive explosion element centered — fire and smoke filling the frame.
Dramatic orange red and yellow explosion light — sparks and debris flying everywhere.
Green candlestick spiking violently — neon green against the explosion.
Most intense and chaotic background of all prompts — extreme energy.
Explosive orange and red rim lighting — chaotic and extreme.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: explosion icon + SESSÃO KAMIKAZE — large bold orange and red 3D font
Item 2: [RISCO] — massive bold neon green 3D — the extreme risk statement
Item 3: [HORARIO] — bold white font with orange border
Item 4: [CTA] — bold gold brush lettering — provocative CTA

DO NOT add any other text. DO NOT add subtitles or signatures.
Final output: Expert kamikaze banner — explosion — SESSÃO KAMIKAZE — [RISCO] dominant.

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['dinamica','kamikaze','risco']::text[]);
insert into prompts (category_id, title, content, tags) values ('27e5340c-410d-4780-a7bf-538e5c56977e', '6.8 Upgrade Direto', 'Uso: Oferta de upgrade de plano com comparativo de resultado.

=== VARIÁVEIS — preencha antes de usar ===
[PLANO_ORIGEM]: ex: START / PRO ← plano atual do aluno
[PLANO_DESTINO]: ex: ELITE / PREMIUM ← plano de destino
[DIFERENCA]: ex: R$ 4.125 A MAIS NO MESMO DIA ← diferença de resultado entre planos
[CTA]: ex: FAZ O UPGRADE AGORA / GARANTE O ELITE ← chamada para ação
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Generate a premium Brazilian trading PLAN UPGRADE comparison banner — no human — pure graphic.

Two column visual layout — visual contrast between the two plans:
LEFT side — [PLANO_ORIGEM] plan — muted darker atmosphere — small coin stack —
flat or declining energy — constrained and limited feeling.
RIGHT side — [PLANO_DESTINO] plan — vibrant gold and green glowing —
large overflowing coin stack — green upward arrow — crown element above — explosive abundance.

Center divider:
Bold vertical gold dividing line — VS element or arrow pointing right toward upgrade.
The difference amount displayed prominently at the center — most dominant element.

Background elements:
Deep black — left side muted grey — right side gold and green explosion.
Gold particle shower on right side only — wealth flowing on the [PLANO_DESTINO] side.
Green candlestick rising sharply on right — flat line on left.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [PLANO_ORIGEM] — bold white font upper left — lower plan label — contained energy
Item 2: [PLANO_DESTINO] — bold gold 3D with crown upper right — upgrade plan label — premium
Item 3: [DIFERENCA] — massive bold gold 3D centered — the punchline — largest element of all
Item 4: [CTA] — bold neon green font with gold border — closing CTA

DO NOT add any other text. DO NOT add subtitles, scores or signatures.
DO NOT add any human portrait or PEPE character.
The [DIFERENCA] must be the single most eye-catching element in the entire image.
Final output: Two column upgrade banner — [DIFERENCA] as punchline dominant — [PLANO_DESTINO].

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['dinamica','upgrade','comparativo']::text[]);
insert into prompts (category_id, title, content, tags) values ('b1ae3199-5e73-42b8-875d-bfcb71e656cf', '7.1 Card Comparativo — Norte vs Concorrente', 'Uso: Comparar preço do produto no concorrente vs preço na Norte Importações.

=== VARIÁVEIS — preencha antes de usar ===
[NOME_PRODUTO]: ex: iPhone 17 Pro Max / MacBook Air M3 ← nome do produto
[PRECO_CONCORRENTE]: ex: R$10.999 ← preço no concorrente
[PRECO_NORTE]: ex: R$7.450 ← preço na Norte Importações
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Generate a clean professional price comparison card in the exact same style as the reference image.

There are TWO logo reference images attached:
Logo Image 1 is the COMPETITOR logo — place it above the LEFT price column — centered.
Logo Image 2 is the NORTE IMPORTAÇÕES logo — place it above the RIGHT price column.
Use each logo exactly as provided — do NOT recreate or redraw them.

Layout and format:
Vertical portrait format — same proportions as the reference image.
Light grey or off-white clean background — subtle and minimal.
No dark backgrounds — bright clean and airy throughout.
No header tagline at the top — start directly with the product name.

Product name — headline:
[NOME_PRODUTO] in very large bold heavy condensed sans-serif font — dark navy almost black —
all caps — centered — same proportional size as reference — NOT excessively large.

Product images — center section:
Two identical product images side by side — centered horizontally — equal size.
Both images clean with no background — floating naturally.
Use the provided product image for both sides.

Price comparison — bottom half — two columns:
LEFT column: competitor logo above — one large bold RED price: [PRECO_CONCORRENTE] — no border box.
RIGHT column: Norte logo above — one large bold GREEN price: [PRECO_NORTE] — no border box.
Typography: bold heavy sans-serif throughout — NOT serif — NOT italic.
Red price signals market cost — green price signals the better deal.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: [NOME_PRODUTO] — very large bold condensed dark navy — centered top
Item 2: [PRECO_CONCORRENTE] — large bold red — left column — no border
Item 3: [PRECO_NORTE] — large bold green — right column — no border

DO NOT add any other text. DO NOT add strikethrough prices. DO NOT add border boxes.
DO NOT add any header tagline. DO NOT use serif or italic fonts.
Final output: Clean price comparison card — [NOME_PRODUTO] — [PRECO_CONCORRENTE] red left —
[PRECO_NORTE] green right — competitor logo left — Norte logo right — light background.

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['card','comparativo','preco']::text[]);
insert into prompts (category_id, title, content, tags) values ('b1ae3199-5e73-42b8-875d-bfcb71e656cf', '7.2 Comparativo Elite vs Start', 'Uso: Mostrar diferença de resultado entre planos na mesma sessão.

=== VARIÁVEIS — preencha antes de usar ===
[RESULTADO_START]: ex: R$ 1.250 ← resultado do plano START
[RESULTADO_ELITE]: ex: R$ 5.375 ← resultado do plano ELITE
[DIFERENCA]: ex: R$ 4.125 A MAIS NO MESMO DIA ← diferença entre os planos
===================

■ PROMPT COMPLETO
This is a graphic design banner generation task. Do NOT render any prompt text inside the image.
The image must contain ONLY the TEXT ELEMENTS listed below. Nothing else.

Generate a premium Brazilian trading plan results comparison banner — no human — pure graphic.

Two column visual layout — clear emotional and visual contrast between both sides:
LEFT side — START plan:
Muted darker atmosphere — slightly desaturated — feels constrained and limited.
A single modest stack of coins or bills — small and contained.
Subtle flat or contained energy — not losing but clearly not at full potential.

RIGHT side — ELITE plan:
Vibrant gold and green glowing atmosphere — abundant and explosive.
Large overflowing stack of gold coins and dollar bills — significantly bigger than START side.
Strong upward green arrow — rising sharply — winning energy at full power.
Crown or star element above — ELITE status symbol.

Center divider:
Bold vertical gold dividing line or VS element separating the two sides.
The difference amount displayed prominently at the center — gold — impossible to miss.
Arrow pointing from START toward ELITE — direction everyone should go.

Background elements:
Deep black atmospheric background.
Left side: dark muted grey — contained energy.
Right side: dark black with gold and green glow — explosive energy.
Green candlestick chart visible on right side background — rising.
Flat or declining line on left side background — contrast.
Gold particle shower on right side only.

TEXT ELEMENTS — render ONLY these items, nothing else:
Item 1: START — bold white font upper left — plan label
Item 2: [RESULTADO_START] — large bold white or muted grey font — left column result
Item 3: ELITE — bold gold font with crown upper right — plan label
Item 4: [RESULTADO_ELITE] — very large bold neon green font — right column result — much larger
Item 5: [DIFERENCA] — massive bold gold 3D font centered — THE dominant punchline of the image

DO NOT add any other text. DO NOT add subtitles, scores or signatures.
DO NOT add any human portrait or PEPE character.
The [RESULTADO_ELITE] must be visually much larger than [RESULTADO_START].
The [DIFERENCA] must be the single most eye-catching element in the entire image.
Final output: Two column plan comparison — [DIFERENCA] as absolute dominant punchline.

■ RESTRIÇÕES FIXAS
• Do NOT render, display or print any part of this prompt text inside the generated image.
• The image must contain ONLY the visual and text elements in the TEXT ELEMENTS section.
• Do NOT blend faces. Do NOT add glasses or any eyewear.
• Do NOT copy the original person identity from any style reference.
• Do NOT add any URLs, links or WhatsApp numbers inside the image.', ARRAY['card','comparativo','planos']::text[]);
