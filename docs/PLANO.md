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

## Adendo — Mensagens de Grupo + Direct dos Alunos, com contexto de performance (adicionado em 2026-07-16)

Contexto: o usuário tem arquivos HTML prontos (base visual + lógica de cálculo)
para essas mensagens, a serem colados/anexados na conversa. **Antes de construir
qualquer componente deste adendo, analisar esses HTMLs**: estrutura visual,
variáveis dinâmicas, e principalmente a lógica de cálculo já embutida (percentuais,
comparativos). Evoluir esse padrão existente, não recriar do zero ignorando-o.
Aguardando os arquivos serem colados/anexados na conversa antes de iniciar a Fase 4.5.

Escopo:

1. **Sub-abas dentro do Calendário de Engajamento**: "Grupo" (o que já foi
   construído na Fase 4) e "Direct (Alunos)" (nova). Mesmo calendário
   visual/mês/semana compartilhado; cada dia mostra dois indicadores
   separados (contagem de mensagens de Grupo vs. de Direct).

2. **Sub-aba "Direct (Alunos)"**: prompt de texto (`PromptPicker` categoria
   "mensagem"), prompt de imagem opcional, seletor de tom/segmento do aluno
   (iniciante, avançado, inativo há X dias — esse contexto é injetado
   automaticamente no prompt antes de gerar), botão Gerar, cópia formatada
   WhatsApp, campo resultado (funcionou/não funcionou) + nota, histórico
   filtrável por segmento e tema.

3. **Nova tabela `direct_messages`** (schema no histórico da conversa,
   mesma forma de `engagement_messages` + `student_segment`), com RLS
   seguindo o mesmo padrão admin/editor/viewer das demais tabelas de conteúdo.

4. **Contexto de performance nas 4 janelas (Dia/Semana/Mês/Geral)**: antes de
   cada geração (Grupo e Direct), calcular taxa de aprovação (`result`)
   nessas 4 janelas — possivelmente segmentado por padrão/tag/abordagem se
   os HTMLs anexados já tiverem essa lógica — injetar esse resumo como
   contexto no prompt enviado à IA (ex: "mensagens com tom de urgência
   tiveram 80% de aprovação nos últimos 7 dias..."), e também exibir esses 4
   indicadores visualmente num painel acima do campo de geração, replicando
   a lógica visual dos HTMLs anexados.

5. **`generateText()` em `/lib/ai`** precisa aceitar um parâmetro adicional
   `performanceContext: string` (texto já montado a partir dos 4 indicadores),
   incluído no prompt/system antes de cada chamada — tanto para Grupo quanto
   para Direct.

Isso vira efetivamente uma **Fase 4.5**, encaixada depois da Fase 4 e antes da
Fase 5 (E-mails), já que Fase 5 também reaproveita o padrão de notícia/gancho
construído na Fase 4.

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

- **Fase 4.5 — Mensagens de Direct (Alunos) + contexto de performance**
  Ver "Adendo" acima. Sub-aba "Direct (Alunos)" no Calendário, tabela
  `direct_messages`, cálculo de performance em 4 janelas (Dia/Semana/Mês/
  Geral) injetado no prompt de geração e exibido visualmente, replicando a
  lógica dos HTMLs anexados pelo usuário. **Bloqueada até o usuário colar/
  anexar os arquivos HTML de referência.**

- **Fase 5 — E-mails**
  Calendário de eventos, sugestão de notícias (mesma integração de notícias
  da Fase 4, foco cripto), geração e preview de e-mail com `PromptPicker`.

- **Fase 6 — Admin**
  Gestão de usuários/papéis, status de conexões, log de uso.

- **Fase 7 — Polimento**
  Responsividade, estados vazios, loading states, tratamento de erro,
  revisão final do design system.
