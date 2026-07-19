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

> **Nota (2026-07-17):** as rotas `/calendario/dinamicas-do-dia` e
> `/calendario/x1` descritas acima foram promovidas a itens de menu próprios
> (`/dinamicas-do-dia` e `/mensagens-x1`) no Adendo 3, abaixo — o Calendário
> voltou a ser só o grid mensal + popup do dia, sem nenhuma aba interna.

## Adendo 3 — Correções de layout/estrutura, 4ª rodada de ajustes (2026-07-17)

Quatro ajustes pedidos após validar a Fase 4.5 e a reorganização do Adendo 2:

1. **Auditoria de design system** — checagem de todas as telas (Dashboard,
   Biblioteca de Prompts, Calendário, Simulador, E-mails, Configurações,
   Admin) contra o spec de padding/radius. Único desvio real encontrado:
   `Button` usava `rounded-button` (pill) para as variantes secondary/ghost/
   danger em vez de `rounded-input` (10-12px) — corrigido em
   [button.tsx](../src/components/ui/button.tsx). O resto (padding do main
   24px/32px, cards 20px, sidebar ativo 12px+bg-card-hover, inputs 12px) já
   estava correto.

2. **Dinâmicas do Dia e Mensagens X1 viraram itens próprios do menu lateral**
   (antes eram sub-abas de `/calendario`). Ordem final do menu: Dashboard,
   Simulador de Conversas, Calendário de Engajamento, Dinâmicas do Dia,
   Mensagens X1, E-mails, Biblioteca de Prompts, Configurações, Admin. Rotas
   movidas: `calendario/dinamicas-do-dia` → `/dinamicas-do-dia`,
   `calendario/x1` → `/mensagens-x1`, `calendario/dinamicas` (CRUD) →
   `/dinamicas-do-dia/gerenciar`. O Calendário voltou a ser hub puro: grid +
   popup do dia (`DayInfoPanel`) com 3 botões que **navegam** via query string
   `?data=YYYY-MM-DD` (não mais `?date=`) para as novas rotas.

3. **Terceira plataforma no Simulador de Conversas: CRM/Atendimento.** Novo
   componente [crm-chat.tsx](../src/app/(app)/conversas/components/crm-chat.tsx)
   com visual de inbox de suporte (header com breadcrumb "Bate-papos" +
   ícone do bot/canal + nome da instância/contato + X; barra secundária com
   responsável e status "resolvido"/"aberto"; corpo com mensagens do
   agente/IA à esquerda com avatar e do contato à direita, timestamp no
   formato "16 jul, 10:06"; rodapé com abas Mensagem/Observação e barra de
   ícones). Reaproveita a mesma engine de geração por IA e o mesmo botão de
   exportação de imagem das outras duas plataformas — é só uma "casca"
   visual nova. Requer a migration `0007_crm_platform.sql` (adiciona `'crm'`
   ao check constraint de `platform` em `fake_conversations` + colunas
   `crm_instance_name`, `crm_assignee_name`, `crm_assignee_avatar_url`,
   `crm_status`).

4. **Layout em duas colunas em Dinâmicas do Dia.** Cada linha expandida de
   horário (`message-row.tsx`) agora mostra a mensagem original (esquerda) e
   o gerador de variação por IA (direita) lado a lado, em vez de empilhados
   com scroll longo pra relacionar as duas.

## Adendo 4 — Casca inspirada no Magnific + calendário em popup + dinâmicas por período (2026-07-17)

Três ajustes depois de comparar o app com a referência visual do Magnific:

1. **Shell da aplicação vira dois painéis flutuantes.** Sidebar e conteúdo
   principal agora são cards independentes (`rounded-panel`, 24px) com 12px
   de respiro da borda da viewport e entre si (`(app)/layout.tsx`), sobre o
   fundo `--bg-app`. O **Topbar foi removido** (o campo de busca não tinha
   uso real no app) e seu conteúdo (avatar, nome, e-mail, badge de role,
   links de Configurações/Admin, Sair) migrou para um rodapé fixo dentro da
   `Sidebar`, junto com um atalho direto pra Configurações e o novo toggle
   de tema. Também foi adicionado um **tema claro** completo — variáveis CSS
   dobradas em `[data-theme="light"]` (globals.css), toggle em
   `theme-toggle.tsx` que persiste em `localStorage` e um script inline no
   `<head>` do root layout pra aplicar o tema salvo antes do primeiro paint
   (evita flash do tema errado).

2. **Calendário renomeado** de "Calendário de Engajamento" para só
   "Calendário" no menu e no título da página. O grid do mês agora ocupa a
   largura total do painel (`w-full`, antes `max-w-2xl`) e clicar num dia
   abre um **modal centralizado** (`components/ui/modal.tsx`, que já tinha
   fechar por clique fora + X) em vez do painel inline que empurrava o
   conteúdo pra baixo. As notícias cripto (`crypto-feeds.ts`) agora priorizam
   memecoins: itens cujo título/descrição batem com uma lista de palavras-chave
   (pepe, doge, shib, bonk, wif, floki, pump.fun etc.) sobem pro topo da lista,
   mantendo as 3 fontes RSS existentes (CoinDesk/Cointelegraph/Decrypt) — uma
   tentativa de feed dedicado a memecoins (`coindesk.com/tag/memecoins/feed/`)
   retornou 403 e foi descartada em vez de deixar uma fonte quebrada no código.

3. **Dinâmicas do Dia: 3 colunas por período (Manhã/Tarde/Noite)** em vez de
   uma lista vertical única — bucketing pela hora extraída de `time_label`
   (`dynamic-day-table.tsx`, `periodForTimeLabel`: <12 manhã, 12–17 tarde,
   ≥18 noite). Clicar num card de horário não expande mais inline: abre um
   **modal de edição** (`message-row.tsx`) com o mesmo conteúdo de duas
   colunas (mensagem original + gerador de variação por IA) do Adendo 3.

## Adendo 5 — Reflow do Simulador, Dashboard estilo Magnific, cadastro com aprovação (2026-07-17)

1. **Simulador de Conversas: Cabeçalho em cima, Gerar com IA + Mensagens
   lado a lado embaixo** (antes era uma coluna estreita empilhada, causando
   quebra de linha desnecessária). Grid virou `[1fr_480px]` com o Cabeçalho
   full-width no topo da coluna esquerda e um grid 2 colunas abaixo pra
   Gerar com IA/Mensagens. `HeaderEditor` também virou grid 2 colunas
   internamente pra aproveitar a largura nova.

2. **Dashboard reformulada no estilo Magnific**: banner de notícia cripto
   do dia (mesma priorização de memecoins do Adendo 4) acima da saudação
   personalizada ("Bom dia/Boa tarde/Boa noite, {nome}"), seguida de uma
   grade de atalhos (ícone + label) pra cada módulo do app — Simulador,
   Calendário, Dinâmicas do Dia, Mensagens X1, E-mails, Biblioteca de
   Prompts — antes dos cards de estatística que já existiam.

3. **Cadastro público com aprovação manual (Admin)**. Antes só existia
   login; agora `/login` tem um toggle "Criar conta" que chama
   `supabase.auth.signUp()`. Novos usuários entram com `profiles.status =
   'pending'` (coluna nova, migration `0008_user_approval.sql`, default
   `'approved'` pra não travar usuários já existentes) e ficam retidos na
   página `/pendente` (`(app)/layout.tsx` redireciona quem não está
   `approved`) até um admin aprovar. O Admin (`/admin`) ganhou uma aba de
   Usuários (`components/users-manager.tsx`) que lista todo mundo via a
   RPC `admin_list_users()` (junta `profiles` com `auth.users.email`, já
   que profiles não guarda e-mail) com botões de Aprovar/Rejeitar/Revogar
   e seletor de papel — mutações via update direto em `profiles`,
   protegidas pela RLS existente (`profiles_update_self_or_admin`).

**Branding** (mesmo round): logo real do projeto (SVG fornecido, recortado
pro ícone verde já que o wordmark em branco sumiria no tema claro), cor de
destaque trocada de roxo pra `#08C20F`, fonte trocada de Inter pra Geist
(pacote `geist`) pra aproximar da identidade visual do Magnific usada como
referência de design em várias rodadas deste projeto.

## Adendo 6 — Notícias por data, geração de imagem nas dinâmicas, Biblioteca de Prompts em todo lugar, reorganização de configurações (2026-07-17)

1. **Dashboard**: saudação (Bom dia/Boa tarde/Boa noite + nome) bem maior
   (`text-5xl`), atalhos centralizados com labels maiores; tema claro deixou
   de usar branco absoluto (`--bg-card`/`--bg-sidebar` viraram `#f8f8f7`, um
   off-white quente, `--bg-app` `#eef0f2`).

2. **Notícias do Calendário passam a respeitar a data do dia clicado.**
   Antes `/api/news/crypto` sempre devolvia o mesmo cache atual pra qualquer
   dia (inclusive dias futuros, o que não fazia sentido). Agora aceita
   `?before=YYYY-MM-DD` e filtra pra só mostrar notícias publicadas até o
   fim daquele dia; `CryptoNewsItem` ganhou o campo `highPotential`
   (reaproveita o `isMemecoinRelated` do Adendo 4) e `DayNewsPreview`
   destaca esses itens com um ícone de chama + borda accent.

3. **Geração de imagem nas Dinâmicas do Dia.** O modal de cada horário
   (`message-row.tsx`) ganhou uma seção "Gerar imagem para essa mensagem" —
   prompt (pré-preenchido com a sugestão de mídia do slot quando existe),
   botão Gerar chamando `/api/ai/generate-image`, preview + link de
   download, mesmo padrão já usado em Mensagens X1.

4. **`PromptPicker` virou um popup com abas de categoria** (Conversa/
   Mensagem/Imagem/E-mail) em vez de ficar travado só na categoria do
   contexto — dá pra navegar entre categorias sem fechar o popup. Botão
   renomeado de "Usar prompt salvo" pra "Adicionar prompt" (label única em
   todo o app). Passou a ser usado também na geração de variação de texto
   e na nova geração de imagem das Dinâmicas do Dia (antes só existia em
   Conversas, Dinâmicas do Dia livre e Mensagens X1).

5. **Configurações reorganizadas: perfil vs plataforma.** Existiam 3
   caminhos redundantes pra `/configuracoes` (item do menu, ícone de
   engrenagem solto, link no dropdown do avatar). Agora: `NAV_ITEMS` da
   sidebar só tem os módulos de conteúdo (sem Configurações/Admin); o
   dropdown do avatar concentra "Configurações do Perfil" (`/perfil`, nova
   rota — nome + trocar senha, componente `ProfileSettings` movido de
   `/configuracoes`), "Configurações da Plataforma" (`/configuracoes`,
   agora só chaves de IA + performance de trading) e "Admin".

## Adendo 7 — Polimento de UX (2026-07-17)

1. **Dropdown do perfil fecha sozinho** ao clicar em qualquer link dele
   (`MenuLink` ganhou `onNavigate`, chamado antes da navegação).

2. **Sidebar recolhível.** Clicar no ícone da logo alterna entre 260px
   (expandida, com labels) e 76px (só ícones, com `title` pra tooltip
   nativo) — persiste em `localStorage`. Mesmo ícone reabre.

3. **Modal de horário das Dinâmicas do Dia**: coluna direita virou
   `flex-col` com duas metades de altura igual (`flex-1` cada, scroll
   independente) — texto em cima, imagem embaixo — dentro de uma grade
   com altura fixa (`lg:h-[64vh]`), eliminando o scroll extra que a seção
   de imagem forçava antes (ela ficava fora do grid, abaixo de tudo).

4. **Biblioteca de Prompts virou board estilo CRM**: uma coluna por
   categoria (Conversa/Mensagem/Imagem/E-mail) com contador e botão "+"
   próprio (pré-seleciona a categoria no formulário via novo prop
   `defaultCategory` do `PromptForm`), scroll independente por coluna. O
   filtro de categoria em abas foi removido — a separação agora é
   espacial.

**Limpeza**: `ProfileSettings` estava em `configuracoes/profile-settings.tsx`
mas era importado por `/perfil` — movido pra `src/components/profile-settings.tsx`
(local correto pra um componente usado por duas rotas). Revisão geral não
achou outras pontas soltas (sem refs a rotas antigas, sem imports órfãos,
sem TODOs pendentes) — `tsc`, `lint` e `build` de produção limpos.

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
  público (CoinDesk, Cointelegraph, Decrypt), sem custo/chave, complementado
  no Adendo 9 com trending real do CoinGecko. Não cobre calendário macro
  agendado (juros, CPI) com hora exata; se precisar disso no futuro, avaliar
  Trading Economics ou Alpha Vantage.**

- **Fase 4.5 — Dinâmicas de Grupo + Direct dos Alunos** ✅ concluída
  Ver "Adendo" acima (detalhado após análise dos 6 HTMLs anexados). Schema de
  dinâmicas/slots/performance de trading, engine de cálculo portada, seed dos
  6 dynamics reais (166 slots ao todo), tela de CRUD de Dinâmicas, tela de
  Performance de Trading, modo "Dinâmica do dia" na sub-aba Grupo, sub-aba
  Direct (Alunos), contexto de performance de aprovação (Dia/Semana/Mês/Geral)
  injetado no `generateText()`. Validado no navegador: os cálculos batem
  exatamente com os HTMLs originais (ex: Pepe semana 147×20 → 88% acerto →
  R$ 2.521 de lucro; TOP 5 da Maratona com fator progressivo correto).
  Limitação original (resolvida em parte no Adendo 9): a escala progressiva
  foi pré-calculada na semeadura e não recalculava dinamicamente. O ranking
  TOP 5 ($600/$500/$400/$300/$200 e variações) permanece pré-calculado por
  decisão consciente — ver Adendo 9.

- **Fase 5 — E-mails** ✅ concluída
  `/emails`: `DateNav` própria + histórico global de campanhas (clicável,
  navega entre datas). Geração por IA de assunto+preview+corpo num só clique
  (`PromptPicker` categoria "email", `system prompt` pede um formato
  `ASSUNTO:`/`PREVIEW:`/`CORPO:` que é parseado no client), com o corpo em
  HTML editável e preview renderizado ao vivo (`dangerouslySetInnerHTML` num
  card "papel branco"). Banner opcional gerado via `/api/ai/generate-image`
  e inserido no topo do corpo com um botão. `DayNewsPreview` reaproveitada
  (mesma integração de notícias da Fase 4) para inspirar o campo de
  referência de notícia (texto livre — o mesmo padrão "somente leitura +
  campo manual" já usado em Dinâmicas do Dia, não há seleção por clique em
  nenhum lugar do app). Salva/edita/exclui direto contra `email_campaigns`
  (client Supabase do browser), status rascunho/pronto/enviado.

- **Fase 6 — Admin** ✅ concluída
  Gestão de usuários/papéis (`UsersManager`, aprovação de cadastro) +
  painel "Uso de IA" novo (`UsageLogPanel`): últimos 50 registros de
  `ai_usage_log` com usuário/módulo/provedor/modelo/tokens, badges de
  contagem por provedor. Não há "status de conexões" dedicado — a validação
  de chave já existe em Configurações (botão "Testar conexão" por provedor).

- **Fase 7 — Polimento** ✅ concluída
  Toast + loading states padronizados, ~10 falhas silenciosas de escrita
  corrigidas (Adendo 10); diagnóstico e correção de lentidão de navegação —
  `loading.tsx` em 11 rotas, waterfalls paralelizados, singleton do client
  Supabase (Adendo 11); responsividade mobile — sidebar sem substituto
  abaixo de `md` virou drawer funcional, `DateNav`/Simulador de Conversas/
  Configurações/modal de Dinâmicas do Dia sem overflow em 375px (Adendos 12
  e 13); revisão do tema claro em todas as telas recentes, sem achados
  (Adendo 13).

## Adendo 8 — Google como terceiro provedor de IA + E-mails + log de uso (2026-07-17)

1. **Google/Gemini vira o terceiro provedor de IA**, ao lado de OpenAI e
   Anthropic. Módulo novo `src/lib/ai/google.ts` (SDK `@google/genai`,
   sucessor oficial do `@google/generative-ai` descontinuado) implementando
   `generateText`/`generateImage`/`validateKey`. `AiProvider` (em
   `lib/ai/types.ts` e `lib/supabase/types.ts`) ganhou `"google"`;
   `configuracoes-client.tsx` ganhou um terceiro `CredentialCard` e os
   dropdowns de modelo por módulo passaram a listar a linha completa mais
   nova de cada provedor (texto: GPT-5.6 Sol/Terra/Luna, GPT-4o(-mini);
   Claude Opus 4.8/Sonnet 5/Fable 5/Haiku 4.5; Gemini 3.1 Pro/3 Flash/3.5
   Flash/3.1 Flash-Lite — imagem: GPT Image 2/1.5/1, DALL·E 3; Nano Banana
   Pro/2/2 Lite/legado). O módulo "Geração de imagem" agora permite escolher
   entre OpenAI e Google (Anthropic não gera imagem); os módulos de texto
   (conversa/mensagem/e-mail) aceitam os 3.

2. **Modelos de imagem mais novos devolvem base64, não URL.** Tanto
   `gpt-image-*` (OpenAI) quanto todos os modelos Gemini/Nano Banana
   (Google) retornam a imagem como `base64` embutido na resposta, ao
   contrário de `dall-e-2`/`dall-e-3` que aceitam devolver uma URL hospedada.
   Criado `src/lib/ai/storage.ts` (`uploadGeneratedImage`) — decodifica o
   base64 e sobe pro bucket público novo `generated-images` no Storage,
   devolvendo uma URL permanente. Isso também corrige de quebra um bug
   latente: as URLs que a OpenAI devolvia para `dall-e-*` eram temporárias
   (expiravam), agora tudo fica persistido no nosso Storage.

3. **Migration `0009_google_provider.sql`**: amplia os CHECK constraints de
   `ai_credentials.provider`/`ai_provider_settings.provider` para aceitar
   `'google'`, e adiciona as policies RLS do bucket `generated-images`
   (select público, insert só autenticado) — o bucket em si foi criado via
   Storage API com `service_role` (mesmo padrão do bucket
   `conversation-avatars` já existente), não via SQL.

4. **Módulo de E-mails construído do zero** (Fase 5, ver acima).

5. **Painel de Uso de IA no Admin** (Fase 6, ver acima), fechando o
   requisito "log de uso" que só existia como tabela sem UI.

**Validação**: `tsc --noEmit`, `next lint` e `next build` rodaram limpos
após cada etapa (provedor Google, E-mails, log de uso). Validação visual
completa no navegador não foi possível nesta rodada por falta de sessão
autenticada disponível — recomenda-se um teste manual rápido de ponta a
ponta (gerar e salvar um e-mail, testar conexão Google em Configurações)
após rodar a migration.

## Adendo 9 — Performance de navegação, drag-and-drop, trending real e escala dinâmica da Maratona (2026-07-17)

1. **Navegação lenta entre páginas — causa raiz e correção.** `middleware.ts`,
   `(app)/layout.tsx` e cada uma das 11 rotas chamavam `supabase.auth.getUser()`
   de forma independente. Essa chamada sempre valida o JWT em rede contra o
   Supabase Auth (nunca confia só no cookie local, por design) — ou seja, cada
   navegação disparava 2-3 idas e vindas de rede só pra confirmar quem é o
   usuário, mais consultas de `profiles` repetidas (layout já buscava
   full_name/role/status, e admin/dashboard/prompts buscavam de novo). Corrigido
   com `getUser()`/`getProfile()` cacheados via `cache()` do React em
   [server.ts](../src/lib/supabase/server.ts) — layout e page da mesma navegação
   passam a compartilhar uma única chamada. Aplicado nas 11 rotas.

2. **Drag-and-drop na Biblioteca de Prompts.** Cards agora são `draggable`
   (só para quem pode editar o prompt) e as colunas de categoria viram drop
   zones (HTML5 drag nativo, sem nova dependência). Ao soltar, atualiza
   `prompts.category` no Supabase com rollback otimista se a escrita falhar.

3. **Trending real de memecoins no Calendário.** O filtro por palavra-chave em
   notícias RSS gerais (Adendo 4) só pega memecoin se um veículo generalista
   escrever sobre ela — praticamente nunca a tempo, já que memecoins se movem
   por hora. Adicionado `getTrendingCoins()` em
   [crypto-feeds.ts](../src/lib/news/crypto-feeds.ts), consumindo o endpoint
   público `/api/v3/search/trending` do CoinGecko (gratuito, sem chave, cache
   de 10 min). Exposto via `/api/news/crypto` (`trending` no payload) e exibido
   em `DayNewsPreview` como chips de moeda + variação 24h, só quando a data
   selecionada é hoje ou futura (a API não tem histórico, então mostrar isso
   pra uma data passada seria enganoso).

4. **Escala progressiva da Maratona virou dinâmica — com um limite deliberado.**
   Investigação direta nos 41 templates reais da dinâmica "Maratona" (via
   PostgREST/service_role, não só amostra) revelou duas coisas distintas
   escondidas atrás da mesma "limitação conhecida":
   - A **tabela de 8 níveis de escala progressiva** ($200→50% ... $30.000→200%,
     sem teto acima disso) e todos os **resultados em R$ mostrados como
     exemplo** (ex.: "Investe $7.500 → R$ 77.344 na conta") eram texto fixo,
     mas a fórmula real por trás batia perfeitamente com todos os exemplos:
     `pct = 50% de $200 a $999; pct = 50 + depósito×0,5% a partir de $1.000`
     (equivalente a +5% a cada $1.000, contínuo, sem degraus — confirmado
     contra 9 valores de depósito distintos, incluindo casos não-óbvios como
     $7.500→87,5%). Portada para `pctEscalaMaratona()`/`calcResultadoMaratona()`
     em [calc-engine.ts](../src/lib/dynamics/calc-engine.ts), consumida em
     [render-message.ts](../src/lib/dynamics/render-message.ts) via novas vars
     `${escalaMaratona}`, `${mLucroX}`/`${mTotalX}` (X = 500 a 20.000) —
     computadas a partir de `config.cotacao` real, não mais fixas. Os 41
     templates no banco foram atualizados via script pontual (36 dos 41
     continham algum desses padrões) trocando os números fixos pelas
     variáveis; conferido que a renderização com a cotação padrão (5,5)
     produz texto byte-a-byte idêntico ao original antes do patch.
   - O **ranking "TOP 5"** ($600/$500/$400/$300/$200), por outro lado, **varia
     de mensagem pra mensagem** (ex.: um slot mostra $700/$583/$467/$350/$233,
     mesma proporção escalada) — não é um dado desconectado por engano, é
     variação de copy aparentemente proposital (o placar "acumulado do FDS"
     crescendo ao longo do evento, sábado de manhã menor que domingo à noite).
     **Deixado como está**, por decisão explícita do usuário, pra não achatar
     essa progressão narrativa em um valor único fixo.
   Escopo revisado em duas rodadas com o usuário antes de tocar nos dados de
   produção (a primeira estimativa, baseada numa amostra de 6 slots, subestimou
   a quantidade de variações — só depois de puxar os 41 templates completos
   ficou claro que TOP 5 era criativo, não configuração quebrada).

**Validação**: `tsc --noEmit`, `next lint` e `next build` rodaram limpos após
cada etapa. Testado ao vivo no navegador: drag-and-drop entre colunas (persiste
após reload), trending real aparecendo/desaparecendo corretamente por data, e
a fórmula da Maratona reproduzindo os 9 exemplos originais exatamente.

## Adendo 10 — Fase 7 (início): sistema de toast, estados de loading e um bug real descoberto (2026-07-17)

Início da Fase 7 (Polimento), escopo escolhido pelo usuário: tratamento de
erro + estados de loading.

1. **`ToastProvider`/`useToast()` novos** em
   [toast.tsx](../src/components/ui/toast.tsx) — hand-rolled (sem dependência
   nova, consistente com o resto do kit de UI), montado no
   [layout.tsx](../src/app/layout.tsx) raiz. Toasts empilham no canto inferior
   direito, auto-somem em 5s, 3 tons (success/error/info).

2. **`LoadingState` novo** em
   [loading-state.tsx](../src/components/ui/loading-state.tsx) — spinner +
   texto, substitui os "Carregando..." soltos em 6 arquivos (páginas de
   Dinâmicas do Dia/Mensagens X1 via `Suspense fallback`, Configurações,
   Performance de Trading, tabela de dinâmicas, preview de notícias).

3. **Falhas silenciosas de verdade corrigidas** — não é só padronização
   visual. Encontrei ~10 arquivos onde `if (!error) { sucesso }` não tinha
   `else`: se a escrita no Supabase falhasse, a tela simplesmente não fazia
   nada, sem nenhum aviso ao usuário. Alguns nem checavam `error` (deletar/
   salvar slot de dinâmica, salvar performance de trading). Adicionado
   `toast.error(...)` em todos: Simulador de Conversas (+ upload de avatar),
   CRUD de Dinâmicas, editor de slots (salvar/excluir/reordenar), gerador
   livre de Dinâmicas do Dia, aprovar/rejeitar usuário no Admin, E-mails,
   Biblioteca de Prompts (excluir/duplicar/**arrastar entre colunas**),
   Mensagens X1, Performance de Trading.

4. **Bug real descoberto ao testar o toast, não introduzido por ele**: salvar
   qualquer conversa no Simulador (`/conversas`) vem falhando desde a
   implementação da 3ª plataforma (CRM/Atendimento, Adendo 3) — o payload
   sempre inclui `crm_assignee_avatar_url` e demais colunas `crm_*`, mas a
   migration `0007_crm_platform.sql` que as cria **nunca foi rodada** neste
   projeto Supabase (erro real capturado via fetch interceptado no console:
   `PGRST204 — Could not find the 'crm_assignee_avatar_url' column`). Isso
   estava silenciosamente quebrado há várias rodadas — só ficou visível agora
   porque o `else` do toast existe. **Ação pendente do usuário**: rodar
   `0007_crm_platform.sql` no SQL Editor do Supabase.

**Escopo não coberto ainda da Fase 7**: responsividade mobile e revisão fina
do design system (contraste/tema claro nas telas mais novas) seguem em aberto.

**Validação**: `tsc --noEmit`, `next lint` e `next build` limpos. Testado ao
vivo: toast de erro apareceu corretamente ao tentar salvar uma conversa
(reproduzindo o bug real acima), sem regressão nos fluxos já validados
(drag-and-drop de prompts, navegação).

## Adendo 11 — Diagnóstico e correção de lentidão na transição entre páginas (2026-07-17)

Diagnóstico estruturado (evidência coletada antes de qualquer mudança):

- **Causa principal confirmada**: zero arquivos `loading.tsx` em todo o
  projeto. Sem isso o Next.js não tem onde criar um Suspense boundary
  automático por rota — a tela anterior fica parada sem nenhum feedback até
  `layout.tsx` + `page.tsx` + todas as queries terminarem no servidor. É o
  que faz a navegação "parecer" travada mesmo quando o tempo real de busca é
  modesto.
- **Dois waterfalls reais** (não a maioria dos casos — a maior parte das
  páginas já usava `Promise.all` corretamente): `admin/page.tsx` rodava a RPC
  `admin_list_users` e a query de `ai_usage_log` em sequência quando são
  independentes; `configuracoes-client.tsx` buscava
  `/api/ai/provider-settings` e depois `/api/ai/credentials` também em
  sequência no client.
- **Client Supabase do browser não era singleton** —
  [client.ts](../src/lib/supabase/client.ts) chamava `createBrowserClient()`
  a cada `createClient()`, e dezenas de handlers fazem essa chamada.
- **Descartado com evidência** (não são causa): nenhum `page.tsx`/`layout.tsx`
  usa `"use client"` desnecessário; bundle JS de nenhuma rota passava de
  200kB (a maior era 189kB); a sidebar já usa `next/link` (prefetch ativo);
  não há Context API abrangente causando re-render em cascata; o matcher do
  middleware já exclui estáticos — a 1 chamada de rede que ele faz por
  navegação (`getUser()` contra o Supabase Auth) é inerente ao modelo de
  autenticação, não removível sem enfraquecer segurança.

Correções aplicadas, em ordem de prioridade:

1. `loading.tsx` em 11 rotas (`dashboard`, `conversas`, `calendario`,
   `dinamicas-do-dia` + `gerenciar` + `gerenciar/[id]`, `mensagens-x1`,
   `emails`, `prompts`, `configuracoes`, `admin`, `perfil`), todos re-
   exportando um skeleton único e compartilhado em
   [route-loading.tsx](../src/components/layout/route-loading.tsx)
   (`animate-pulse`, sem dependência nova).
2. `admin/page.tsx` e `configuracoes-client.tsx`: waterfalls convertidos pra
   `Promise.all`.
3. [client.ts](../src/lib/supabase/client.ts): `createClient()` do browser
   virou singleton de módulo (memoiza a instância).
4. `html-to-image` (só usado no botão de exportar imagem em
   [export-controls.tsx](../src/app/(app)/conversas/components/export-controls.tsx))
   trocado de import estático pra `await import(...)` dentro do handler —
   bundle de `/conversas` caiu de 181kB pra 176kB (o chunk próprio da página
   caiu de 18,5kB pra 13,6kB).

**Validação**: `tsc --noEmit`, `next lint` e `next build` limpos;
comparação de `First Load JS` antes/depois confirmou a redução em
`/conversas` e nenhuma rota passou de 200kB. Testado ao vivo: navegação
entre rotas continua funcionando sem regressão (em localhost a latência é
baixa demais pra capturar o flash do skeleton no screenshot, mas o build
confirma os 11 boundaries compilados corretamente — o efeito fica mais
visível em produção, onde a chamada real ao Supabase tem latência de rede).

## Adendo 12 — Responsividade mobile, primeira rodada (2026-07-17)

Diagnóstico visual em viewport 375px (iPhone) encontrou 4 problemas reais,
todos corrigidos e revalidados no navegador:

1. **Crítico: sem navegação nenhuma no mobile.** A sidebar
   ([sidebar.tsx](../src/components/layout/sidebar.tsx)) usava `hidden
   md:flex` sem nenhum substituto abaixo do breakpoint — ou seja, em
   qualquer tela de celular era impossível sair da página em que se estava,
   exceto pelos atalhos do Dashboard. Corrigido com uma barra superior
   mobile (logo + botão hambúrguer) e um drawer overlay com os mesmos 7
   itens de navegação + perfil/configurações/admin/sair, que fecha sozinho
   ao navegar (`useEffect` no `pathname`). `(app)/layout.tsx` virou
   `flex-col md:flex-row` pra empilhar a barra em cima do conteúdo no
   mobile, e o padding do `<main>` ficou responsivo (`px-4 py-4 sm:px-8
   sm:py-6`).
2. **`DateNav`** ([date-nav.tsx](../src/app/(app)/calendario/components/date-nav.tsx),
   compartilhado por Calendário/Dinâmicas do Dia/Mensagens X1/E-mails)
   cortava o botão "Hoje" em telas estreitas — o label por extenso da data
   ("sex., 17 de julho de 2026") não tinha `hidden sm:inline`, e os botões
   não tinham `shrink-0`, deixando o conjunto todo mais largo que 375px.
3. **Simulador de Conversas**: a barra "Minhas conversas (N)" / "Nova
   conversa" / "Salvar" não tinha `flex-wrap` no grupo interno, e o botão
   de histórico (pill totalmente arredondado) quebrava o texto em 3 linhas
   em vez de simplesmente ir pra própria linha. Adicionado `flex-wrap` +
   `whitespace-nowrap` no botão.
4. **Configurações**: a linha "Provedor | Modelo | Salvar" de cada módulo
   (`ModuleSettingRow`) usava larguras fixas (`w-40`/`w-56`) nos dois
   `<Select>`, somando 384px só ali — virou `flex-1` com `sm:w-40`/`sm:w-56`
   (larguras fixas só a partir do breakpoint `sm`), então no mobile os dois
   selects dividem o espaço disponível e encolhem (texto trunca com `...`
   nativo do `<select>`, mas nada vaza).

**Não coberto nesta rodada** (ficou pra uma próxima passada se necessário):
telas com grids de 3+ colunas mais elaboradas (ex.: tabela de Dinâmicas do
Dia com 3 períodos lado a lado, que hoje empilha via `lg:grid-cols-3` mas
não foi auditada em detalhe), e revisão fina do design system (contraste/
tema claro) — que continua como o item restante da Fase 7.

**Validação**: `tsc --noEmit`, `next lint` e `next build` limpos. Testado ao
vivo em viewport 375px: drawer mobile abre/fecha/navega corretamente,
`DateNav` sem corte em Dinâmicas do Dia, barra de ações do Simulador de
Conversas legível e sem overflow, linha de provedor/modelo em Configurações
cabendo na tela em todos os 4 módulos.

## Adendo 13 — Fase 7 (fechamento): tabela de Dinâmicas do Dia mobile + revisão do design system (2026-07-17)

1. **Modal de horário em Dinâmicas do Dia, em mobile.** A grid principal
   (`lg:grid-cols-3`) e a mensagem original dentro do modal já colapsavam
   bem; o problema real estava em dois containers `flex items-center
   justify-between` (sem `flex-wrap`) que posicionavam um label ao lado do
   botão "Adicionar prompt" do `PromptPicker` — em 375px o texto do botão
   quebrava dentro de si mesmo em vez do conjunto simplesmente ir pra linha
   de baixo. Corrigido com `flex-wrap gap-2` nos dois pontos
   ([message-row.tsx](../src/app/(app)/dinamicas-do-dia/components/message-row.tsx),
   seções "Gerar variação com IA" e "Gerar imagem para essa mensagem").

2. **Revisão do design system (contraste/tema claro)**: auditoria visual no
   tema claro em todas as telas construídas nas últimas rodadas — E-mails
   (incluindo o preview "papel branco" do corpo do e-mail), Configurações
   (3 cards de credencial + linha provedor/modelo/salvar por módulo, com o
   card do Google), Admin (painel novo de Uso de IA), o `ToastProvider`
   novo, os badges de contagem de caracteres em Dinâmicas do Dia
   (`bg-danger/20`/`bg-warning/20`, opacidade baixa que poderia perder
   contraste em fundo claro) e o board da Biblioteca de Prompts. Também
   varredura por cores hardcoded (`grep` por `bg-white`/`text-black`/
   `bg-black` etc.) fora de `globals.css` — os únicos casos encontrados são
   intencionais e corretos: os simuladores de chat (WhatsApp/Instagram/CRM
   em [conversas/components/](../src/app/(app)/conversas/components/))
   sempre devem parecer com os apps reais independente do tema do
   PROFITX Engine, e sobreposições de modal/drawer (`bg-black/60`) funcionam
   igual nos dois temas por design. **Nenhum bug de contraste ou cor
   quebrada encontrado** — o design system já estava bem construído desde
   o Adendo 3 (auditoria de padding/radius) e o Adendo 4 (introdução do
   tema claro), então esta rodada foi confirmatória, não corretiva.

**Validação**: `tsc --noEmit`, `next lint` e `next build` limpos. Testado ao
vivo: modal de Dinâmicas do Dia em 375px com os botões "Adicionar prompt"
em linha própria e legíveis; tema claro testado em E-mails, Configurações,
Admin, Simulador de Conversas (incluindo o toast de sucesso) e Biblioteca
de Prompts, sem achados.

Com isso, a **Fase 7 está concluída**: sistema de toast + loading states
(Adendo 10), performance de navegação (Adendo 11), responsividade mobile
(Adendo 12 e este), e revisão do design system (este). O app está com
todas as 7 fases do plano original completas.

## Adendo 14 — 6 correções pontuais de UX pedidas após uso real (2026-07-18)

1. **Maratona em colunas Sábado/Domingo (desktop).** A dinâmica roda em 2
   dias, mas `periodForTimeLabel` fazia `parseInt("sáb 08h")` → `NaN` →
   tudo caía em "Manhã", produzindo uma coluna só com os 41 slots
   empilhados. Como cada `time_label` já carrega o dia ("sáb 08h"/"dom
   08h"), [dynamic-day-table.tsx](../src/app/(app)/dinamicas-do-dia/components/dynamic-day-table.tsx)
   ganhou um agrupamento alternativo por dia (`DAY_GROUPS`/
   `dayGroupForTimeLabel`), ativado só quando `selectedDynamic.slug ===
   "maratona"` (`lg:grid-cols-2` em vez de `lg:grid-cols-3`). As outras 5
   dinâmicas continuam em Manhã/Tarde/Noite, sem mudança.
2. **Biblioteca de Prompts no mobile virou dropdown de categoria** em vez
   das 4 colunas empilhadas — [prompts-client.tsx](../src/app/(app)/prompts/prompts-client.tsx)
   ganhou `renderColumn()` reaproveitável entre a visão mobile (`sm:hidden`,
   1 categoria por vez com contraste reforçado — `border-border-strong
   bg-card-hover` em vez de `border-border bg-card`, que antes tinha o
   mesmo tom do fundo da página) e o board desktop original (`hidden
   sm:grid`, inalterado).
3. **Menu inferior mobile estilo Instagram**, substituindo a barra superior
   com hambúrguer. [sidebar.tsx](../src/components/layout/sidebar.tsx):
   5 ícones fixos embaixo — "Dashboard" (abre o drawer lateral existente,
   não navega) + Simulador/Dinâmicas/Mensagens X1/Prompts (navegação
   direta, com estado ativo). O resto da navegação (Calendário, E-mails,
   Perfil, Configurações, Admin) mora só no drawer.
4. **Toggle de tema reposicionado no drawer** — saiu da linha do avatar e
   foi para o rodapé, na mesma linha do "Sair", em lados opostos.
5. **Padding lateral mobile reduzido** — [(app)/layout.tsx](../src/app/(app)/layout.tsx):
   container raiz `p-3`→`p-2` e conteúdo `px-4`→`px-3` abaixo de `md`/`sm`
   (desktop inalterado); `main` ganhou `pb-24` mobile pra não ficar atrás
   do novo menu fixo embaixo.
6. **Reorganização da área de geração de IA em Dinâmicas do Dia**
   ([message-row.tsx](../src/app/(app)/dinamicas-do-dia/components/message-row.tsx)):
   o texto da mensagem original virou um campo de altura fixa com scroll
   próprio (`max-h-40 overflow-y-auto`) em vez de empurrar o resto da tela
   pra baixo; nas duas seções de geração (texto e imagem) o botão "Gerar"
   saiu de lado do campo e foi para embaixo, em largura total — mesmo
   tratamento aplicado à "Sugestão gerada" pós-geração, pelo mesmo motivo.

**Validação**: `tsc --noEmit`, `next lint` e `next build` limpos. Testado ao
vivo: Maratona mostrando Sábado/Domingo lado a lado (outras dinâmicas
intactas), modal de Dinâmicas do Dia com scroll interno e botões
reposicionados, menu inferior mobile navegando e abrindo o drawer, drawer
com tema/sair na mesma linha, dropdown de categoria na Biblioteca de
Prompts trocando de conteúdo corretamente com contraste visível.

## Adendo 15 — Sidebar só-ícones, mobile edge-to-edge, export de imagem corrigido, wizard de nova dinâmica, padding de dropdowns (2026-07-18)

Cinco correções pedidas após uma nova rodada de revisão visual (3 prints
anexados: chat CRM cortado ao exportar, dialog antigo de `window.prompt()`
pra criar dinâmica, seta de dropdown colada na borda).

1. **Sidebar desktop virou só-ícones, permanentemente.** Removida a
   funcionalidade de recolher/expandir (estado, `localStorage`, botão de
   toggle) introduzida no Adendo 7 — o usuário pediu pra já nascer compacta
   pra otimizar espaço, não alternar. [sidebar.tsx](../src/components/layout/sidebar.tsx):
   `<aside>` fixo em `w-[64px]`, padding interno reduzido pra `p-2`, ícones
   centralizados com `title` pra tooltip nativo (sem label de texto).
2. **Mobile: fundo/borda arredondada do container principal removidos,
   menu inferior continua flutuante.** [(app)/layout.tsx](../src/app/(app)/layout.tsx):
   abaixo de `md` o wrapper do conteúdo perde `bg-card`/`rounded-panel`/
   `border` (só existem a partir de `md:`), aproveitando 100% da largura da
   tela; o menu inferior (barra fixa com `inset-x-2 bottom-2`, já
   independente do fluxo normal desde o Adendo 14) não foi tocado e continua
   flutuante/arredondado.
3. **Export de imagem do Simulador de Conversas saía cortado/descentralizado.**
   Causa raiz: `html-to-image` captura mal um nó com `transform: scale()`
   dentro de um ancestral `overflow: hidden` (limitação conhecida da lib).
   [export-canvas.tsx](../src/app/(app)/conversas/components/export-canvas.tsx)
   passou a expor o nó **sem transform** (`#export-content`, tamanho
   natural) pra captura; [export-controls.tsx](../src/app/(app)/conversas/components/export-controls.tsx)
   foi reescrito pra capturar esse nó em tamanho natural via `toPng`, medir
   com `getBoundingClientRect()` e compor a imagem final manualmente num
   `<canvas>` nativo (gradiente replicado + `drawImage` com centralização
   calculada a partir do tamanho real medido, não de um valor assumido) —
   robusto contra qualquer diferença futura de tamanho (ex.: moldura de
   celular ativada). Validado interceptando o `href` (data URL) do link de
   download via monkey-patch de `HTMLAnchorElement.prototype.click`, já que
   downloads no Browser pane não ficam acessíveis por `Bash`.
4. **Wizard próprio pra criar uma nova dinâmica**, substituindo o dialog
   antigo baseado em `window.prompt()`. Novo componente
   [new-dynamic-wizard.tsx](../src/app/(app)/dinamicas-do-dia/gerenciar/components/new-dynamic-wizard.tsx)
   (popup modal com 5 etapas): nome + ícone → escolher "Duplicar uma
   existente" (copia metadados + todos os slots de uma dinâmica escolhida)
   ou "Criar do zero" → nesse caso, uma etapa por período do dia (Manhã/
   Tarde/Noite), cada uma permitindo adicionar mensagens com horário/papel/
   template e gerar o texto por IA (`/api/ai/generate-text`, módulo
   "mensagem") por mensagem, com opção de pular períodos vazios → revisão
   final com contagem de mensagens por período antes de confirmar.
   [dinamicas-client.tsx](../src/app/(app)/dinamicas-do-dia/gerenciar/dinamicas-client.tsx)
   trocou o antigo `handleCreate` pelo wizard. Validado ao vivo nos dois
   caminhos: duplicar "Alavancagem Premium" (24 slots + metadados copiados
   corretamente) e criar do zero pulando Tarde/Noite (1 mensagem só em
   Manhã, contagem da revisão batendo, dinâmica persistida e redirect pro
   editor confirmados).
5. **Setas de todos os dropdowns coladas na borda lateral.** Causa raiz em
   [select.tsx](../src/components/ui/select.tsx): o `className` recebido
   (que controla largura/`flex-1` em ~10 usos pelo app) só chegava ao
   `<select>` interno, então o ícone `ChevronDown` (posicionado em relação
   ao wrapper) não herdava nenhum respiro à direita quando o wrapper não
   tinha padding próprio. Corrigido aplicando `className` tanto no wrapper
   `<div className={cn("relative", className)}>` quanto mesclado nas
   classes do `<select>` (via `tailwind-merge`, que já resolve overrides de
   altura/tamanho de texto passados por chamador) — o ícone ganhou padding
   consistente (`pr-8` no select, `right-3` no ícone) em todos os usos sem
   quebrar nenhuma largura customizada existente.

**Teste de dados criado durante a validação**: a dinâmica duplicada
"Alavancagem Premium (cópia)" (24 slots) e a dinâmica de teste "Dinâmica
Teste Wizard" (1 slot) ficaram gravadas no banco como efeito colateral dos
testes do item 4 — a remover manualmente se não forem úteis.

**Validação**: `tsc --noEmit`, `next lint` e `next build` limpos. Testado ao
vivo: sidebar só-ícones, mobile sem fundo/borda arredondada no container
principal (menu inferior intacto), imagem exportada do CRM genuinamente
centralizada e sem corte, wizard completo nos dois caminhos (duplicar e
criar do zero), dropdowns com a seta respeitando padding em todas as telas.

## Adendo 16 — Sidebar híbrida com toggle, export sem gradiente + mensagens ancoradas embaixo, confirmação de chave salva (2026-07-18)

Três correções pedidas logo após o Adendo 15, incluindo reverter parte da
decisão de sidebar só-ícones daquele mesmo round.

1. **Sidebar desktop virou híbrida de novo, mas com toggle explícito** (em
   vez do recolhimento automático removido no Adendo 15). O usuário quis
   manter a versão só-ícones como aparência padrão, mas com a opção de
   expandir. [sidebar.tsx](../src/components/layout/sidebar.tsx) reganhou
   `collapsed`/`setCollapsed` persistido em `localStorage`, agora acionado
   por um botão dedicado (`PanelLeftOpen`/`PanelLeftClose` do lucide, abaixo
   do logo) em vez de clicar no logo como na versão antiga do Adendo 7 — o
   botão só existe no desktop (`md:flex`). Expandida, a sidebar vira `w-56`
   com labels de texto ao lado dos ícones e o nome do usuário ao lado do
   avatar; colapsada continua `w-[64px]` como no Adendo 15. O **menu inferior
   mobile** (que já era ícone-only desde o Adendo 14) tinha na verdade um
   `<span>{item.label}</span>` sobrevivente sob cada ícone — removido, com
   `aria-label`/`title` adicionados nos links pra não perder acessibilidade.
2. **Export do Simulador de Conversas simplificado**: o usuário pediu pra
   baixar só a tela completa do app, sem o fundo em degradê que existia
   desde a Fase 3 (a composição em `<canvas>` no formato "Stories" do Adendo
   15 resolveu o recorte, mas o usuário decidiu que não queria mais o poster
   com gradiente, só o mockup em si). [export-canvas.tsx](../src/app/(app)/conversas/components/export-canvas.tsx)
   e [export-controls.tsx](../src/app/(app)/conversas/components/export-controls.tsx)
   foram reescritos do zero: `ExportCanvas` agora só marca `#export-content`
   sem nenhum wrapper/gradiente/scale; `ExportControls` captura esse nó
   direto via `toPng` (pixelRatio 3, sem `format`/`platform` de destino) e
   baixa o PNG resultante sem nenhuma composição em `<canvas>` — o arquivo
   `lib/export-formats.ts` (formatos Stories/Feed/Quadrado, nunca expostos
   na UI) foi removido por não ter mais uso. Verificado via monkey-patch de
   `HTMLAnchorElement.prototype.click` (mesma técnica do Adendo 15): a
   imagem baixada tem exatamente as dimensões do frame do celular × 3
   (1185×2496 pra WhatsApp com moldura), sem gradiente, sem corte.
3. **Mensagens ancoradas embaixo do chat, como apps reais.** Nos três
   renderizadores ([whatsapp-chat.tsx](../src/app/(app)/conversas/components/whatsapp-chat.tsx),
   [instagram-chat.tsx](../src/app/(app)/conversas/components/instagram-chat.tsx),
   [crm-chat.tsx](../src/app/(app)/conversas/components/crm-chat.tsx)) o
   container de mensagens só tinha `overflow-y-auto` sem `justify-end`, então
   uma conversa com poucas mensagens ficava "flutuando" no topo da tela com
   um vazio grande embaixo, antes da barra de digitação — o oposto de como
   WhatsApp/Instagram/CRMs reais se comportam (conversa ancorada embaixo,
   perto do campo de digitar). Corrigido com `flex flex-col justify-end`
   nos três containers — a ordem cronológica das mensagens não muda, só a
   ancoragem quando o conteúdo é menor que a altura disponível.
4. **Campo de chave de API vazio mesmo já configurada.** O usuário testou a
   chave da OpenAI, confirmou "Conectada" no badge, mas o campo de senha
   ficava em branco (só o placeholder "sk-..."), passando a impressão de que
   nada tinha sido salvo. [configuracoes-client.tsx](../src/app/(app)/configuracoes/configuracoes-client.tsx):
   `CredentialCard` ganhou um estado `editing` — quando existe uma chave
   salva e não se está editando, mostra uma linha de confirmação
   ("•••••••••••••••• (chave registrada)") com um botão "Alterar" em vez do
   campo de senha vazio; "Alterar" revela o campo real + um botão "Cancelar"
   pra voltar à confirmação sem salvar nada. Ao salvar com sucesso, volta
   automaticamente pro estado de confirmação.

**Testado ao vivo com a chave OpenAI real recém-configurada** (a pedido
explícito do usuário, item que motivou a correção 4): geração de texto no
Simulador de Conversas (conversa completa com objeção de preço e fechamento,
coerente com o prompt), geração de imagem em Dinâmicas do Dia (`/api/ai/
generate-image` retornou 200 OK, imagem renderizada com botão de download),
e uso de um prompt salvo da Biblioteca (`PROMPT 1 IMAGEM`) via o popup
"Adicionar prompt" — contador de uso confirmado indo de `0x` pra `1x` após o
uso, validando a persistência de `usage_count`.

**Validação**: `tsc --noEmit`, `next lint` e `next build` limpos. Testado ao
vivo: toggle da sidebar expande/recolhe e persiste após reload, menu
inferior mobile sem labels, export do WhatsApp sem gradiente e com dimensões
exatas do frame, mensagem única ancorada junto à barra de digitação nos três
chats, card de credencial OpenAI mostrando "chave registrada" com toggle
Alterar/Cancelar funcionando, e as 3 features de IA (texto, imagem, prompt
salvo) confirmadas operacionais de ponta a ponta.

## Adendo 17 — Geração de imagem reformulada: qualidade, formato, banco de gerações e popup de reuso (2026-07-18)

Pedido pra "trabalhar melhor" a área de geração de imagem (referências
visuais do Magnific anexadas: barra de controles com qualidade/proporção/
quantidade, e o popup de galeria de variações com detalhes/ações por item).

1. **Controles de qualidade e formato reais, mapeados por provedor.**
   [types.ts](../src/lib/ai/types.ts) ganhou `ImageAspectRatio` (`1:1`,
   `3:2`, `4:3`, `9:16`, `16:9`) e `ImageQuality` (`low`/`medium`/`high`),
   substituindo o antigo `size` fixo. Mapeamento por provedor, confirmado
   direto nos `.d.ts` do SDK instalado (não por suposição):
   - **OpenAI** ([openai.ts](../src/lib/ai/openai.ts)): a API de imagens não
     tem parâmetro de proporção, só tamanhos fixos — `resolveOpenAiSize()`
     mapeia pra quadrado/retrato/paisagem (`gpt-image-*`: `1024x1024`/
     `1024x1536`/`1536x1024`; `dall-e-3`: variantes `1792x1024`/`1024x1792`).
     As 3 proporções paisagem (3:2, 4:3, 16:9) caem todas no único retângulo
     horizontal disponível — limitação real da API, sem solução melhor.
     Qualidade: `gpt-image-*` aceita `low`/`medium`/`high` direto; `dall-e-3`
     só tem `standard`/`hd`, mapeado a partir do mesmo seletor.
   - **Google** ([google.ts](../src/lib/ai/google.ts)): ao contrário da
     OpenAI, o Gemini aceita a proporção diretamente via
     `config.imageConfig.aspectRatio` (confirmado no `ImageConfig` do SDK —
     suporta exatamente as 5 proporções pedidas, sem aproximação) e
     qualidade vira resolução via `imageConfig.imageSize` (`1K`/`2K`/`4K`).
2. **`generated_images`**: tabela nova (migration
   [0010_generated_images.sql](../supabase/migrations/0010_generated_images.sql),
   **ainda não rodada** — apresentada ao usuário para rodar no SQL Editor do
   Supabase, mesmo padrão de todas as migrations anteriores deste projeto)
   registrando toda imagem gerada: prompt, prompt_id, url, provider, model,
   format, quality, `context_type` (`dinamica_slot`/`livre_engagement`/
   `x1_message`/`email`) + `context_id` (id do slot/mensagem/e-mail), autor
   e data. `/api/ai/generate-image` grava uma linha aqui a cada geração bem
   sucedida quando o contexto é informado — silenciosamente, sem afetar a
   resposta se a tabela ainda não existir (checado ao vivo: a geração
   continua funcionando normalmente antes da migration rodar, só o
   histórico fica vazio até lá).
3. **`ImageGenerationPanel`** ([image-generation-panel.tsx](../src/components/image-generation-panel.tsx)):
   componente único que substitui a UI de geração de imagem duplicada nos 4
   pontos do app (era ~60 linhas quase idênticas em cada arquivo) — prompt +
   `PromptPicker` + selects de qualidade/formato + botão que vira "Gerar
   nova" depois da primeira geração (mantendo a versão anterior visível, já
   que agora tudo fica no banco de gerações) + preview com Baixar/Remover +
   botão "Histórico (N)" que abre a galeria de reuso.
4. **`GeneratedImagesGallery`** ([generated-images-gallery.tsx](../src/components/generated-images-gallery.tsx)):
   popup de reuso, inspirado no galeria de variações do Magnific mas restrito
   ao essencial que faz sentido aqui (grid de thumbnails com prompt +
   formato/qualidade em overlay, "Usar" pra reaproveitar e excluir) — sem as
   opções extras da referência (editar/sketch/space/comparar) que não têm
   equivalente na "nossa realidade", como pedido. Escopo do histórico é o
   contexto exato (aquele slot/mensagem/e-mail específico), não o app
   inteiro — reabrir um item já salvo mostra as gerações anteriores dele;
   rascunhos novos (sem id ainda) não mostram o botão de histórico, já que
   não existe contexto estável pra consultar.
5. **Geração de texto e imagem viraram ações independentes** em
   [livre-generator.tsx](../src/app/(app)/dinamicas-do-dia/components/livre-generator.tsx)
   e [x1-form.tsx](../src/app/(app)/mensagens-x1/components/x1-form.tsx) —
   antes um clique só gerava os dois em paralelo (`Promise.allSettled`) se
   ambos os prompts estivessem preenchidos; agora "Gerar mensagem" cuida só
   do texto e o painel de imagem tem seu próprio "Gerar imagem", já que os
   dois passaram a ter controles próprios (qualidade/formato/histórico) que
   não fazem sentido combinados num clique único. Os campos redundantes
   `imagePromptId` do form de cada tela foram removidos — a atribuição de
   qual prompt gerou qual imagem já fica registrada com mais detalhe em
   `generated_images`.

**Ação pendente do usuário**: rodar
[0010_generated_images.sql](../supabase/migrations/0010_generated_images.sql)
no SQL Editor do Supabase pra ativar a persistência de gerações e o popup de
histórico (a geração de imagem em si já funciona normalmente sem a
migration, só o histórico fica vazio até lá).

**Validação**: `tsc --noEmit`, `next lint` e `next build` limpos. Testado ao
vivo nos 4 pontos (Dinâmicas do Dia por slot, Dinâmicas do Dia livre,
Mensagens X1, E-mails): controles de qualidade/formato aparecendo e
funcionando, geração real em 9:16/qualidade alta retornando 200 OK, botão
"Gerar nova" após a primeira geração, popup de histórico abrindo (vazio,
como esperado, já que a migration ainda não rodou) sem quebrar o fluxo de
geração.

## Adendo 18 — Popup da dinâmica em 3 colunas, gaveta de biblioteca e ajustes mobile (2026-07-18)

Reformulação do popup de horário em Dinâmicas do Dia (`message-row.tsx`),
em duas rodadas de correção sobre o mesmo popup.

1. **3 colunas lado a lado**: mensagem principal (rola internamente, sem
   precisar mostrar tudo de cara) / gerar texto com IA / gerar imagem com
   IA — antes era 2 colunas com texto+imagem empilhados na direita. Popup
   20% mais largo (`max-w-5xl` → `max-w-[76.8rem]`).
2. **Biblioteca de imagens virou gaveta lateral**, não mais um popup
   centralizado: desliza da direita pra esquerda (ajustado depois de uma
   primeira versão que abria da esquerda), por cima do popup da dinâmica,
   sem fechá-lo. Passou a agrupar por **dinâmica inteira** (`context_id =
   slot.dynamic_id`, não mais `slot.id`) — reabrir qualquer horário da
   mesma dinâmica mostra a mesma biblioteca compartilhada, mais útil que
   fragmentar por slot individual.
3. **Prévia inline da biblioteca**: em vez de só um botão "Histórico" que
   abre a gaveta, uma faixa de miniaturas com scroll horizontal aparece
   direto embaixo do campo de prompt (`ImageGenerationPanel`), carregada
   sempre que o painel monta — dá pra ver o que já foi gerado sem precisar
   abrir nada. Botão "Ver tudo" ainda abre a gaveta completa (com exclusão).
4. **Popup de imagem ampliada** (`image-preview-modal.tsx`, novo): clicar em
   qualquer miniatura (da prévia inline ou da gaveta) abre um popup por
   cima de tudo com a imagem grande, o prompt usado e botão de baixar/usar.
   Fechar esse popup (X ou clique fora) só fecha ele — a gaveta por trás
   continua aberta; fechar a gaveta é uma ação separada.
5. **Mobile**: `Modal` ganhou padding responsivo (`p-3 sm:p-6`, título
   `text-base sm:text-lg`); a mensagem principal no popup de horário virou
   `max-h-32` por padrão no mobile (era altura livre, ocupando a tela
   inteira como no print anexado), com botão "Ver mensagem completa" /
   "Recolher mensagem" (`lg:hidden`) pra expandir sob demanda — abre espaço
   pras colunas de geração sem cortar a leitura de quem quer ver tudo.

`GeneratedImagesGallery` virou componente controlado (recebe `images` como
prop em vez de buscar sozinho) — `ImageGenerationPanel` agora é a única
fonte de verdade da lista, compartilhada entre a prévia inline e a gaveta,
evitando duas queries pro mesmo dado.

**Validação**: `tsc --noEmit`, `next lint` e `next build` limpos. Testado ao
vivo: as 3 colunas renderizando corretamente, popup mais largo, clique fora/X
fechando o popup principal, gaveta abrindo/fechando com animação, imagem
gerada em tempo real aparecendo na prévia inline e na gaveta, clique na
miniatura abrindo o popup ampliado com prompt + baixar mantendo a gaveta
aberta atrás.

## Adendo 19 — Biblioteca de Prompts e Dinâmicas viram curadoria exclusiva de admin (2026-07-18)

Pedido final antes de ir pra produção: só administradores devem poder criar/
editar/excluir prompts e dinâmicas — os dois recursos pensados como
"biblioteca compartilhada" da equipe toda, em vez de conteúdo pessoal de
cada editor.

**Achado antes de implementar**: a leitura desses dois recursos **já era
global** desde a Fase 1/4.5 — qualquer usuário autenticado (mesmo "viewer")
já enxergava todos os prompts e todas as dinâmicas via RLS
(`prompts_select_all` / `message_dynamics_select_authenticated`, `auth.role()
= 'authenticated'`, sem filtro de dono). O que não existia era a restrição
do lado de quem **cria**: tanto `editor` quanto `admin` tinham permissão de
insert/update/delete idêntica. Não havia necessidade de um fluxo de
"rascunho + publicar" (opção descartada com o usuário) — só apertar a
permissão de escrita, já que a visibilidade global já era o comportamento
existente.

**Migration [0011_admin_only_libraries.sql](../supabase/migrations/0011_admin_only_libraries.sql)**
(ainda não rodada — apresentar ao usuário): troca as políticas de
insert/update/delete de `prompts`, `message_dynamics` e
`message_dynamic_slots` de `current_user_role() in ('editor','admin')` para
`public.is_admin()`. As outras tabelas de conteúdo operacional (conversas,
e-mails, mensagens X1, calendário, performance de trading) continuam com a
regra antiga editor+admin — a restrição é só pras duas bibliotecas
compartilhadas, por decisão explícita do usuário.

**Client-side**:
- [prompts-client.tsx](../src/app/(app)/prompts/prompts-client.tsx):
  `canEdit()` deixou de checar `created_by === currentUserId` e virou só
  `isAdmin`. Botões "Novo prompt" (por coluna) e "Duplicar" (que insere uma
  cópia) agora só renderizam pra admin — antes apareciam pra qualquer
  usuário autenticado e só falhavam silenciosamente na escrita.
- [dinamicas-do-dia/gerenciar/page.tsx](../src/app/(app)/dinamicas-do-dia/gerenciar/page.tsx)
  e [gerenciar/[id]/page.tsx](../src/app/(app)/dinamicas-do-dia/gerenciar/[id]/page.tsx):
  `canEdit={hasRole(profile.role, "editor")}` → `hasRole(profile.role,
  "admin")`, propagado pros editores de dinâmica/slots que já recebiam esse
  prop (sem mudança neles).

**Ação pendente do usuário**: rodar `0011_admin_only_libraries.sql` no SQL
Editor do Supabase antes de liberar o acesso pra editores/viewers em
produção — sem a migration, o banco continua aceitando escrita de
qualquer editor mesmo com a UI escondendo os botões (defesa em profundidade
incompleta até rodar).

**Validação**: `tsc --noEmit`, `next lint` e `next build` limpos.

## Adendo 20 — Deploy em produção + 2 bugs reais encontrados pelo usuário já no ar (2026-07-18)

**Deploy**: repositório GitHub privado (`gabrielrochaweup/profitxengine`) criado
pelo usuário, remote configurado, todo o trabalho pendente desde o commit
`5eede03` (Fases 5-7 completas + tudo dos Adendos 1-19) commitado e enviado.
Projeto importado no Vercel, variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`CREDENTIALS_ENCRYPTION_KEY`) configuradas reaproveitando o mesmo projeto
Supabase de desenvolvimento (decisão do usuário — já tinha as 11 migrations
rodadas, buckets e usuário admin prontos). Site URL/Redirect URLs do Supabase
Auth atualizados pra `https://profitxengine-one.vercel.app`. Login confirmado
funcionando em produção pelo usuário.

**Preferência registrada**: a partir daqui, mudanças validadas localmente
(tsc/lint/build limpos) são commitadas e enviadas direto pra `main` sem pausa
pra aprovação — o push já dispara o deploy automático no Vercel (integração
GitHub nativa). Guardado em memória (`feedback_deploy_workflow`).

**2 bugs reportados pelo usuário já usando em produção**:

1. **Saudação errada ("Boa noite" às 15h)**: `getGreeting()` em
   [dashboard/page.tsx](../src/app/(app)/dashboard/page.tsx) usava
   `new Date().getHours()` — como a Dashboard é um Server Component, isso
   roda no servidor da Vercel, que usa UTC, não o fuso do usuário. Às 15h no
   Brasil (UTC-3) são 18h em UTC, que caía na faixa "Boa noite" (`hour >=
   18`). Corrigido fixando `America/Sao_Paulo` via
   `Intl.DateTimeFormat(...).format()` em vez de depender do fuso de onde a
   função roda — coerente com o app ser 100% em português pra um público no
   Brasil, sem necessidade de detectar o fuso do navegador.
2. **Dashboard cortada no mobile (iPhone 14 Pro)**: os 2 últimos atalhos da
   grade ficavam inacessíveis. Causa raiz: `(app)/layout.tsx` usava
   `h-screen` (`100vh`) no container principal — bug clássico do Safari
   mobile, onde `100vh` é calculado como se a barra de endereço estivesse
   sempre escondida (maior que a área realmente visível quando ela está
   visível), fazendo conteúdo do fim da página ficar inacessível por
   scroll. Trocado por `h-dvh` (`100dvh`, unidade de viewport dinâmico,
   suportada desde o Tailwind 3.4 e Safari 15.4+), que acompanha a barra de
   endereço em tempo real. Complementar:
   - `app/layout.tsx` ganhou `export const viewport` com `viewportFit:
     "cover"` — sem isso, `env(safe-area-inset-*)` sempre retorna 0 e não
     tem como respeitar a faixa do home indicator/notch.
   - Menu inferior mobile ([sidebar.tsx](../src/components/layout/sidebar.tsx)):
     posição `bottom` passou a usar `max(0.5rem, env(safe-area-inset-bottom)
     + 0.25rem)` em vez de `bottom-2` fixo, pra não ficar colado na faixa do
     home indicator em iPhones sem botão físico.
   - `<main>` ganhou padding inferior com a mesma lógica de safe-area
     (`pb-[max(6rem,calc(env(safe-area-inset-bottom)+5.5rem))]` no mobile).
   - Dashboard ([dashboard/page.tsx](../src/app/(app)/dashboard/page.tsx))
     também ganhou espaçamento mais compacto no mobile (saudação menor,
     cards de atalho com padding reduzido) — não é a causa raiz, mas ajuda a
     caber mais conteúdo sem depender só do scroll em telas pequenas.

**Validação**: `tsc --noEmit`, `next lint` e `next build` limpos. Testado no
navegador em viewport 393×852 (iPhone 14 Pro): saudação mostrando "Boa
tarde" corretamente, os 6 atalhos da Dashboard visíveis sem cortar, e
confirmado via `getBoundingClientRect()`/`window.innerHeight` (não só
visualmente) que o menu inferior fica exatamente colado na base real do
viewport sem sobra de scroll — o bug de `100vh` do Safari mobile não pode
ser 100% reproduzido no ambiente de teste local (só a barra de endereço
real de um Safari em iPhone físico dispara o comportamento), mas `h-dvh` é
a correção padrão documentada e amplamente usada pra essa classe de bug.

## Adendo 21 — Simulador de Conversas: lado do atendente, download no iOS, anexo de imagem na mensagem (2026-07-19)

3 correções no Simulador de Conversas, todas testadas ao vivo.

1. **CRM/Atendimento tinha o lado do atendente invertido em relação a
   WhatsApp/Instagram.** Nesses dois, `sender="right"` sempre foi o dono
   da conta (atendente/você); no CRM, por herança de uma decisão antiga,
   `sender="left"` é que era o agente. Corrigido pra unificar a regra nos
   3: agente/atendente sempre à direita, aluno/contato sempre à esquerda.
   Mudança em [crm-chat.tsx](../src/app/(app)/conversas/components/crm-chat.tsx)
   (`isAgent = sender === "right"`, e toda a lógica de lado/cantos
   arredondados/avatar que dependia disso foi invertida junto — não bastava
   trocar só a definição de `isAgent`, o restante do JSX também assumia o
   sentido antigo), [message-editor.tsx](../src/app/(app)/conversas/components/message-editor.tsx)
   (rótulos do seletor de remetente) e [ai-generate-panel.tsx](../src/app/(app)/conversas/components/ai-generate-panel.tsx)
   (prompt de sistema que instrui a IA sobre o que "left"/"right" significam
   pro CRM). Efeito colateral positivo: o avatar do bot/canal, que antes
   aparecia ao lado das mensagens do agente (usando a foto do contato, o
   que não fazia sentido), passou a aparecer ao lado das mensagens do
   contato — mais coerente.
2. **Download de imagem não funcionava no iPhone.** Causa raiz dupla: (a)
   o link de download apontava pra uma `data:` URL (base64 direto no
   `href`), que o Safari trata de forma inconsistente/pouco confiável,
   especialmente em tamanhos maiores (export em 3x); (b) mesmo corrigindo
   isso, `window.open()` no Safari iOS só funciona quando chamado de forma
   síncrona dentro do gesto de clique — depois de qualquer `await`, o
   navegador trata como popup e bloqueia. [export-controls.tsx](../src/app/(app)/conversas/components/export-controls.tsx)
   reescrito: abre uma aba em branco *antes* de qualquer processamento
   assíncrono (só no iOS, detectado por user agent), converte o PNG de
   `data:` pra `blob:` URL via `fetch().blob()` (sem limite de tamanho
   problemático), e no iOS navega a aba já aberta pra essa blob URL (o
   usuário then segura o dedo na imagem e usa "Adicionar à Galeria" — fluxo
   nativo do iOS, já que não existe "salvar arquivo" programático lá);
   fora do iOS, mantém o `<a download>` de sempre, só que agora com blob
   URL em vez de data URL. Testado: o link de download em desktop confirmado
   apontando pra uma `blob:` URL (interceptado via monkey-patch de
   `HTMLAnchorElement.prototype.click`); o comportamento específico do
   Safari iOS não pôde ser 100% reproduzido no ambiente de teste (mesma
   limitação do Adendo 20), mas a técnica (abrir aba síncrona + navegar
   depois) é o workaround padrão documentado pra esse bug conhecido do iOS.
3. **Anexar imagem numa mensagem** (ex: print que o aluno manda). Novo
   campo `image_url` em `ConversationMessage`
   ([types.ts](../src/lib/supabase/types.ts)). No
   [message-editor.tsx](../src/app/(app)/conversas/components/message-editor.tsx),
   cada mensagem ganhou um campo de URL + botão de upload (mesmo padrão já
   usado pro avatar do contato — bucket `conversation-avatars`, agora
   também recebendo uploads em `messages/`), com preview/trocar/remover
   depois de anexada. Os 3 renderizadores de chat
   ([whatsapp-chat.tsx](../src/app/(app)/conversas/components/whatsapp-chat.tsx),
   [instagram-chat.tsx](../src/app/(app)/conversas/components/instagram-chat.tsx),
   [crm-chat.tsx](../src/app/(app)/conversas/components/crm-chat.tsx))
   passaram a mostrar a imagem dentro da bolha (sem padding, cantos
   arredondados casando com a bolha) com o texto (se houver) abaixo —
   testado ao vivo nos 3, incluindo o caso combinado com a correção 1
   (imagem + texto do aluno aparecendo corretamente à esquerda no CRM).

**Bug encontrado e corrigido durante a própria implementação**: ao inverter
`isAgent` no crm-chat.tsx, o primeiro commit só trocou a linha da definição
e esqueceu de inverter `items-start`/`items-end`, `flex-row-reverse` e os
cantos arredondados que dependiam do valor antigo — pego e corrigido antes
do build final, com teste ao vivo confirmando as duas mensagens (agente e
contato) nos lados corretos.

**Validação**: `tsc --noEmit`, `next lint` e `next build` limpos. Testado ao
vivo: CRM com agente à direita e contato à esquerda (com avatar), WhatsApp
com imagem + texto na bolha do lado correto, link de download confirmado
usando blob URL via interceptação do clique.
