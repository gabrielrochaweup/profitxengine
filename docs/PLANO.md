# PROFITX Engine — Plano de Fases

Este documento é a fonte de verdade do roadmap. A especificação completa original
(design system, schema, stack) está registrada no histórico do projeto; aqui
mantemos o estado do plano e decisões que afetam fases futuras.

## Requisitos de integração entre módulos (adicionado em 2026-07-16)

O projeto é focado em **conteúdo com foco em criptomoedas**. Dois requisitos
cruzam vários módulos e precisam ser lembrados nas fases correspondentes:

1. **Prompts reutilizáveis entre módulos.** Um prompt salvo na Biblioteca
   (ex: categoria "imagem", título "PROMPT 1 IMAGEM") precisa poder ser
   selecionado a partir de um menu/seletor dentro do Simulador de Conversas,
   do Calendário de Engajamento e dos E-mails — não só copiado manualmente.
   Implementação: componente `PromptPicker` (Fase 2), reutilizado por Conversas
   (Fase 3), Calendário (Fase 4) e E-mails (Fase 5). Cada uso incrementa
   `prompts.usage_count`.

2. **Atalhos de notícia/calendário econômico dentro do dia do calendário.**
   Dentro de cada dia do Calendário de Engajamento (e no Calendário de Eventos
   de E-mails), precisamos de um atalho "Criar conteúdo a partir desta notícia"
   que puxe notícias/eventos econômicos do dia — com foco em tudo que impacta
   criptomoedas (decisões de juros, CPI, ETFs, regulação, eventos on-chain,
   halving, etc.) — e pré-preencha o gerador de texto/imagem com esse gancho.
   Implementação: integração com API de notícias financeiras/calendário
   econômico (Fase 4 e Fase 5). Provedor específico a definir (candidatos:
   NewsAPI, CryptoPanic, CoinGecko/CoinMarketCap para eventos cripto,
   Trading Economics ou Investing.com para calendário macro) — decidir na
   hora de implementar a Fase 4, considerando custo e limites de free tier.

## Adendo — Mensagens de Grupo (dinâmicas) + Direct dos Alunos (adicionado em 2026-07-16, detalhado em 2026-07-16)

O usuário anexou 6 arquivos HTML reais em uso (`Método TRIAD/DOCUMENTOS DINAMICAS/`):
`batalha`, `bônus`, `kamikaze`, `maratona`, `mentoria`, `premium`. Análise completa:

**O que são**: não é geração por IA — é um sistema de **calculadora + templates
pré-escritos** para uma sequência completa de 24 a 41 mensagens de WhatsApp ao
longo do dia (08h–22h, cada uma com horário/papel fixo: abertura, pré-sessão,
ao vivo, upgrade, depoimento, urgência, encerramento...). Os 6 arquivos
compartilham a **mesma engine de cálculo** (mesmas funções JS, mesmos painéis de
config/resultados/vagas) — só mudam o tema de vendas ("dinâmica do dia") e os
textos das mensagens. Maratona é a mais distinta: 41 msgs em 2 dias (sáb+dom),
mecânica de escala progressiva de leverage + TOP 5 cumulativo.

**Lógica de cálculo confirmada** (a portar para `/lib/dynamics/`):
- % acerto = wins / (wins+loss), por produto (Pepe/Live/Copy) × janela (Dia/Semana/Mês/Total)
- Lucro Pepe = wins×entrada×payout − loss×entrada×3 (Martingale Gale 1)
- Lucro Live = wins×entrada×payout − loss×entrada (sem gale)
- Rendimento Copy = banca × rendimento%
- "Melhor cenário": escolhe a janela com maior score ponderado (Semana×1.05 >
  Mês×1.03 > Total×1.02 > Dia×1.00), badge 🏆 automático
- Vagas por faixa (Turbo/Suprema/Lendária/Galáctica) decaem ao longo do dia
  (curva linear/agressiva/suave) simulando escassez
- Guard de segurança: se o lucro calculado der negativo E a mensagem menciona
  lucro, o card fica bloqueado (visual vermelho pulsante) e o botão de copiar
  é desabilitado — nunca deixa enviar uma mensagem prometendo lucro que na
  real seria prejuízo
- Bancos de textos rotativos (headers/CTAs/urgência/depoimentos) por `rotate(bank, msg_num)`
  evitam repetição de copy dia a dia
- Depoimento: nome/valor/situação sorteados em bancos paralelos pelo mesmo
  índice (consistência matemática), com override manual

**Decisões confirmadas com o usuário (2026-07-16)**:
1. O modo "Dinâmica do dia" (calculadora/templates) é **adicional** ao modo
   de geração livre por IA já construído na Fase 4 — os dois convivem na
   sub-aba "Grupo".
2. Números de performance de trading (Pepe/Live/Copy wins/loss por janela +
   config global) ficam **salvos no banco**, editáveis numa tela central, e
   compartilhados entre Grupo e Direct — não redigitados por dia.
3. As 6 dinâmicas (e futuras) são **editáveis pela equipe dentro do app**:
   metadados, regras, config de vagas, bancos rotativos e os templates de
   cada slot de mensagem — não fixas no código. Precisa de uma tela de
   CRUD de Dinâmicas.

**Arquitetura de dados**:
- `trading_performance_stats` (product, window, wins, losses, rendimento_pct) —
  fonte central dos números reais.
- `trading_config` (singleton: cotação, payouts, banca copy, entradas) — config global.
- `message_dynamics` (slug, nome, ícone, subtitle, regras[], vagas_config jsonb,
  rotating_banks jsonb, extra_vars jsonb, top5_config jsonb) — a dinâmica em si, editável.
- `message_dynamic_slots` (dynamic_id, position, msg_key, time_label, role_label,
  cta_tags, template, media_suggestion, expert_hint, has_fonte_selector) — os slots de mensagem.
- `daily_dynamic_selection` (scheduled_date, dynamic_id, fonte_overrides jsonb) —
  qual dinâmica rodou em cada dia do calendário + overrides manuais de fonte por slot.
- `direct_messages` (schema conforme adendo original) — mensagens individuais aos alunos.
- Seed: os 6 dynamics + seus slots + bancos são extraídos programaticamente dos
  HTMLs anexados (script Node local) e inseridos via `service_role`, sem precisar
  a equipe redigitar nada — "evoluir o que já existe", não recriar do zero.

**Contexto de performance (Dia/Semana/Mês/Geral) para a geração por IA** (item 4
do adendo original) continua valendo — é uma métrica **diferente** da performance
de trading acima: taxa de aprovação (`result` = funcionou/não_funcionou) das
mensagens já enviadas, usada para influenciar a IA em Direct (e opcionalmente
no modo IA livre de Grupo). `generateText()` ganha o parâmetro `performanceContext`.

Isso é a **Fase 4.5**, entre Fase 4 e Fase 5.

## Adendo 2 — Reorganização das abas do Calendário (2026-07-17)

Depois de usar a Fase 4.5, o usuário pediu pra reestruturar a navegação:
**Calendário de Engajamento** passa a ter 3 abas irmãs por rota própria (sem
sub-abas aninhadas Grupo→IA/Dinâmica como antes):

1. **`/calendario`** — hub puro. Só grid mensal; clicar num dia abre um painel
   inline (não modal) com notícias cripto do momento + status do dia (dinâmica
   ativa? quantas mensagens X1/Grupo livre) + 3 botões de redirect com a data
   na query string: Dinâmica do Dia, Gerar livre com IA, Mensagem X1. Não tem
   mais nenhum formulário de criação nessa página.
2. **`/calendario/dinamicas-do-dia`** — página própria com seletor de data
   (`DateNav`, própria, não depende do hub) + toggle "Usar dinâmica"/"Gerar
   livre com IA":
   - Modo dinâmica: **tabela compacta** (uma linha por horário, colapsada por
     padrão — bem menos vertical que o card list anterior) com gerador de
     variação por IA por linha (atalhos "Mais curta"/"Mais longa"/"Trocar
     CTA" + prompt livre). A variação fica em preview até confirmar "Usar esta
     versão", que grava como override daquele horário/dia específico (não
     altera o template da dinâmica) — novo campo `text_overrides` jsonb em
     `daily_dynamic_selection`.
   - Modo livre: o gerador por IA sem template base (o que era a Fase 4).
   - Sub-abas internas: "Hoje" | "Analytics" (funcionou/não funcionou) e um
     link pra "Gerenciar dinâmicas" (o CRUD de templates, que continua em
     `/calendario/dinamicas`, inalterado).
3. **`/calendario/x1`** — página própria (antes era um modal "Direct
   (Alunos)"), com seletor de data próprio + sub-abas "Hoje"/"Histórico".

Bug corrigido nessa reorganização: `CalendarGrid` renderizava o número `0`
literal no dia quando os contadores de Grupo/Direct eram ambos zero, por causa
de `{(count) && (<div>...)}` em vez de checar `> 0` explicitamente (clássico
"falsy zero" do React/JS).

## Fases

- **Fase 1 — Fundação** ✅ concluída
  Next.js 14 + Tailwind + Supabase, autenticação, layout base (sidebar,
  topbar, design system).

- **Fase 2 — Biblioteca de Prompts + Configurações de IA** ✅ concluída
  - CRUD completo de prompts (categorias: conversa, mensagem, imagem, email).
  - Componente `PromptPicker` reutilizável (base do requisito 1 acima).
  - Tela de Configurações: chaves OpenAI/Anthropic criptografadas, teste de
    conexão, seleção de provedor por tipo de tarefa.
  - Camada de abstração `/lib/ai/` (`generateText`, `generateImage`) com rotas
    server-side `/api/ai/*`, nunca expondo chaves ao client.

- **Fase 3 — Simulador de Conversas** ✅ concluída
  Editor de mensagens, preview fiel WhatsApp/Instagram, geração via IA
  **usando o `PromptPicker` da Fase 2**, exportação de imagem.

- **Fase 4 — Calendário de Engajamento** ✅ concluída
  View de calendário, modal de geração texto+imagem (com `PromptPicker`),
  campo de resultado/nota, analytics básico, **atalho de notícia/evento
  econômico cripto por dia (requisito 2 acima) — implementado via RSS
  público (CoinDesk, Cointelegraph, Decrypt), sem custo/chave. Não cobre
  calendário macro agendado (juros, CPI) com hora exata; se precisar disso
  no futuro, avaliar Trading Economics ou Alpha Vantage.**

- **Fase 4.5 — Dinâmicas de Grupo + Direct dos Alunos** ✅ concluída
  Ver "Adendo" acima (detalhado após análise dos 6 HTMLs anexados). Schema de
  dinâmicas/slots/performance de trading, engine de cálculo portada, seed dos
  6 dynamics reais (166 slots ao todo), tela de CRUD de Dinâmicas, tela de
  Performance de Trading, modo "Dinâmica do dia" na sub-aba Grupo, sub-aba
  Direct (Alunos), contexto de performance de aprovação (Dia/Semana/Mês/Geral)
  injetado no `generateText()`. Validado no navegador: os cálculos batem
  exatamente com os HTMLs originais (ex: Pepe semana 147×20 → 88% acerto →
  R$ 2.521 de lucro; TOP 5 da Maratona com fator progressivo correto).
  Limitação conhecida: o mecanismo de escala progressiva + TOP 5 cumulativo da
  Maratona foi pré-calculado na semeadura (valores base $600/$500/$400/$300/$200),
  não é recalculado dinamicamente pela UI — para ajustar, precisa reseedar.

- **Fase 5 — E-mails**
  Calendário de eventos, sugestão de notícias (mesma integração de notícias
  da Fase 4, foco cripto), geração e preview de e-mail com `PromptPicker`.

- **Fase 6 — Admin**
  Gestão de usuários/papéis, status de conexões, log de uso.

- **Fase 7 — Polimento**
  Responsividade, estados vazios, loading states, tratamento de erro,
  revisão final do design system.
