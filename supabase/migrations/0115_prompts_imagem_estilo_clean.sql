-- Estilo CLEAN pros 180 prompts de imagem por mensagem.
--
-- Até aqui cada um dos 180 templates (um por mensagem de cada dinâmica) tinha
-- uma "Scene concept" escrita à mão — fogo, sniper, foguete, maratona — bem
-- diferente uma da outra. O CLEAN é o oposto disso de propósito: uma
-- identidade visual ÚNICA (paleta oficial ProfitX, cofre/ampulheta/candles,
-- sóbria) que se repete igual em toda mensagem. O alívio visual pedido é
-- exatamente essa consistência — por isso as 180 linhas novas usam o MESMO
-- corpo, e só os 4 itens de texto (preenchidos na hora de gerar) variam,
-- como já acontecia com o Apelativo.
--
-- O Apelativo não é apagado: continua disponível pra quando alguém quiser
-- aquele visual mais agressivo de propósito. Mas a partir de agora ele nunca
-- é a seleção inicial — isso é código (image-generation-panel.tsx), não SQL:
-- o painel passa a preferir o template com style='clean' ao decidir qual
-- vem pré-selecionado pra cada mensagem.

alter table image_prompt_templates
  add column if not exists style text not null default 'apelativo'
  check (style in ('clean', 'apelativo'));

-- ── 1. Clona os 180 no estilo CLEAN ──────────────────────────────────────
-- Mesmo product_id/dynamic_id/msg_key/name/position do original — o que
-- muda é só o corpo e o style. Preserva o nome original (sem sufixo): Clean
-- fica com o nome "limpo", é o Apelativo que ganha a etiqueta abaixo.
insert into image_prompt_templates (product_id, dynamic_id, msg_key, name, body, style, position, created_by)
select
  product_id,
  dynamic_id,
  msg_key,
  name,
  $clean$=== VARIÁVEIS ===
ITEM 1: [ITEM 1]
ITEM 2: [ITEM 2]
ITEM 3: [ITEM 3]
ITEM 4: [ITEM 4]
================

Você está criando uma arte para a ProfitX, escola de trading.
A estética deve seguir a identidade visual oficial da marca:
visual técnico, sóbrio, premium, escuro, limpo e profissional.
A arte deve transmitir energia, urgência e força visual, mas sem exagero,
sem poluição e sem aparência de anúncio apelativo.

IMPORTANTE:
- Não renderize nenhum texto deste prompt dentro da imagem.
- A imagem deve conter APENAS os TEXT ELEMENTS definidos abaixo.
- Não adicionar subtítulos, slogans, assinaturas, URLs, links ou textos extras.

FORMATO
- Banner horizontal 16:9
- Qualidade premium
- Alta definição
- Export visual clean, moderno e publicitário

PALETA DE CORES
Use rigorosamente esta direção visual:
- Fundo principal: #05090C, quase preto levemente azulado
- Verde primário de destaque: #06B70D
- Dourado contido: #E8C77A
- Branco principal dos textos: #F2F7F4
- Texto secundário: #9FB2AE
- Bordas e detalhes sutis: #17262B

A cor verde deve ser o único acento forte.
O dourado deve aparecer apenas como detalhe de categoria, brilho ou elemento de apoio.
Evitar vermelho gritante, laranja exagerado, gradientes neon ou paleta carnavalesca.

DIREÇÃO DE ESTILO
- Visual minimalista, denso e sofisticado
- Clima de terminal financeiro / sala de operação / performance
- Alto contraste
- Luz dramática lateral
- Atmosfera premium
- Sensação de intensidade e movimento controlado
- Nada cartunesco
- Nada exageradamente vendedor
- Nada com cara de flyer barato
- Nada com estética de aposta, cassino ou ostentação

COMPOSIÇÃO
- Layout horizontal com leitura clara
- Lado esquerdo reservado para a tipografia
- Lado direito ou fundo com a cena principal
- A cena deve ter profundidade e impacto, mas sem competir com o texto
- O texto deve respirar, com boa hierarquia e espaçamento
- Não sobrecarregar com elementos demais
- Manter áreas limpas e organizadas
- Evitar excesso de brilho atrás dos textos
- Usar áreas de sombra para melhorar legibilidade

ESTRUTURA VISUAL
Criar uma composição com:
- fundo escuro técnico
- iluminação dramática em verde e dourado suave
- ampulheta com brilho sutil, sugerindo escassez de tempo
- gráfico de candles ao fundo, desfocado ou estilizado, sem legibilidade literal
- energia visual representada por glow discreto, partículas finas, reflexos, feixes de luz ou calor controlado
- elementos de intensidade visual podem existir, mas de forma refinada e integrada

ELEMENTO PRINCIPAL DA CENA
Substituir a linguagem visual agressiva de fogo e caos por uma energia mais refinada.
A cena deve ter um elemento premium e visualmente organizado.

Direção recomendada:
- cofre ou baú metálico premium parcialmente aberto com luz interna dourada controlada
- ampulheta discreta ao fundo
- candles verdes desfocados em segundo plano
- superfícies metálicas escuras, reflexos e atmosfera de sala de operação

A cena deve sugerir:
- avanço
- oportunidade
- urgência
- momentum
- escala

Sem cair em exagero visual.

TIPOGRAFIA
Seguir esta lógica:
- Título principal: forte, grande, limpo, premium
- Subtítulo/segunda chamada: contraste visual, mas sem excessos
- Caixa/CTA secundário: destaque sólido e legível
- Última chamada: CTA sério, institucional e sofisticado

Estilo tipográfico desejado:
- títulos com aparência sólida, limpa, forte, inspirada em Archivo ExtraBold
- textos de apoio com visual moderno, técnico, inspirado em Geist
- se houver rótulos, usar estilo mono / terminal
- usar 3D apenas de forma contida, premium e elegante
- sem bevel exagerado
- sem glow excessivo
- sem textura kitsch
- sem fontes brush, pincel, rabiscadas ou explosivas

TEXT ELEMENTS — renderizar APENAS estes textos:
Item 1: [ITEM 1]
Item 2: [ITEM 2]
Item 3: [ITEM 3]
Item 4: [ITEM 4]

HIERARQUIA DOS TEXTOS

ITEM 1:
- Maior texto da parte superior
- Fonte bold, limpa, sólida, premium
- Branco #F2F7F4 ou branco metálico discreto
- Sombra sutil
- Sem textura exagerada
- Sem fogo
- Sem distorção agressiva

ITEM 2:
- Texto dominante da arte
- Muito grande, forte e legível
- Verde #06B70D
- Fonte bold, geométrica e limpa
- Glow muito sutil
- Sem neon exagerado
- Sem aparência de cassino

ITEM 3:
- Texto dentro de um bloco técnico secundário
- Fundo escuro sólido, preferencialmente #0A1114
- Borda fina #17262B
- Pode ter filete verde discreto
- Texto branco #F2F7F4
- Visual de alerta técnico, não promoção agressiva
- Menos destaque que o CTA principal

ITEM 4:
- CTA principal da arte
- Deve ter mais atenção visual que o ITEM 3
- Fonte sans-serif bold, caixa alta
- Aparência inspirada em Archivo ExtraBold ou Geist Bold
- Sem brush
- Sem pincel
- Sem rabisco
- Sem lettering manual
- Sem textura de tinta
- Sem rasgos
- Sem respingos
- Sem chamas
- Sem inclinação agressiva

OBS OBRIGATÓRIA:
- O botão do ITEM 4 deve SEMPRE ter FUNDO PREENCHIDO
- Nunca deixar o ITEM 4 apenas com contorno/borda
- Nunca usar apenas outline com fundo preto igual ao ITEM 3
- O CTA precisa parecer realmente um botão principal

ESTILO DO BOTÃO DO ITEM 4:
- Barra ou botão retangular com fundo preenchido
- Pode usar fundo verde #06B70D com texto escuro
OU fundo dourado contido #E8C77A com texto escuro
OU fundo branco #F2F7F4 com texto escuro
- Também pode usar fundo verde escuro preenchido com contraste forte
- Borda fina sutil #17262B
- Leve brilho ou sombra para destacar do fundo
- Padding generoso
- Visual premium, institucional e clicável
- Pode ter pequeno detalhe complementar, como seta, ponto ou filete
- Deve se destacar claramente como CTA principal

REGRAS DOS TEXTOS
- Não adicionar nenhuma palavra além de ITEM 1, ITEM 2, ITEM 3 e ITEM 4
- Não criar selos, slogans ou chamadas extras
- Não adicionar assinatura
- Não adicionar arroba
- Não adicionar números, preços ou percentuais extras
- Não adicionar textos de fundo

EFEITOS VISUAIS PERMITIDOS
- glow discreto
- reflexos sutis
- brilho volumétrico
- partículas finas
- sombras fortes
- luz direcional
- profundidade cinematográfica
- linhas de energia discretas
- sensação de movimento

EFEITOS VISUAIS PROIBIDOS
- excesso de fogo
- explosões exageradas
- neon gritante
- poluição visual
- muitos elementos disputando atenção
- bordas vermelhas agressivas
- brush lettering caótico
- ícones decorativos aleatórios
- dinheiro voando
- cifrões
- carros de luxo
- ostentação
- personagens
- pessoas
- rostos
- qualquer identidade pessoal

COMPLIANCE VISUAL
- ProfitX é escola de trading
- Não parecer corretora
- Não parecer casa de aposta
- Não parecer cassino
- Não sugerir promessa garantida
- Não usar ostentação
- Não usar pessoas exibindo resultado
- Não usar print de lucro ou percentual

RESULTADO FINAL ESPERADO
Um banner horizontal 16:9 com estética ProfitX:
clean, escuro, técnico, sofisticado e impactante.
A arte deve parecer profissional e premium, mantendo energia visual,
sensação de urgência e performance, mas com organização,
respiro e hierarquia refinada.

O resultado deve parecer uma campanha de uma marca financeira séria,
não um criativo agressivo de internet.$clean$,
  'clean',
  position,
  created_by
from image_prompt_templates
where dynamic_id is not null
  and style = 'apelativo';

-- ── 2. Etiqueta e empurra as 180 antigas ─────────────────────────────────
-- Ganham "(Apelativo)" no nome — fica explícito no dropdown que aquele é o
-- estilo alternativo — e position + 100000, pra sempre aparecerem DEPOIS da
-- versão Clean na lista (a inserção acima já rodou, então este filtro por
-- style='apelativo' pega só as 180 originais, não as clonadas).
update image_prompt_templates
set name = name || ' (Apelativo)',
    position = position + 100000
where dynamic_id is not null
  and style = 'apelativo';
