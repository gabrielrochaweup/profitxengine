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

- **Fase 4 — Calendário de Engajamento**
  View de calendário, modal de geração texto+imagem (com `PromptPicker`),
  campo de resultado/nota, analytics básico, **atalho de notícia/evento
  econômico cripto por dia (requisito 2 acima)**.

- **Fase 5 — E-mails**
  Calendário de eventos, sugestão de notícias (mesma integração de notícias
  da Fase 4, foco cripto), geração e preview de e-mail com `PromptPicker`.

- **Fase 6 — Admin**
  Gestão de usuários/papéis, status de conexões, log de uso.

- **Fase 7 — Polimento**
  Responsividade, estados vazios, loading states, tratamento de erro,
  revisão final do design system.
