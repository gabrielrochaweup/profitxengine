-- Egi — IA de atendimento da ProfitX.
--
-- Responde pela equipe de suporte com base no manual de atendimento: a
-- pessoa cola a pergunta do aluno e recebe a resposta pronta, com o nível de
-- alerta. Usa a MESMA IA do resto do app (chaves e provedor em
-- Configurações), como um módulo a mais.
--
-- Quem é de quem:
--   prompt e arquivos .... do produto, só admin edita (mudar isso muda o
--                          que a equipe inteira responde pros alunos)
--   conversas ............ de cada pessoa, privadas, como no Claude
--   FAQ .................. da equipe inteira: a resposta que alguém aprovou
--                          vira referência pra todo mundo

-- ── 1. A Egi como módulo de IA ──────────────────────────────────────────
alter table ai_provider_settings drop constraint if exists ai_provider_settings_module_check;
alter table ai_provider_settings
  add constraint ai_provider_settings_module_check
  check (module in ('conversa', 'mensagem', 'imagem', 'email', 'blog', 'egi'));

alter table ai_usage_log drop constraint if exists ai_usage_log_module_check;
alter table ai_usage_log
  add constraint ai_usage_log_module_check
  check (module in ('conversa', 'mensagem', 'imagem', 'email', 'blog', 'egi'));

-- Começa com a mesma IA do módulo de conversas — "a IA que a gente usa". Dá
-- pra trocar só a da Egi em Configurações > Provedor por tipo de tarefa.
insert into ai_provider_settings (module, provider, model)
select 'egi', provider, model from ai_provider_settings where module = 'conversa'
on conflict (module) do nothing;

-- ── 2. Prompt e arquivos (a "cabeça" da Egi) ────────────────────────────
create table egi_config (
  product_id uuid primary key references products(id) on delete cascade,
  prompt text not null default '',
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

create table egi_arquivos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  nome text not null,
  -- Texto puro (.md / .txt): é o que vai inteiro pro contexto do modelo.
  conteudo text not null,
  -- Desligar sem apagar: tirar um arquivo da Egi por um tempo e voltar.
  ativo boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index egi_arquivos_product_idx on egi_arquivos (product_id);

alter table egi_config enable row level security;
alter table egi_arquivos enable row level security;

create policy "egi_config_select" on egi_config for select using (public.has_product_access(product_id));
create policy "egi_config_admin" on egi_config for all using (public.is_admin()) with check (public.is_admin());
create policy "egi_arquivos_select" on egi_arquivos for select using (public.has_product_access(product_id));
create policy "egi_arquivos_admin" on egi_arquivos for all using (public.is_admin()) with check (public.is_admin());

-- ── 3. FAQ da equipe ────────────────────────────────────────────────────
create table egi_faq (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  pergunta text not null,
  resposta text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index egi_faq_product_idx on egi_faq (product_id, created_at desc);

alter table egi_faq enable row level security;
create policy "egi_faq_equipe" on egi_faq
  for all using (public.has_product_access(product_id))
  with check (public.has_product_access(product_id));

-- ── 4. Conversas e mensagens (de cada pessoa) ───────────────────────────
create table egi_conversas (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  titulo text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index egi_conversas_dono_idx on egi_conversas (user_id, product_id, updated_at desc);

create table egi_mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references egi_conversas(id) on delete cascade,
  papel text not null check (papel in ('user', 'assistant')),
  conteudo text not null,
  -- Preenchido quando a resposta foi salva no FAQ: o botão vira "Salva no
  -- FAQ" e não duplica.
  faq_id uuid references egi_faq(id) on delete set null,
  created_at timestamptz not null default now()
);
create index egi_mensagens_conversa_idx on egi_mensagens (conversa_id, created_at);

alter table egi_conversas enable row level security;
alter table egi_mensagens enable row level security;

-- A conversa é de quem abriu. Renomear e excluir pelo navegador; criar e
-- escrever mensagens só pela rota do chat (service key), que confere o dono.
create policy "egi_conversas_dono" on egi_conversas
  for all using (user_id = auth.uid() and public.has_product_access(product_id))
  with check (user_id = auth.uid() and public.has_product_access(product_id));

create policy "egi_mensagens_leitura_do_dono" on egi_mensagens
  for select using (
    exists (select 1 from egi_conversas c where c.id = conversa_id and c.user_id = auth.uid())
  );

-- ── 5. Ponto de partida: prompt e manual de atendimento da ProfitX ──────
-- O prompt é o do PROMPT-Agente-Suporte.md; o manual vai como arquivo
-- anexado. Os dois ficam editáveis em Configurações > Egi — IA.
insert into egi_config (product_id, prompt)
select id, $prompt$Você é o agente de suporte da ProfitX, uma escola de educação em
mercado financeiro com mais de 8 mil alunos.

A equipe de atendimento vai te enviar a pergunta do aluno — o texto
exato, copiado. Você devolve a resposta pronta para ser enviada,
junto com os alertas necessários.

═══════════════════════════════════════════
O QUE VOCÊ PRECISA SABER
═══════════════════════════════════════════

A ProfitX é uma ESCOLA. Não é corretora, não é banco, não é gestora.
Não recebe, não guarda e não movimenta dinheiro de aluno. Não tem
acesso a contas, saldos ou operações.

Existem TRÊS CAMADAS:
• ESCOLA (ProfitX) — ensina, vende o curso, dá suporte
• FORNECEDORA (Vortex) — desenvolve e mantém as ferramentas,
  responde tecnicamente por elas
• CORRETORA — abre a conta, guarda o dinheiro, executa as ordens,
  define as regras

A separação NUNCA é desculpa para não ajudar. O tom nunca é
"não é conosco" — é "quem resolve é X, e eu te ajudo a chegar lá".

A ProfitX responde pelo CDC por tudo que o aluno consome aqui:
conteúdo, acesso, suporte, atualizações.

═══════════════════════════════════════════
PASSO 1 — CLASSIFIQUE O NÍVEL DE ALERTA
═══════════════════════════════════════════

🟢 VERDE — dúvida comum (acesso, conteúdo, como usar, horário,
rollover, planos). Responda normalmente.

🟡 AMARELO — aluno insatisfeito, mas sem acusar ninguém.
Sinais: "não estou tendo resultado", "não é o que eu esperava",
"isso não funciona". Acolha primeiro, não se defenda, não cite
contrato.

🔴 VERMELHO — PARE. Não gere resposta final.
Gatilhos:
• Ameaça de ação judicial, advogado, Procon ou imprensa
• Menção a CVM, Banco Central ou órgão regulador
• Acusação de golpe, fraude ou "vocês me roubaram"
• Pedido de ressarcimento de prejuízo na corretora
• Culpa atribuída à ferramenta ou ao Modo Strike por perda
• Alegação de publicidade enganosa ou venda casada
• Perda financeira relevante
• Aluno em situação financeira grave ou emocionalmente abalado
• Qualquer coisa fora do manual

Se for VERMELHO, responda:
"🔴 ALERTA VERMELHO — NÃO ENVIAR SEM APROVAÇÃO"
Explique qual gatilho foi acionado, sugira um rascunho baseado nos
cenários de escalada do manual, e liste o que registrar.

═══════════════════════════════════════════
PASSO 2 — RESPONDA NESTE FORMATO
═══════════════════════════════════════════

NÍVEL: [🟢 / 🟡 / 🔴]

PODE ENVIAR DIRETO? [sim / não + motivo]

RESPOSTA PRONTA:
[texto completo, pronto para copiar e colar, no tom do manual]

⚠️ CUIDADOS NESTA RESPOSTA:
[o que não pode ser dito, o que evitar]

📎 BASE NO CONTRATO:
[quais cláusulas fundamentam — só para a equipe saber,
NÃO para citar ao aluno em situação normal]

❓ FALTA VERIFICAR:
[o que a equipe precisa confirmar antes de enviar, ou "nada"]

🔺 ESCALAR PARA: [ninguém / gestão / Robson]

═══════════════════════════════════════════
REGRAS ABSOLUTAS
═══════════════════════════════════════════

NUNCA use estas palavras:
garantido · garantia de lucro · sem risco · risco zero · no mínimo
X% · nunca perde · impossível perder · seguro (use "cobertura" ou
"proteção de banca") · robô (use "Modo Strike" ou "o Pepe opera") ·
nós alavancamos tua banca · a gente opera pra você · gerente de
resultados (use "consultor") · vitalício · pra sempre · Tá lucrando?
(use "Como tá indo?")

NUNCA:
• Prometa resultado, ganho ou prazo de retorno
• Afirme que o aluno vai ganhar
• Cite cláusula do contrato em conversa normal — só em escalada,
  e sempre como informação, nunca como ameaça
• Sugira empréstimo ou aumento de aporte
• Minimize a preocupação de quem diz estar apertado
• Prometa resolver algo da corretora
• Invente informação — se não souber, diga que vai verificar

SEMPRE:
• Todo número é projeção: use "faixa de", "meta", "potencial de"
• Quem opera são os traders, não a escola
• Depósito sempre direto na corretora, na conta do próprio aluno
• Acolha antes de explicar
• Ofereça o que a empresa PODE fazer

═══════════════════════════════════════════
TOM
═══════════════════════════════════════════

Cordial, direto, humano e honesto. Sem robotização, sem juridiquês,
sem tom defensivo.

O aluno lembra mais de como foi tratado do que da resposta que
recebeu.

Quando a resposta precisar dizer "não", diga com clareza e ofereça
o caminho: nunca deixe o aluno sem saída.$prompt$
from products where slug = 'profitx'
on conflict (product_id) do nothing;

insert into egi_arquivos (product_id, nome, conteudo)
select id, 'MANUAL-Atendimento-ProfitX.md', $manual$# MANUAL GLOBAL DE ATENDIMENTO — PROFITX
### Método TRIAD · Suporte · Reclame AQUI · Situações críticas
**Base: Contrato Método TRIAD v7 · Termos de Uso Vortex v2**

> **Para quem é:** equipe de suporte e agente de IA.
> **O que é:** o documento único que responde qualquer situação de atendimento.
> **A premissa que vale para tudo:** primeiro a gente tenta resolver. Sempre.

---

# 📖 COMO USAR ESTE DOCUMENTO

```
Chegou uma dúvida comum      → PARTE 10 (Perguntas frequentes)
Não achou a resposta         → PARTES 2 a 9 (o método explicado)
A conversa esquentou         → PARTE 12 (Níveis de alerta)
O aluno culpou a gente       → PARTE 13 (Respostas de escalada)
Virou reclamação no RA       → PARTE 14 (Protocolo Reclame AQUI)
Precisa citar o contrato     → PARTE 16 (Cláusulas na íntegra)
```

## ⚠️ A regra número um sobre o contrato

**Nunca jogue o contrato na cara do aluno.**

O aluno aceitou os termos, e eles nos amparam. Mas citar cláusula numa conversa normal soa como ameaça e transforma dúvida em conflito.

**A ordem correta é sempre:**
```
1. Acolher
2. Resolver ou orientar
3. Só se escalar → citar o que ele aceitou, com delicadeza
```

Na Parte 13 estão as respostas prontas para quando chega nesse ponto.

---
---

# PARTE 1 — O QUE É A PROFITX

## Em uma frase
A ProfitX é uma **escola**. Ensina a operar no mercado financeiro e dá acesso a ferramentas que ajudam nisso.

## O que a ProfitX NÃO é

**Não é corretora. Não é banco. Não é gestora de dinheiro.**

Traduzindo:
- ❌ Não recebe dinheiro de aluno
- ❌ Não guarda dinheiro de aluno
- ❌ Não movimenta dinheiro de aluno
- ❌ Não vê saldo, não vê extrato, não vê conta
- ❌ Não aperta botão de compra ou venda
- ❌ Não diz para um aluno específico o que ele deve fazer com o dinheiro dele

> 🔑 **Decore esta frase:**
> *"Somos uma escola de educação em mercado financeiro. Não somos corretora, não guardamos dinheiro e não temos acesso a contas de investimento de alunos."*

📎 *Base: Cláusula 1.2*

---
---

# PARTE 2 — AS TRÊS CAMADAS
**É o conceito mais importante deste manual.**

Imagine uma autoescola.

- A **autoescola** ensina você a dirigir
- A **fábrica** faz o carro
- O **Detran** dá a habilitação e as regras da rua

São três coisas diferentes. A autoescola não fabrica carro nem emite habilitação — mas ensina você a usar os dois.

**É exatamente assim aqui:**

| Camada | Quem é | O que faz |
|---|---|---|
| 🎓 **ESCOLA** | ProfitX | Ensina o método. Vende o curso. Dá suporte. |
| 🛠️ **FORNECEDORA** | Vortex — empresa de tecnologia parceira, sediada no exterior | Faz e mantém as ferramentas. Responde por elas tecnicamente. |
| 🏦 **CORRETORA** | Plataforma escolhida pelo aluno | Abre a conta, guarda o dinheiro, executa as ordens, faz as regras. |

## ⚠️ E isso NÃO tira a nossa responsabilidade

**A ProfitX responde pelo Código de Defesa do Consumidor** por tudo que o aluno consome aqui: conteúdo, acesso, suporte, atualizações.

📎 *Base: Cláusulas 6.8 a 6.10*

> **A separação nunca é desculpa para não ajudar.**
> ❌ Errado: *"isso não é conosco"*
> ✅ Certo: *"isso quem resolve é a corretora, e eu te ajudo a chegar lá"*

## Onde cada coisa se resolve

| Assunto | Quem resolve |
|---|---|
| Aulas, conteúdo, senha, acesso à plataforma de ensino | **ProfitX** |
| Cobrança, reembolso, cancelamento, upgrade | **ProfitX** |
| Ferramenta não abre, erro técnico, bug | **Vortex** *(via nosso suporte)* |
| Depósito, saque, saldo, rollover, KYC, bloqueio | **Corretora** |
| Resultado de operação, ordem executada | **Corretora** |

---
---

# PARTE 3 — O MÉTODO TRIAD EXPLICADO SIMPLES

## O problema que ele resolve

Antes, a gente operava com **uma ferramenta só**.

Quando essa ferramenta ia mal num dia, o dia estava perdido. Não tinha de onde tirar.

## A solução: não depender de uma coisa só

Pensa assim: **se você tem três torneiras enchendo um balde e uma entope, as outras duas continuam enchendo.** Se você tivesse só uma, o balde parava.

O Método TRIAD é isso — **três frentes trabalhando ao mesmo tempo**, para que um dia ruim numa delas não derrube o dia inteiro.

## Os três pilares

```
              COPY TRADER
                  ▲
                 ╱ ╲
                ╱   ╲
               ╱ TRIAD╲
              ╱_________╲
            IA         LIVES
```

**1. COPY TRADER**
Equipes de traders profissionais operam nas contas deles. O sistema copia essas operações para a conta do aluno, no tamanho proporcional à banca dele.

**2. IA PEPE**
Uma inteligência artificial analisa o mercado e aponta oportunidades. São 3 sessões por dia. No **Modo Strike**, ela também executa sozinha, seguindo o que o aluno configurou.

**3. LIVES**
Sessões ao vivo, todo dia às 20h, com análise de mercado em tempo real.

## O que isso muda na prática

O resultado que a gente busca não é explosão — é **crescimento contínuo**. Num dia em que uma ferramenta vai mal, as outras seguram e o dia não vira prejuízo.

> 💬 **Frase pronta:** *"Em vez de depender de uma coisa só, a gente distribui em três frentes. Uma vai mal no dia, as outras seguram."*

## Por que cripto

O mercado de criptomoedas funciona **24 horas por dia, 7 dias por semana**. Isso dá autonomia total: o aluno opera de manhã, de noite, de madrugada, no fim de semana — no horário que der para ele.

---
---

# PARTE 4 — AS FERRAMENTAS

> Todas ficam na **plataforma Vortex**. O acesso é por link enviado ao **mesmo e-mail da compra**.

## 🐸 IA PEPE

**O que é:** uma inteligência artificial que olha o mercado e aponta oportunidades.

**Como funciona:** 3 sessões por dia — manhã, tarde e noite. Média de 60 análises.

**O que a equipe pode dizer:**
- É uma referência técnica, não uma ordem
- A taxa de acerto é real e aparece no painel
- Quem decide operar — e quanto — é sempre o aluno

**⚠️ Nunca dizer:**
- ❌ *"A IA garante acerto"*
- ❌ *"É só seguir que dá certo"*
- ❌ *"Ela não erra"*

📎 *Base: Cláusula 7.5(a) — os sinais são referências técnicas gerais, não personalizadas, produzidas por modelos probabilísticos que podem ser imprecisos, incompletos, atrasados ou incorretos*

## ⚡ MODO STRIKE — o Pepe operando sozinho

**O que é:** o Pepe executando as operações automaticamente.

**Como funciona — e este é o ponto central:**

**O aluno define tudo.** Quais ativos, quanto por operação, até onde aceita ganhar, até onde aceita perder, em que horários. A ferramenta só executa o que ele mandou.

> 💬 **Frase pronta:** *"Você continua no comando. Ele só executa o que você configurou."*

📎 *Base: Cláusula 7.5(f) — a ferramenta atua como meio técnico de execução, sem qualquer discricionariedade. Todos os parâmetros são definidos exclusiva e previamente pelo próprio ALUNO*

**O aluno pode alterar, pausar ou desligar a qualquer momento.**

**⚠️ O que a equipe precisa sempre reforçar:**
- **Testar com valor pequeno** antes de usar em volume
- **Acompanhar a conta** — não deixar só no automático e esquecer
- A permissão da integração é **só de execução, nunca de saque**
- **A ProfitX nunca pede senha da conta**

📎 *Base: Cláusulas 7.7(b), 7.7(f) e 7.8(d)*

**⚠️ Sobre falhas:**
Não existe garantia de que toda ordem será executada, nem de que será executada no tempo certo, nem de que os limites configurados sempre vão disparar. Pode haver atraso, erro ou indisponibilidade. A responsabilidade técnica é da Fornecedora.

📎 *Base: Cláusula 7.8*

> 🔴 **Nunca use a palavra "robô".** Fale **"Modo Strike"** ou **"o Pepe opera"**.

## 💰 COPY TRADER

**O que é:** o aluno segue equipes de traders, e o que eles operam aparece na conta dele.

**Como funciona:** ele escolhe as equipes no painel Vortex, conforme o plano. As operações são copiadas **proporcionalmente** ao tamanho da banca dele.

**O que a equipe pode dizer:**
- Os traders operam nas contas deles; o sistema espelha na conta do aluno
- É voluntário — ele liga e desliga quando quiser
- O dinheiro nunca sai da conta dele

📎 *Base: Cláusula 7.5(b) — os recursos do ALUNO permanecem, em todos os casos, em conta de sua exclusiva titularidade, jamais custodiados pela ProfitX*

**⚠️ Avisos:**
- As operações são **proporcionais** — atenção ao tamanho da banca
- Existem outros traders na corretora que **não são da ProfitX**; seguir esses é risco do aluno
- Pode dar perda, inclusive perda grande

## 📺 LIVES

Todo dia útil, **20h**. Análise de mercado ao vivo.

O foco é **aprender vendo**. Se rolar operação, o aluno decide se replica — por conta e risco dele.

**O link fica no grupo.**

## ⚡ SESSÕES KAMIKAZE

**O que é:** sessões com alto volume de operações concentradas, com acompanhamento.

**⚠️ Avisos obrigatórios:**
- Volume alto = **mais exposição no mesmo dia**
- Exige gerenciamento rigoroso
- **Não é para todo dia nem para todo mundo**
- Quem está começando não precisa participar

## 🧮 CALCULADORAS

Ferramentas de cálculo no painel Vortex.

São **estimativas ilustrativas**. Não são promessa nem previsão de retorno.

📎 *Base: Cláusula 7.5(d)*

---
---

# PARTE 5 — OS PLANOS

O que muda é **quanto de acesso**, não a experiência.

| | Starter | Pró | Elite |
|---|---|---|---|
| Copy Trader | 1 equipe | 2 equipes | **3 equipes** |
| IA Pepe | reduzida | ampliada | **totalmente liberada** |
| Bônus nas alavancagens | +5% | +10% | **+20%** |
| Ferramentas e novidades | básico | intermediário | **completo** |

**O que dizer:**
- **Todas as aulas são iguais para todos.** Nenhuma é bloqueada por plano
- Dá para ter resultado no Starter — ele **não precisa** migrar
- O upgrade pode ser feito quando ele quiser

**⚠️ Nunca dizer:**
- ❌ *"Se subir de plano você vai ganhar mais"*
- ❌ *"No Elite o resultado é garantido"*
- ✅ **Certo:** *"No Elite você tem acesso a mais operações por dia e a um bônus maior nas alavancagens"*

---
---

# PARTE 6 — AS ALAVANCAGENS

## O que são

Campanhas promocionais em que traders operam com uma cobertura de capital alocada pela corretora. O aluno participa por faixa de depósito, e as operações são copiadas na conta dele.

## ⚠️ Os 6 pontos que a equipe não pode errar

**1. Não são produto da ProfitX**
São programas promocionais de terceiros. Não fazem parte de nenhum plano e não foram vendidas ao aluno. A escola só divulga.
📎 *Cláusulas 10.6 e 10.7*

**2. Todo número é projeção**
As faixas são metas buscadas, nunca garantia. O resultado pode vir menor, zero ou negativo.
📎 *Cláusula 10.2(f)*

**3. A cobertura não é seguro**
É benefício promocional da corretora, com limites e condições próprias.
> 🔴 **Nunca diga "seguro".** Diga **"cobertura"** ou **"proteção de banca"**.

**4. Por que a faixa muda conforme o depósito**
Não é garantia maior para quem põe mais. É tamanho de operação: banca maior comporta entrada maior e mais operações no mesmo dia.
📎 *Cláusula 10.2(i)*

**5. Depósito sempre na própria conta**
Pedido de depósito em conta de pessoa física ou de empresa diferente da corretora **é golpe**. Reportar na hora.
📎 *Cláusula 10.5*

**6. Quem ganha o quê**
Os traders recebem percentual **só sobre resultado positivo**. Não incide sobre perda, não é custo extra para o aluno, e **a ProfitX não recebe nada disso**.
📎 *Cláusula 7.10*

## Para onde encaminhar

Dúvidas sobre participar, valores e condições → **comercial da Vortex**.

---
---

# PARTE 7 — A CORRETORA

## O básico

**A conta é do aluno.** Ele abre, ele opera, o dinheiro é dele.
📎 *Cláusula 8.1*

**Ele é livre para escolher onde opera.** A gente mostra onde a equipe opera, mas isso é informativo — não é indicação.
📎 *Cláusulas 8.2 e 8.3*

**A ProfitX não manda nas regras** da corretora: prazos, saque, taxas, limites.
📎 *Cláusula 8.4(b)*

**As plataformas são estrangeiras**, reguladas no país de origem.
📎 *Cláusula 8.4(d)*

## 🔄 ROLLOVER — a dúvida que mais chega

**O que é:** um volume de operações que a corretora exige antes de liberar o saque.

**A conta:**
```
Depósito × fator da corretora = volume a movimentar
Volume ÷ valor de cada entrada = número de operações
```

**Exemplo:** depósito de $1.000, fator 4, entrada de 2% ($20)
```
$1.000 × 4 = $4.000 a movimentar
$4.000 ÷ $20 = 200 operações
```

## Os 3 pontos que resolvem quase toda dúvida

**1. Rollover é movimentação, não lucro.**
Ganhou ou perdeu, o volume conta igual.

**2. O Copy não conta.**
É batido com operações manuais que o aluno faz.

**3. É regra da corretora, não da escola.**
Toda corretora do mundo tem.

## Por que existe *(para explicar sem defensiva)*

- **Corretora não é banco.** Banco guarda e transfere; corretora existe para operar
- **Prevenção à lavagem de dinheiro** — depositar e sacar sem operar é o padrão clássico, e toda instituição é obrigada a impedir
- **É o que permite os benefícios existirem** — sem rollover, ninguém conseguiria oferecer cobertura ou promoção
- **Custo de processamento** — cada depósito e saque tem custo

> 📌 Sempre encaminhar para a aula: **"Metas e Gerenciamento: Monte Seu Plano de Operação do Depósito Até o Seu Saque"**

## ⚠️ Se o aluno reclamar de depósito, saque ou saldo

```
1. Acolher — a preocupação é legítima
2. Explicar que não temos acesso — não por recusa,
   por impossibilidade técnica
3. Orientar sobre o canal certo na corretora
4. NUNCA prometer resolver, reembolsar ou intervir
```

---
---

# PARTE 8 — O QUE A PROFITX PROMETE
*A equipe precisa saber, porque é o que pode prometer com segurança.*

✅ **Conteúdo acessível** durante todo o prazo do plano, sem bloqueio
✅ **Resposta do suporte em até 1 dia útil**
✅ **Aviso prévio** de mudanças relevantes
✅ **Acesso às ferramentas** do plano, ou substituição equivalente
✅ **Atualizações e conteúdos novos** sem custo adicional
✅ **Reembolso de 7 dias**, integral, sem justificativa e sem burocracia

📎 *Base: Cláusulas 6.8 e 3.3*

**Se a ProfitX falhar:** o aluno avisa, temos 30 dias para resolver. Não resolvido, ele escolhe entre reembolso proporcional ou compensação.
📎 *Cláusula 6.10*

> ⚠️ **Sobre prazo técnico:** quando a solução depende de integração, atualização ou plataforma de terceiro, pode levar mais tempo. Nesse caso, mantemos o aluno informado.

---
---

# PARTE 9 — REGRAS DE COMUNICAÇÃO

## 🔴 Palavras proibidas

| ❌ Nunca | ✅ Use |
|---|---|
| "garantido" / "garantia de lucro" | "potencial", "projeção", "meta" |
| "sem risco" / "risco zero" | *(não afirme)* |
| "no mínimo X%" | "faixa de X a Y%" |
| "nunca perde" / "impossível perder" | *(não use)* |
| "seguro" *(a cobertura)* | **"cobertura"** / **"proteção de banca"** |
| "robô" | **"Modo Strike"** / **"o Pepe opera"** |
| "nós alavancamos tua banca" | "os traders operam e replica na tua conta" |
| "a gente opera pra você" | "os traders operam" |
| "gerente de resultados" | "consultor" |
| "vitalício" / "pra sempre" | "enquanto for aluno" |
| "Tá lucrando?" | "Como tá indo?" |

## As 6 regras de ouro

**1. Todo número é projeção.** Antes de qualquer valor: "faixa de", "meta", "potencial de".

**2. Quem opera são os traders.** A escola não opera, não movimenta e não guarda dinheiro.

**3. Depósito sempre direto na corretora, na conta do próprio aluno.**

**4. Nunca prometa prazo de retorno.**

**5. Nunca afirme que o aluno vai ganhar.** Fale de possibilidade e do que a estrutura oferece — nunca do que ele vai obter.

**6. Se não souber, não invente.** Escalar é sempre melhor que responder errado.

## ⚠️ Cuidado especial: capital de risco

O aluno declarou no contrato, **sob as penas da lei**, que o dinheiro que ele usa é capital de risco — e que não é dinheiro de moradia, alimentação, saúde, educação, dívidas ou de terceiros.
📎 *Cláusula 4.2*

**A equipe NUNCA deve:**
- ❌ Sugerir que ele pegue empréstimo
- ❌ Sugerir que ele aumente o aporte
- ❌ Minimizar a preocupação de quem diz estar apertado

**Se ele demonstrar estar usando dinheiro que não pode perder:** orientar com cuidado, lembrar da regra de capital de risco, **e nunca incentivar**.

---
---

# PARTE 10 — PERGUNTAS FREQUENTES

## Sobre o método

**"A ProfitX opera meu dinheiro?"**
> Não. A gente é escola. Os traders operam nas contas deles e o sistema copia as operações para a sua conta, na corretora. Seu dinheiro fica sempre com você.

**"Vou ganhar quanto por mês?"**
> Não dá pra prever, e quem prometer número está mentindo. O mercado tem risco real, incluindo perda do capital. O que a gente entrega é estrutura, método e acompanhamento — o resultado depende do mercado e de como você opera.

**"O método funciona mesmo?"**
> O método existe porque depender de uma ferramenta só é frágil. São três frentes ao mesmo tempo, o que distribui o risco. Mas nenhum método elimina o risco de mercado.

**"Preciso saber operar?"**
> Pra começar, não. O Copy replica automaticamente e a IA entrega as análises prontas. Mas recomendo muito assistir as aulas de gerenciamento — quem entende o porquê opera melhor.

**"Quanto tempo preciso dedicar?"**
> Depende de como você usa. Com Copy e Modo Strike, boa parte roda sozinha. As lives são às 20h e são opcionais.

## Sobre as ferramentas

**"A IA erra?"**
> Erra sim. É um modelo probabilístico — pode errar, atrasar ou trazer informação incompleta. A taxa de acerto é real e está no painel. A decisão de operar é sempre sua.

**"O Modo Strike é seguro?"**
> Ele executa exatamente os parâmetros que você define. Mas é tecnologia, e tecnologia pode falhar: pode ter latência, erro de execução ou ficar fora do ar. Por isso a gente recomenda testar com valor pequeno e acompanhar a conta.

**"Vocês têm acesso à minha conta?"**
> Não. A gente nunca pede senha. Quando você ativa a integração, a chave é gerada por você, com permissão só de execução — nunca de saque. E você revoga quando quiser.

**"Posso desligar o Copy?"**
> Pode, a qualquer momento, sem penalidade nenhuma.

**"Por que o Copy operou um valor diferente do que eu esperava?"**
> As operações são replicadas proporcionalmente ao tamanho da sua banca. Se a proporção não está como você quer, dá pra ajustar. Me diz o que você configurou que eu te ajudo a revisar.

## Sobre a corretora

**"Por que não consigo sacar?"**
> Provavelmente é o rollover — um volume de operações que a corretora exige antes de liberar o saque. É regra da corretora, e toda corretora tem. A gente tem uma aula explicando como funciona e como bater. Se depois de ver a aula a dúvida continuar, o canal certo é o suporte da corretora.

**"Vocês podem liberar meu saque?"**
> Não temos acesso a contas, saldos ou saques — não por recusa, mas porque tecnicamente esse acesso não existe do nosso lado. Quem pode resolver é a corretora onde sua conta está. Posso te ajudar a achar o canal certo.

**"Posso usar outra corretora?"**
> Pode. Você é livre pra operar onde quiser.

**"A corretora bloqueou minha conta"**
> Sinto muito, e entendo a preocupação. Bloqueio de conta é decisão da corretora e a gente não tem acesso nem ingerência nisso. O caminho é o suporte deles. Se quiser, te ajudo a encontrar o canal.

## Sobre as alavancagens

**"Como funciona a alavancagem?"**
> É uma campanha promocional da corretora em que os traders operam e as operações são copiadas na sua conta. Você participa por faixa de depósito. Os números divulgados são metas buscadas, não garantia — pode dar menos, e pode dar perda.

**"É garantido que vou dobrar?"**
> Não. Nenhum número divulgado é garantia — são projeções e metas. Existe risco real de perda.

**"A cobertura garante que eu não perco?"**
> Não. A cobertura é um benefício promocional da corretora, com limites e condições próprias. Ela não elimina o risco.

**"Onde deposito?"**
> Sempre direto na corretora, na sua própria conta. Se alguém pedir depósito em conta de pessoa física ou de outra empresa, **é golpe** — me avisa na hora.

## Sobre cobrança e acesso

**"Quero reembolso"**
> Dentro de 7 dias corridos da compra, o reembolso é integral, sem justificativa e sem burocracia. Me passa o e-mail da compra que eu encaminho.

**"Não recebi o acesso"**
> Dá uma olhada na caixa de spam e nas outras pastas. Se não estiver lá, me manda o e-mail que você usou na compra e o nome completo que eu localizo no sistema. Fica tranquilo que seu acesso está garantido.

**"Quanto tempo tenho de acesso?"**
> Conforme o prazo indicado na oferta do plano que você contratou.

**"Recebi um e-mail que eu não pedi"**
> Provavelmente é comunicação sobre atualização da plataforma. É gratuito e não gera cobrança nenhuma. Me diz qual foi que eu confirmo pra você.

---
---

# PARTE 11 — 🚦 NÍVEIS DE ALERTA

Antes de responder, classifique a mensagem. Isso define **como** responder e **se** você pode responder sozinho.

## 🟢 VERDE — responda normalmente

Dúvida de acesso, conteúdo, senha, como usar ferramenta, horário de live, como configurar, o que é rollover, diferença de planos.

➡️ **Use a Parte 10.** Tom cordial e direto. Sem citar contrato.

## 🟡 AMARELO — responda com cuidado

O aluno está insatisfeito, mas não acusa ninguém.

**Sinais:** "não estou tendo resultado" · "não é o que eu esperava" · "isso não funciona" · "queria entender melhor por que perdi"

➡️ **Acolha primeiro.** Não se defenda. Não cite contrato. Explique com calma e ofereça ajuda concreta.

**Frase de abertura:**
> *"Entendo, e obrigado por falar comigo. Deixa eu te ajudar a entender o que aconteceu."*

⚠️ **Registre o atendimento.** Amarelo que não é bem resolvido vira vermelho.

## 🔴 VERMELHO — NÃO responda sozinho

**Pare e escale imediatamente se aparecer qualquer um destes:**

- [ ] Ameaça de ação judicial, advogado, Procon ou imprensa
- [ ] Menção a CVM, Banco Central ou órgão regulador
- [ ] Acusação de golpe, fraude, estelionato ou "vocês me roubaram"
- [ ] **Pedido de ressarcimento de prejuízo na corretora**
- [ ] **Culpa atribuída à ferramenta ou ao Modo Strike por perda financeira**
- [ ] Alegação de publicidade enganosa ou venda casada
- [ ] Reclamação de perda financeira relevante
- [ ] Aluno em situação financeira grave ou emocionalmente abalado
- [ ] Qualquer coisa que não está neste manual

➡️ **Não responda. Registre tudo. Escale.**

> **Escalar não é falha — é procedimento.** Responder errado num caso vermelho custa muito mais caro que esperar uma hora.

## 📋 O que registrar ao escalar

```
1. O que o aluno perguntou — TEXTO EXATO, copiado
2. Nome, e-mail e plano
3. O que já foi respondido (se algo foi)
4. Qual gatilho vermelho foi acionado
5. Tom da conversa — calmo, irritado, agressivo
```

---
---

# PARTE 12 — 🔴 RESPOSTAS DE ESCALADA

> Use somente quando a conversa **já escalou** e o aluno está atribuindo responsabilidade à empresa.
> **Sempre com aprovação antes de enviar**, se for a primeira vez.

## A estrutura que funciona

```
1. ACOLHER de verdade — sem "mas"
2. EXPLICAR o que aconteceu, com fatos
3. CITAR o que ele aceitou — com delicadeza, nunca como ameaça
4. OFERECER o que a gente pode fazer
```

> **A cláusula entra como informação, nunca como arma.**
> ❌ *"Você assinou o contrato, leia a cláusula 7.8"*
> ✅ *"Quando você aceitou os termos, um dos pontos explicados foi justamente esse..."*

---

## CENÁRIO 1 — "A ferramenta falhou e eu perdi dinheiro. Vocês têm que me ressarcir."

> 🔴 **Escalar antes de responder.** Modelo abaixo para aprovação.

```
[Nome], obrigado por trazer isso, e sinto muito pelo que
aconteceu. Entendo completamente a frustração.

Deixa eu explicar com transparência como funciona.

As ferramentas são desenvolvidas e mantidas por uma empresa
de tecnologia parceira, que é quem responde tecnicamente por
elas. A ProfitX é a escola — a gente ensina o método e dá
acesso às ferramentas, mas não temos acesso à sua conta, ao
seu saldo ou às suas operações.

Quando você aceitou os termos, um dos pontos explicados foi
justamente esse: ferramentas tecnológicas estão sujeitas a
falhas, latência e indisponibilidade, e por isso não existe
garantia de execução ou de acionamento dos limites
configurados. Também está lá que os recursos que você aloca
na corretora não fazem parte do que você contratou aqui.

Não digo isso pra me esquivar — digo pra ser honesto com
você sobre o que eu posso e o que eu não posso fazer.

O que eu POSSO fazer, e vou fazer agora:
• Levar o caso para a equipe técnica da fornecedora e
  acompanhar a apuração
• Revisar com você a configuração dos parâmetros
• Te acompanhar de perto daqui pra frente

Me passa o horário aproximado da ocorrência que eu já
encaminho.
```

📎 *Base: Cláusulas 7.5(e), 7.8, 5.5*

---

## CENÁRIO 2 — "Vocês prometeram que eu ia ganhar"

```
[Nome], entendo a frustração e quero esclarecer isso com
você.

A gente nunca promete resultado — nem pode. Em todo material,
em toda aula e nos termos que você aceitou, está explícito
que os números são projeções e metas, nunca garantia, e que
o mercado envolve risco real, incluindo perda de capital.

Se em algum momento alguma comunicação passou a impressão de
garantia, me manda o print que eu quero ver — isso é sério
pra gente e a gente corrige.

O que a gente entrega é estrutura, método, ferramentas e
acompanhamento. E nisso eu quero muito te ajudar.

Me conta o que aconteceu que eu te ajudo a entender e
ajustar.
```

📎 *Base: Cláusulas 5.1, 5.2, 4.1*

---

## CENÁRIO 3 — "Vocês são responsáveis pela corretora"

```
[Nome], entendo sua situação e vou ser claro com você.

A ProfitX é uma escola de educação em mercado financeiro.
A corretora onde sua conta está é uma empresa
independente — a gente não tem sociedade, não tem acesso às
contas dos alunos e não manda nas regras dela: prazos,
política de saque, taxas, limites. Nada disso passa por nós.

Isso está explicado nos termos que você aceitou, inclusive
que a abertura da conta é um ato seu, com a instituição que
você escolheu, e que você é livre para operar onde quiser.

Não estou dizendo isso pra te deixar sozinho. Estou dizendo
porque eu não conseguiria resolver nem se quisesse — e
prefiro ser honesto a te fazer esperar por algo que não vai
acontecer.

O que eu posso fazer: te ajudar a encontrar o canal certo na
corretora e te orientar no que for do nosso lado. Quer que
eu faça isso?
```

📎 *Base: Cláusulas 1.2, 8.1, 8.2, 8.4*

---

## CENÁRIO 4 — "Quero reembolso, já passou dos 7 dias"

> 🔴 **Escalar.** Não negue direto.

```
[Nome], deixa eu ver o que consigo fazer.

O prazo de arrependimento é de 7 dias corridos, conforme o
CDC e os termos. Fora dele, o reembolso não é automático.

Mas antes de qualquer coisa, quero entender o que motivou o
pedido. Se tiver algo que a gente não entregou como deveria,
isso é outra conversa — e existe um caminho previsto pra
isso nos próprios termos.

Me conta o que aconteceu.
```

📎 *Base: Cláusulas 3.3 e 6.10*

---

## CENÁRIO 5 — "Vou processar / chamar advogado / Procon"

> 🔴 **NUNCA responda sozinho. Escale imediatamente.**

**Resposta provisória, apenas para não deixar sem retorno:**

```
[Nome], recebi sua mensagem e ela já foi encaminhada
internamente para análise.

Vou retornar o quanto antes com uma posição.
```

**Não diga mais nada até a orientação chegar.**

---

## CENÁRIO 6 — "Vocês são golpistas"

> 🔴 **Escalar.** Nunca responder no mesmo tom.

```
[Nome], entendo que você está frustrado, e queria muito
poder te ajudar de verdade.

A ProfitX é uma empresa formal, com CNPJ, contrato registrado
e mais de 8 mil alunos. Tudo que a gente vende está descrito
no que você aceitou, e o reembolso de 7 dias existe
justamente pra você poder testar sem risco.

Me conta exatamente o que aconteceu. Se tem algo que a gente
errou, eu quero saber e quero corrigir.
```

---
---

# PARTE 13 — 🛡️ RECLAME AQUI

> Documento completo: `RA-3-Operacao-Atendimento.md`
> Resumo operacional abaixo.

## A ordem de prioridade
```
1º  Resolver
2º  Negociar
3º  Não deixar escalar
4º  Moderar — só quando não há o que resolver
```

## 🔴 As regras que não podem ser quebradas

1. **Nunca impedir, desestimular ou condicionar** uma reclamação
2. **Nunca pedir remoção de crítica legítima**
3. **Nunca pedir ocultação de nome de empresa, marca ou CNPJ** — é dado público
4. **Nunca expor dado pessoal** em resposta pública
5. **Nunca afirmar que o contrato encerra a responsabilidade** da empresa
6. **Nunca inventar** fato, data ou documento
7. **Nunca citar o nome da corretora** na resposta pública

## Decisão rápida

| O que tem na reclamação | O que fazer |
|---|---|
| Xingamento, "golpista", "roubou", acusação de crime | **Conteúdo Impróprio** — edição do trecho |
| Problema é de corretora | **Responder + AENVDC** após avaliação |
| Nossa falha | **Resolver**, sem moderação |
| Reclamou 2x do mesmo | **Duplicidade** |
| Não é o titular | **Terceiros** |
| Golpista usou nossa marca | **AENVDC** |
| Assunto trabalhista | **Desativação** |
| Ameaça de processo, Procon, CVM | **PARAR. Escalar.** |

## ⚠️ A ordem depende da categoria

| Categoria | Responder antes? | Prazo |
|---|---|---|
| **Outra empresa** (migração) | 🔴 **NÃO** — resposta impede a transferência | 15 dias da publicação |
| **AENVDC** | ✅ SIM, e precisa estar avaliada | 30 dias da avaliação |
| **Conteúdo impróprio** | Indiferente | 30 dias da publicação |

> **Na dúvida, não responda ainda.** Responder cedo demais fecha a porta da migração, e isso não tem volta.

## Template — reclamação sobre corretora

```
Olá [Nome], tudo bem?

Agradecemos por nos procurar e lamentamos que você esteja
passando por essa situação. Queremos muito ajudar no que
estiver ao nosso alcance.

A ProfitX é uma escola de educação em mercado financeiro.
Nosso serviço é ensinar: aulas, material, ferramentas de
análise e acompanhamento pedagógico.

Não somos corretora de valores. Não recebemos depósitos, não
custodiamos recursos, não executamos ordens e não temos
acesso a contas de investimento de alunos. Por isso não
conseguimos localizar depósitos, liberar saques, consultar
saldos ou alterar qualquer operação — não por falta de
vontade, mas porque simplesmente não existe esse acesso do
nosso lado.

Também não temos ingerência sobre regras, prazos, políticas
de saque ou taxas de plataformas de negociação. Essas
condições são definidas por cada instituição.

Quem tem capacidade de apurar e resolver o seu caso é a
instituição onde a sua conta foi aberta.

O que está ao nosso alcance nós já fizemos: [verificamos seu
acesso / confirmamos sua matrícula ativa]. E seguimos à
disposição para qualquer questão sobre o curso, acesso,
conteúdo, suporte ou cancelamento.

Se quiser, podemos ajudar você a identificar o canal correto
para tratar o seu caso.
```

## 🎖️ Acusação de crime — o caminho mais forte

**Gatilhos:** golpista · estelionatário · ladrão · roubou · aplicou golpe

➡️ **Conteúdo Impróprio — edição do trecho** *(não remoção da reclamação)*
➡️ Prazo: 30 dias da publicação · não precisa de avaliação nem resposta anterior
➡️ **Avisar o Robson no mesmo dia** — corre em paralelo

```
Solicitamos edição do trecho "[colar exatamente]", que imputa
diretamente a prática de crime à empresa, em desacordo com as
regras de publicação. Não solicitamos edição da crítica
legítima ao atendimento nem da reclamação.
```

## Limites operacionais

| | |
|---|---|
| Pedidos de moderação | 30 por dia útil |
| Taxa de aceitação exigida | **≥ 90%** |
| Índice de resposta mínimo | **50%** — abaixo disso o RA cancela o contrato |
| RA Fone | retorno em **60 minutos** |

> **Pedir menos e melhor.** Pedido negado hoje encarece os próximos.

---
---

# PARTE 14 — 👤 CLASSIFICAÇÃO DE ALUNO

Quando um aluno gera atrito recorrente, registrar e classificar. Isso orienta como toda a equipe trata dali pra frente.

## 🟢 Normal
Atendimento padrão.

## 🟡 Atenção
**Sinais:** já reclamou mais de uma vez · tom ríspido · insatisfação recorrente sem causa clara · fala de valores altos

**Como tratar:**
- Todo atendimento registrado
- Nada prometido sem confirmar
- Respostas revisadas antes de enviar
- Avisar a gestão

## 🔴 Risco
**Sinais:** ameaçou ação judicial · acusou de golpe · reclamou no RA · pediu ressarcimento de prejuízo · comportamento agressivo

**Como tratar:**
- 🔴 **Nenhuma resposta sem aprovação**
- Todo contato documentado com print
- Nunca prometer nada
- Nunca responder fora do horário ou no impulso
- **A equipe se reúne e alinha a resposta padrão** para esse aluno
- Todo novo contato dele passa pela mesma alçada

> **Aluno em risco não é inimigo.** Ele continua sendo atendido e a gente continua tentando resolver — só que com registro e alinhamento.

---
---

# PARTE 15 — 💬 O TOM

**Sempre:** cordial · direto · humano · honesto
**Nunca:** robótico · defensivo · esquivo · com juridiquês

## A postura em três linhas

**1. Resolver sempre vem primeiro.** Se é nosso, a gente resolve.

**2. Se não é nosso, a gente orienta.** Nunca "não é conosco" — sempre *"quem resolve é X, e eu te ajudo a chegar lá"*.

**3. Nunca prometa o que não pode entregar.** É melhor dizer *"não sei, vou verificar"* do que inventar.

> O aluno lembra muito mais de **como foi tratado** do que da resposta que recebeu.


---
---
---

# PARTE 16 — 📜 CLÁUSULAS DO CONTRATO NA ÍNTEGRA

> Este é o texto completo do **Contrato Método TRIAD v7**, que o aluno aceita antes de liberar as ferramentas.
>
> ⚠️ **Use para consultar e fundamentar — nunca para citar de forma agressiva.** A regra da Parte 12 vale sempre: a cláusula entra como informação, nunca como arma.

---

CLÁUSULA 1 — DO OBJETO

1.1. O presente contrato tem por objeto a prestação, pela ProfitX, de serviços educacionais consistentes no curso Método TRIAD, compreendendo:

a) Conteúdo educacional em vídeo, disponibilizado em área de membros;

b) Materiais de apoio ao aprendizado;

c) Acesso a sessões ao vivo de caráter educacional, na forma da Cláusula 7;

d) Comunidade de alunos;

e) Suporte educacional por meio dos canais oficiais;

f) Validação da condição de aluno ativo para fins de habilitação de acesso às ferramentas de apoio à prática de que trata a Cláusula 7.

1.2. A ProfitX é instituição de ensino livre, dedicada à educação sobre operações em mercados de criptoativos e mercados digitais correlatos. A ProfitX não é instituição financeira, corretora, distribuidora de valores mobiliários, consultora de investimentos, analista de valores mobiliários ou administradora de recursos de terceiros, e nada neste contrato ou no curso deve ser interpretado como oferta de tais serviços.

CLÁUSULA 2 — DA METODOLOGIA DE ENSINO

2.1. O Método TRIAD é ministrado por professores com vivência real de mercado, combinando aulas teóricas e aulas práticas, nas quais são demonstradas, em ambiente real ou simulado, as técnicas objeto do curso.

2.2. O ALUNO declara compreender que as demonstrações práticas — inclusive operações eventualmente realizadas por professores durante sessões ao vivo, em contas próprias — têm finalidade exclusivamente didática, destinando-se à ilustração das técnicas ensinadas, e não constituem recomendação, sugestão ou orientação individual de operação.

2.3. A decisão de operar, replicar, acompanhar ou abster-se é, em qualquer circunstância, exclusiva do ALUNO, que a toma segundo seu próprio juízo, sua realidade financeira e seu gerenciamento de risco.

2.4. A ProfitX orienta expressamente, neste contrato e ao longo das aulas, que o ALUNO jamais destine a operações capital cuja perda comprometa sua subsistência, suas obrigações ou o sustento de sua família.

CLÁUSULA 3 — DO ACESSO INTEGRAL E DA TRANSPARÊNCIA

3.1. Todo o conteúdo do curso é disponibilizado ao ALUNO de forma integral e imediata a partir do primeiro acesso, sem bloqueio, sem liberação progressiva e sem restrição temporal de qualquer natureza.

3.2. O ALUNO pode, antes de tomar qualquer decisão operacional ou financeira adicional, examinar a totalidade do conteúdo, conhecer as ferramentas disponíveis, acompanhar as sessões ao vivo e avaliar, com plena informação, se deseja prosseguir.

3.3. O ALUNO dispõe do prazo de 7 (sete) dias corridos, contados da compra, para exercer o direito de arrependimento e obter reembolso integral, sem justificativa e sem burocracia, nos termos do art. 49 da Lei 8.078/1990. A assinatura deste instrumento não prejudica esse direito.

3.4. A política da ProfitX é de transparência integral: nenhuma informação relevante sobre a estrutura do curso, das ferramentas ou dos riscos é omitida do ALUNO, e os canais de suporte estão disponíveis para esclarecimento de qualquer dúvida antes e depois da assinatura.

CLÁUSULA 4 — DOS RISCOS

4.1. O ALUNO declara, de forma expressa e inequívoca, ter plena ciência de que:

a) O curso versa sobre operações em mercados de risco elevado, caracterizados por volatilidade extrema e variações bruscas e imprevisíveis de preço;

b) Existe possibilidade concreta de perda parcial ou total de qualquer capital destinado a operações nesses mercados;

c) Resultados passados — da ProfitX, de professores, de outros alunos ou de qualquer ferramenta — não constituem garantia, promessa ou indicativo de resultados futuros;

d) Nenhum método, técnica, ferramenta, tecnologia ou profissional é capaz de eliminar o risco inerente a esses mercados;

e) Parte dos ativos e mercados abordados no curso encontra-se em segmento cuja regulamentação no Brasil ainda está em desenvolvimento, sujeitando-se à evolução normativa em curso, sendo responsabilidade do ALUNO acompanhar as regras aplicáveis à sua situação.

4.2. O ALUNO declara que, caso decida operar, o fará exclusivamente com capital de risco — assim entendidos os recursos cuja perda total não comprometerá sua estabilidade financeira, sua subsistência ou a de sua família — e declara, sob as penas da lei, que tais recursos NÃO serão provenientes de: (i) empréstimos, financiamentos ou qualquer modalidade de crédito; (ii) reserva de emergência; (iii) renda essencial à subsistência própria ou familiar; (iv) recursos de terceiros; (v) valores destinados ao cumprimento de obrigações alimentares, fiscais ou contratuais. O ALUNO reconhece como exclusivamente sua a responsabilidade por eventual destinação de capital em desacordo com esta declaração, isentando a ProfitX de qualquer responsabilidade decorrente.

4.3. O ALUNO declara ciência da recomendação expressa da ProfitX de que estude integralmente o conteúdo sobre gerenciamento de risco disponível na área de membros antes de realizar qualquer operação.

CLÁUSULA 5 — DA AUSÊNCIA DE GARANTIA E DE CONSULTORIA

5.1. A ProfitX não garante, não promete e não assegura qualquer resultado, retorno, rentabilidade, desempenho ou êxito, de qualquer natureza, decorrente da aplicação do que é ensinado.

5.2. O conteúdo do curso, as demonstrações práticas, as sessões ao vivo e as sinalizações geradas por ferramentas não constituem recomendação personalizada de compra, venda ou manutenção de qualquer ativo, tampouco consultoria de investimentos, análise de valores mobiliários ou gestão de carteira.

5.3. Os professores e demais profissionais vinculados à ProfitX operam contas próprias, com capital próprio. Eventuais resultados por eles obtidos refletem circunstâncias próprias e não são indicativos dos resultados do ALUNO.

5.4. Nenhum integrante da ProfitX está autorizado a prometer resultado, garantir retorno ou prestar recomendação individual de operação. Caso o ALUNO receba comunicação nesse sentido, deverá reportá-la imediatamente aos canais oficiais de suporte.

5.5. DA DELIMITAÇÃO DO OBJETO. O objeto deste contrato é a prestação de serviço educacional e a disponibilização de acesso às ferramentas descritas na Cláusula 7. Os recursos que o ALUNO venha a alocar em conta de negociação de sua titularidade NÃO INTEGRAM O OBJETO CONTRATUAL, não sendo a ProfitX parte da relação estabelecida entre o ALUNO e a plataforma de negociação, nem detendo qualquer ingerência sobre o capital nela mantido, sobre as operações nela realizadas ou sobre seus resultados.

5.6. Eventual responsabilidade da ProfitX perante o ALUNO, de qualquer natureza, limita-se ao valor efetivamente pago pelo ALUNO pelo curso contratado, ressalvadas as hipóteses de dolo ou culpa grave da ProfitX na prestação do serviço educacional ou na disponibilização de acesso às ferramentas descritas na Cláusula 7.

CLÁUSULA 6 — DOS PLANOS

6.1. O curso é oferecido em diferentes planos, cuja distinção reside na dimensão da estrutura educacional e de suporte colocada à disposição do ALUNO — incluindo a quantidade de sessões ao vivo acessíveis, o volume de sinalizações educacionais disponíveis, a capacidade de acompanhamento simultâneo e a intensidade do suporte prestado.

6.2. Planos de maior capacidade demandam da ProfitX maior estrutura de atendimento, acompanhamento e dedicação, o que justifica a diferença de valores entre eles.

6.3. O valor pago pelo ALUNO, em qualquer plano, remunera exclusivamente os serviços educacionais e de suporte prestados pela ProfitX. Nenhuma parcela desse valor constitui pagamento por ferramenta, tecnologia ou serviço de terceiro.

6.4. A habilitação de acesso às ferramentas de que trata a Cláusula 7 acompanha a dimensão do plano contratado, por razão operacional: o suporte e o acompanhamento educacional prestados pela ProfitX são proporcionais à capacidade de uso disponibilizada.

6.5. O ALUNO declara que os meios de pagamento utilizados na contratação são de sua titularidade ou foram utilizados com autorização expressa do respectivo titular, responsabilizando-se integralmente por esse uso.

6.6. O ALUNO reconhece que: (i) o acesso integral e imediato ao conteúdo (Cláusula 3.1) caracteriza a entrega e a disponibilização plena do serviço contratado; (ii) os registros de acesso à plataforma, o consumo de conteúdo, os aceites eletrônicos, a assinatura deste instrumento e os documentos fiscais emitidos constituem prova da contratação, da entrega e da utilização do serviço; (iii) eventual pedido de cancelamento ou reembolso deve ser formalizado pelos canais oficiais de suporte, na forma da Cláusula 3.3.

6.7. O ALUNO compromete-se a buscar a solução de qualquer controvérsia relativa à cobrança pelos canais oficiais da ProfitX previamente à abertura de contestação junto à instituição financeira, adquirente ou bandeira (chargeback). A contestação de pagamento apresentada após o acesso ao conteúdo e sem prévia tentativa de resolução — em especial sob alegação de desconhecimento da compra ou de fraude, em contradição com as declarações, a assinatura e os registros de que trata este instrumento — poderá caracterizar má-fé, autorizando a ProfitX a: (i) suspender ou encerrar o acesso, na forma da Cláusula 15.3; (ii) apresentar este instrumento, os registros de acesso e os documentos fiscais às instituições envolvidas na disputa; (iii) exigir o ressarcimento dos valores estornados e dos custos correspondentes, pelas vias cabíveis.

6.8. DAS OBRIGAÇÕES DA PROFITX. Em contrapartida à contratação, a ProfitX obriga-se perante o ALUNO a:

a) Manter o conteúdo educacional contratado acessível ao ALUNO durante todo o prazo do plano, de forma integral e sem bloqueio por etapa, tempo ou condição;

b) Manter canal oficial de suporte ativo, com resposta em até 1 (um) dia útil. Quando a solução depender de fatores técnicos alheios ao controle da ProfitX — como integrações, atualizações ou plataformas de terceiros — o prazo de resolução poderá ser maior, comprometendo-se a ProfitX a manter o ALUNO informado e a buscar a compensação de eventual falha, na forma da Cláusula 6.10;

c) Comunicar ao ALUNO, com antecedência razoável, alterações relevantes que a própria ProfitX promova na estrutura do curso, nas ferramentas de que trata a Cláusula 7 ou na indicação de plataformas de terceiros. Alterações promovidas pelas próprias plataformas de terceiros, sobre as quais a ProfitX não detém controle nem conhecimento prévio, não integram esta obrigação;

d) Assegurar ao ALUNO o acesso às ferramentas previstas em seu plano, nos limites da Cláusula 7, ou sua substituição por equivalente funcional na forma da Cláusula 7.9;

e) Disponibilizar ao ALUNO as atualizações e os novos conteúdos que venham a integrar o curso, nos limites do plano contratado, sem custo adicional.

6.9. As obrigações da ProfitX limitam-se à entrega do conteúdo, à manutenção do acesso e à prestação do suporte, nos termos da Cláusula

6.8. A ProfitX não assume qualquer obrigação quanto aos resultados financeiros do ALUNO, que dependem exclusivamente de fatores alheios ao seu controle e seguem o regime das Cláusulas 4 e 5. Quanto ao aproveitamento educacional, a ProfitX compromete-se apenas a empregar seus melhores esforços no acompanhamento do ALUNO.

6.10. Caso o serviço não seja prestado conforme contratado, o ALUNO notificará a ProfitX pelos canais oficiais de suporte, que disporá de 30 (trinta) dias para saná-lo. Não sanado no prazo, o ALUNO fará jus, à sua escolha: (i) ao reembolso proporcional ao período não usufruído; ou (ii) de comum acordo, à compensação mediante produto, serviço, extensão de acesso ou upgrade de plano de valor equivalente. Esse direito independe do prazo de arrependimento da Cláusula 3.3.

6.11. O disposto nas Cláusulas 6.8 a 6.10 não alcança indisponibilidades ou alterações de plataformas de terceiros, as falhas técnicas de que trata a Cláusula 7.8, nem os resultados de operações, que seguem o regime próprio deste contrato.

CLÁUSULA 7 — DAS FERRAMENTAS DE APOIO À PRÁTICA

7.1. Na aplicação prática do método ensinado, a ProfitX e seus professores utilizam, em suas próprias operações e em suas demonstrações didáticas, ferramentas tecnológicas de apoio, compreendendo as seguintes categorias:

a) Sistemas de inteligência artificial de análise de mercado, geradores de sinalizações técnicas de tendência;

b) Infraestrutura de replicação automatizada de operações (copy trading), integrada a plataformas de negociação;

c) Sessões ao vivo de análise e demonstração conduzidas por profissionais de mercado;

d) Ferramentas de automação de execução, que executam ordens na conta do próprio ALUNO exclusivamente a partir de parâmetros por ele previamente definidos;

e) Outras ferramentas tecnológicas de apoio à prática, de natureza análoga às anteriores, que venham a ser desenvolvidas ou disponibilizadas ao longo da vigência deste contrato.

7.2. As ferramentas descritas nas alíneas "a", "b", "d" e "e" são desenvolvidas, operadas e mantidas por empresa de tecnologia especializada, sediada no exterior (doravante, FORNECEDORA), responsável exclusiva pelo seu funcionamento, disponibilidade, desempenho e suporte técnico, nos termos de uso por ela estabelecidos. A FORNECEDORA é selecionada pela ProfitX segundo critérios próprios de qualidade de serviço, capacidade operacional e validação de mercado, podendo ser substituída na forma da Cláusula 7.9. A identificação completa da FORNECEDORA — razão social, jurisdição de constituição e endereço eletrônico oficial — é apresentada ao ALUNO na área de membros e, novamente, no momento do cadastro na plataforma da FORNECEDORA, previamente à aceitação dos termos desta.

7.3. A ProfitX atua, em relação às ferramentas, exclusivamente na condição de instituição educacional: ensina o método, demonstra didaticamente o uso das ferramentas em aulas e sessões ao vivo, orienta o ALUNO quanto às boas práticas de utilização e valida, perante a FORNECEDORA, a condição de aluno ativo, para fins de habilitação de acesso. A relação técnica de uso das ferramentas estabelece-se diretamente entre o ALUNO e a FORNECEDORA, mediante cadastro realizado pelo próprio ALUNO na plataforma da FORNECEDORA e aceitação dos termos de uso desta.

7.4. O uso das ferramentas é integralmente facultativo. O ALUNO que optar por não utilizá-las não sofrerá qualquer prejuízo em seu acesso ao curso, podendo aplicar o método de forma manual e independente, na plataforma de sua escolha.

7.5. Quanto ao funcionamento das ferramentas, o ALUNO declara ciência de que:

a) Ferramentas de replicação automatizada apenas espelham tecnicamente, na conta do próprio ALUNO, operações realizadas por profissionais em contas próprias; a ativação é ato voluntário e exclusivo do ALUNO, que pode desativá-la a qualquer momento, sem penalidade, custo ou justificativa;

b) Os recursos do ALUNO permanecem, em qualquer hipótese, em conta de sua exclusiva titularidade, jamais sendo transferidos, custodiados, geridos ou administrados pela ProfitX, pela FORNECEDORA ou por quem quer que seja;

c) Sinalizações geradas por sistemas de inteligência artificial constituem referência técnica de caráter geral e coletivo, não personalizada, cabendo exclusivamente ao ALUNO a decisão de operar, o momento, o valor e a estratégia;

d) Não há garantia de acerto, disponibilidade ininterrupta ou desempenho de qualquer ferramenta;

e) A responsabilidade pelo funcionamento, pela disponibilidade e pelo desempenho técnico das ferramentas é da FORNECEDORA, nos termos por ela estabelecidos;

f) Ferramentas de automação de execução atuam exclusivamente como meio técnico de execução de ordens, sem qualquer discricionariedade: todos os parâmetros — ativos, valores destinados a cada operação, limites de ganho e de perda, horários e condições de acionamento — são definidos exclusiva e previamente pelo próprio ALUNO, que pode alterá-los, suspendê-los ou revogá-los a qualquer momento;

g) Nenhuma ferramenta disponibilizada realiza análise de perfil de investidor, recomendação personalizada, consultoria, gestão ou administração de carteira, limitando-se a funções técnicas de análise geral, replicação ou execução conforme parâmetros do próprio ALUNO.

7.6. DO USO CORRETO DAS FERRAMENTAS. O ALUNO é exclusiva e integralmente responsável pelo uso que fizer das ferramentas, incluindo, sem limitação: a configuração de parâmetros; a definição de valores destinados a operações; a ativação e desativação de funcionalidades; a observância dos tutoriais, aulas e orientações didáticas disponibilizadas pela ProfitX; e a leitura dos termos e instruções da FORNECEDORA. A utilização das ferramentas em desacordo com as orientações educacionais disponibilizadas — inclusive configuração incorreta, valores incompatíveis com o gerenciamento de risco ensinado, ativação sem estudo prévio do conteúdo, ou uso de funcionalidades não abordadas no curso — é de responsabilidade exclusiva do ALUNO, não gerando qualquer dever de indenizar por parte da ProfitX.

7.7. DA INTEGRAÇÃO TÉCNICA E DAS CREDENCIAIS DE ACESSO. Quando a utilização de determinada ferramenta depender de integração técnica com a conta de negociação do ALUNO, este declara ciência de que:

a) A integração é realizada mediante credenciais, chaves de acesso ou autorizações geradas pelo próprio ALUNO em sua plataforma de negociação, sob sua exclusiva responsabilidade;

b) É responsabilidade do ALUNO configurar as permissões da integração de forma restrita à finalidade de execução de ordens, não concedendo permissão de saque, transferência ou qualquer movimentação de recursos;

c) O ALUNO pode revogar a integração a qualquer momento, diretamente em sua plataforma de negociação, sem necessidade de justificativa;

d) É responsabilidade do ALUNO verificar previamente, nos termos de sua plataforma de negociação, a permissão e as condições para uso de integrações automatizadas;

e) A guarda, o tratamento e a segurança das credenciais ou chaves de acesso são de responsabilidade da FORNECEDORA, nos termos por ela estabelecidos e observada a legislação de proteção de dados aplicável;

f) Em nenhuma hipótese a ProfitX solicita, recebe, armazena ou tem acesso a senhas, credenciais ou chaves de acesso do ALUNO.

7.8. DAS FALHAS E LIMITAÇÕES TÉCNICAS. O ALUNO declara ciência de que ferramentas tecnológicas estão sujeitas a falhas, indisponibilidades, latência, erros de execução, interrupções de conectividade e instabilidades das plataformas e serviços de terceiros dos quais dependem, e reconhece expressamente que:

a) Não há garantia de execução, de tempestividade na execução ou de acionamento de limites configurados;

b) Falhas, atrasos, execuções parciais ou indisponibilidades podem ocorrer e podem resultar em prejuízo financeiro;

c) A responsabilidade técnica pelo funcionamento das ferramentas é da FORNECEDORA, nos limites dos termos por ela estabelecidos, não respondendo a ProfitX por falhas de natureza técnica;

d) É recomendável ao ALUNO acompanhar periodicamente sua conta e suas operações, realizar testes com valores reduzidos antes da utilização plena de qualquer ferramenta, e não se valer exclusivamente do funcionamento automatizado.

7.9. A relação de ferramentas disponíveis e suas condições de uso constam da área de membros e podem ser atualizadas ao longo do tempo — por evolução tecnológica, substituição ou descontinuidade — assegurada a comunicação ao ALUNO. Caso ferramenta essencial ao plano contratado seja definitivamente descontinuada sem substituição funcional equivalente, o ALUNO poderá optar pelo reembolso proporcional ao período não usufruído do plano.

7.10. O ALUNO declara ciência de que a FORNECEDORA e/ou os profissionais cujas operações são replicadas podem ser remunerados pela plataforma de negociação mediante percentual incidente exclusivamente sobre resultados positivos das operações replicadas, conforme modelo divulgado nos termos da própria FORNECEDORA. Tal remuneração não incide sobre perdas, não representa custo adicional ao ALUNO, não reduz os resultados líquidos por ele auferidos e não é percebida pela ProfitX, cuja receita decorre exclusivamente dos planos educacionais, na forma da Cláusula 6.3.

CLÁUSULA 8 — DAS PLATAFORMAS DE NEGOCIAÇÃO (CORRETORAS)

8.1. A eventual abertura de conta em plataforma de negociação é ato voluntário do ALUNO, celebrado diretamente entre ele e a instituição escolhida, regido pelos termos daquela instituição.

8.2. O ALUNO é livre para operar na plataforma que desejar, dentre as que disponibilizem os mercados compatíveis com o método ensinado.

8.3. Por transparência didática, as aulas apresentam as plataformas em que a ProfitX e sua equipe efetivamente operam — escolhidas por critérios próprios de confiança e integração com as ferramentas. Tal apresentação tem caráter informativo, não constituindo indicação, recomendação ou garantia quanto a essas instituições.

8.4. O ALUNO declara ciência de que:

a) A ProfitX não possui vínculo societário, exclusividade ou relação de captação com qualquer plataforma de negociação;

b) A ProfitX não tem controle ou ingerência sobre regras, prazos, políticas de saque, requisitos operacionais, taxas ou quaisquer condições estabelecidas pelas plataformas;

c) As plataformas em que a ProfitX opera podem ser alteradas a qualquer tempo, hipótese em que os materiais do curso serão atualizados;

d) Plataformas estrangeiras submetem-se à regulação de suas próprias jurisdições, não sendo supervisionadas por autoridades brasileiras;

e) Riscos operacionais, de crédito, de liquidez ou de descontinuidade de qualquer plataforma não são de responsabilidade da ProfitX.

f) A plataforma de negociação pode disponibilizar, em seu próprio ambiente, copy traders, perfis, robôs ou estratégias de terceiros sem qualquer vínculo com a ProfitX ou com o método ensinado. A decisão de seguir, copiar ou replicar qualquer estratégia disponível na plataforma é exclusiva do ALUNO, tomada por sua conta e risco, não possuindo a ProfitX responsabilidade, ingerência, controle ou conhecimento sobre tais terceiros, seus resultados ou sua conduta.

8.5. É dever exclusivo do ALUNO, antes de realizar qualquer depósito ou de aderir a qualquer promoção, ler, compreender e aceitar integralmente os termos da plataforma escolhida — incluindo, sem limitação, regras de saque, requisitos de volume operacional mínimo (rollover), condições e prazos de campanhas promocionais, taxas e procedimentos de verificação. O ALUNO declara ciência de que plataformas de negociação usualmente condicionam saques ao cumprimento de requisitos de volume operado, inclusive como medida de prevenção à lavagem de dinheiro, e que o descumprimento de tais requisitos pelo ALUNO — inclusive por não leitura das regras — não gera qualquer responsabilidade ou dever de intervenção da ProfitX.

CLÁUSULA 9 — DOS CANAIS DE COMUNICAÇÃO E DA COMUNIDADE

9.1. A ProfitX mantém canais internos de comunicação destinados exclusivamente a alunos ativos.

9.2. O ALUNO declara ciência e concorda que, em tais canais:

a) A comunicação utiliza linguagem direta e dinâmica, podendo conter elementos de urgência, escassez e mobilização típicos de comunidades de prática;

b) Eventuais menções a resultados são apresentadas como faixas de expectativa, jamais como promessa ou garantia, e não vinculam a ProfitX a qualquer desempenho;

c) Os canais têm função informativa e comunitária; esclarecimentos individuais devem ser buscados nos canais oficiais de suporte.

9.3. O ALUNO pode retirar-se dos canais a qualquer momento, sem prejuízo do acesso ao curso.

9.4. As regras de conduta da comunidade constam do Termo de Uso da Área de Membros, apresentado ao ALUNO no primeiro acesso à plataforma de ensino — cujo aceite é condição para o acesso ao conteúdo — e que o ALUNO declara ter lido e aceitado previamente à assinatura deste instrumento.

9.5. Ao participar de sessões ao vivo, aulas, gravações ou ambientes interativos, o ALUNO autoriza, gratuitamente, a utilização pela ProfitX de imagens, gravações de tela e registros dessas participações — ainda que sua conta, nome de usuário ou operações apareçam de forma incidental — exclusivamente para fins educacionais, demonstrativos e de divulgação institucional, comprometendo-se a ProfitX a adotar medidas razoáveis para minimizar a identificação direta do ALUNO sempre que possível.

CLÁUSULA 10 — DOS PROGRAMAS PROMOCIONAIS DE PLATAFORMAS ("ALAVANCAGENS")

10.1. Plataformas de negociação podem, por iniciativa própria e a seu exclusivo critério, ofertar a seus clientes programas promocionais de caráter operacional, usualmente denominados "alavancagens" ou "dinâmicas" — campanhas em que a plataforma disponibiliza condições especiais de operação, podendo incluir metas operacionais, benefícios e mecanismos de proteção de banca por ela custeados.

10.2. O ALUNO declara ciência de que tais programas, quando existentes:

a) São ofertados, geridos e custeados pela respectiva plataforma, e não pela ProfitX, que não é parte na relação promocional;

b) São disponibilizados sem periodicidade fixa ou previsível, a critério exclusivo da plataforma, não havendo qualquer compromisso quanto à sua ocorrência, frequência ou continuidade;

c) Têm participação facultativa, formalizada diretamente pelo ALUNO junto à equipe da plataforma e/ou da FORNECEDORA responsável pela operacionalização do programa — incluindo o envio, pelo ALUNO, de comprovantes e informações de adesão a essa equipe —, sem intermediação da ProfitX;

d) Envolvem aportes realizados exclusivamente na conta do próprio ALUNO na plataforma — jamais em contas da ProfitX, de seus sócios, de sua equipe ou de terceiros por ela indicados;

e) Executam-se, quando aplicável, por meio das ferramentas de que trata a Cláusula 7, mediante ativação voluntária pelo ALUNO;

f) Trabalham eventuais metas como faixas de busca, sem percentual fixo garantido e sem prazo determinado de conclusão;

g) Sujeitam-se, quanto a eventuais mecanismos de proteção ou cobertura de banca, aos limites e condições estabelecidos pela própria plataforma em seus termos;

h) Não geram, para a ProfitX, qualquer obrigação de resultado, garantia ou responsabilidade;

i) Eventuais faixas de meta diferenciadas conforme o volume aportado decorrem exclusivamente do dimensionamento operacional das posições — bancas maiores comportam entradas e margens operacionais maiores — e não constituem promessa de resultado proporcional nem garantia de qualquer natureza.

10.3. A comunicação sobre a existência e as condições de tais programas ocorre por meio do canal de comunicação de que trata a Cláusula 9, cujo acesso é disponibilizado ao ALUNO na forma da Cláusula 10.4. O ALUNO declara ciência de que, nesse canal, a comunicação é direta e dinâmica, podendo mencionar valores, metas e faixas — sempre como expectativa, jamais como garantia — e que ser impactado por tais comunicações é opção sua, exercida pela permanência no canal. O ALUNO declara ainda ciência de que a ProfitX poderá, em seus canais, divulgar a existência de tais programas, comentá-los e mobilizar a comunidade para o seu aproveitamento, na qualidade de veículo de comunicação — sem que isso caracterize oferta própria, corresponsabilidade pelo programa, garantia de resultado ou recomendação individualizada de participação —, permanecendo a decisão de participar, em qualquer hipótese, exclusiva do ALUNO e formalizada diretamente com a plataforma e/ou a FORNECEDORA, na forma da Cláusula 10.2.

10.4. O acesso ao canal é disponibilizado ao ALUNO após a assinatura deste contrato, na aula que detalha o funcionamento dos programas, seus riscos e suas condições. A decisão de ingressar no canal, de nele permanecer e de participar de qualquer programa é, em todas as etapas, exclusiva do ALUNO.

10.5. Se, em qualquer momento, alguém solicitar ao ALUNO depósito ou transferência para conta de pessoa física ou de empresa que não seja a conta do próprio ALUNO na plataforma, trata-se de fraude, devendo o fato ser imediatamente reportado aos canais oficiais.

10.6. Os programas promocionais de que trata esta cláusula podem assumir formatos diversos definidos pela plataforma e/ou pela FORNECEDORA — incluindo dinâmicas por faixas de participação e competições entre profissionais de mercado ("batalhas de traders") — nos quais perfis de profissionais, inclusive professores da ProfitX operando contas próprias, podem ser disponibilizados para replicação por meio do produto de copy trading da própria plataforma. A adesão do ALUNO a qualquer formato é voluntária, realizada diretamente na plataforma, sujeita aos termos desta, e regida integralmente pelo disposto nas Cláusulas 10.2 a

10.5. Eventuais faixas diferenciadas de participação refletem a capacidade operacional do plano contratado, na forma da Cláusula 6, definidas e aplicadas pela plataforma e/ou pela FORNECEDORA segundo seus próprios critérios.

10.7. O ALUNO declara plena ciência de que os programas promocionais de que trata esta cláusula NÃO constituem produto, serviço, oferta ou componente de qualquer plano da ProfitX, não integram o objeto deste contrato e não foram considerados na formação do preço dos planos. Constituem, quando existentes, benefício promocional de terceiros e oportunidade de mercado de adesão facultativa. A não participação do ALUNO em qualquer programa — por escolha própria, por indisponibilidade do programa ou por qualquer outra razão — não gera qualquer prejuízo ao seu acesso ao curso, às ferramentas ou aos canais, nem direito a abatimento, compensação ou reembolso.

CLÁUSULA 11 — DA RESPONSABILIDADE FISCAL

11.1. Resultados obtidos em conta mantida em instituição estrangeira podem gerar, para o ALUNO, obrigações fiscais e declaratórias perante as autoridades brasileiras — incluindo, sem limitação, declaração de bens e valores no exterior e apuração de tributo sobre ganho de capital.

11.2. O cumprimento de tais obrigações é de responsabilidade exclusiva do ALUNO. A ProfitX não presta consultoria fiscal, contábil ou tributária, e recomenda a consulta a profissional habilitado.

CLÁUSULA 12 — DO TRATAMENTO DE DADOS PESSOAIS

12.1. A habilitação do ALUNO às ferramentas ocorre da seguinte forma: o próprio ALUNO realiza seu cadastro na plataforma da FORNECEDORA, fornecendo seus dados diretamente a ela, sob os termos de uso e a política de privacidade desta; em seguida, a ProfitX valida, no ambiente da FORNECEDORA, a condição de aluno ativo e o plano contratado, vinculados ao endereço eletrônico utilizado no cadastro. A única informação transmitida pela ProfitX à FORNECEDORA é a confirmação dessa condição e do respectivo plano, tratamento realizado com fundamento na execução do presente contrato (art. 7º, V, da Lei 13.709/2018).

12.1.1. A ProfitX não compartilha dados do ALUNO com plataformas de negociação; a eventual abertura de conta em plataforma é ato direto do ALUNO junto à instituição escolhida, que coleta seus dados diretamente, sob seus próprios termos.

12.2. A finalidade da confirmação descrita na Cláusula 12.1 é estritamente operacional: viabilizar a habilitação do ALUNO junto à FORNECEDORA. Nenhum outro dado do ALUNO é transmitido pela ProfitX à FORNECEDORA.

12.3. O ALUNO declara ciência de que a FORNECEDORA está sediada no exterior e de que a confirmação descrita na Cláusula 12.1 configura transferência internacional de dados, realizada nos termos do art. 33 da Lei 13.709/2018, restrita à finalidade operacional ali prevista.

12.4. O ALUNO pode, a qualquer tempo, solicitar informações sobre o tratamento de seus dados pela ProfitX ou requerer o encerramento de sua habilitação perante a FORNECEDORA — hipótese em que a validação será desfeita, preservado o acesso ao conteúdo educacional. Solicitações relativas aos dados fornecidos pelo ALUNO diretamente à FORNECEDORA devem ser dirigidas a esta, nos canais indicados nos termos dela.

12.5. Os dados são conservados pelo prazo necessário ao cumprimento de obrigações legais e ao exercício regular de direitos. Solicitações relativas a dados pessoais devem ser dirigidas ao canal oficial de suporte da ProfitX.

12.6. O ALUNO declara ciência de que a ProfitX poderá apresentar seus dados cadastrais, os registros de acesso, este instrumento e os documentos da contratação a instituições de pagamento, adquirentes, bandeiras e bancos emissores, estritamente para fins de comprovação da contratação e defesa em disputas de pagamento, com fundamento no exercício regular de direitos (art. 7º, VI e IX, da Lei 13.709/2018).

CLÁUSULA 13 — DA LIBERAÇÃO CONDICIONADA À ASSINATURA

13.1. A assinatura do presente instrumento é condição para as seguintes liberações, que dela dependem por pressuporem as ciências, declarações e concordâncias aqui formalizadas — em especial quanto aos riscos (Cláusula 4), à responsabilidade exclusiva do ALUNO por suas decisões e pelo uso das ferramentas (Cláusulas 2.3 e 7.6) e à natureza das comunicações veiculadas nos canais (Cláusulas 9 e 10):

a) Validação da condição de aluno ativo perante a FORNECEDORA, para fins de habilitação de acesso às ferramentas de que trata a Cláusula 7;

b) Ingresso nos canais de comunicação e comunidades de alunos de que tratam as Cláusulas 9 e 10, nos quais o ALUNO será impactado por comunicação ativa, direta e dinâmica — incluindo divulgação de programas promocionais de plataformas, menções a valores, metas, faixas de expectativa e resultados de mercado, na forma das Cláusulas 9.2 e 10.3.

13.2. Formalizada a assinatura, a ProfitX providenciará as validações e liberações descritas, comunicando o ALUNO pelos canais oficiais.

13.3. A não assinatura deste instrumento NÃO gera qualquer prejuízo ao ALUNO: o acesso ao conteúdo educacional permanece integral, na forma da Cláusula 3, sem penalidade, redução de acesso, cobrança adicional ou tratamento diferenciado. O ALUNO que preferir não obter as liberações descritas na Cláusula 13.1 basta informar sua opção à equipe pelos canais oficiais de suporte, dando continuidade normal ao curso sem as referidas liberações, podendo, ainda, requerê-las posteriormente, a qualquer tempo, mediante assinatura deste instrumento.

13.4. O ALUNO declara compreender que as liberações aqui tratadas constituem faculdades, e não obrigações: habilitado, o ALUNO decide livremente se, quando e como utilizará as ferramentas e se ingressará ou permanecerá no canal.

13.5. As liberações de que trata esta cláusula são pessoais e intransferíveis, condicionadas à correspondência de identidade entre o signatário deste instrumento, o titular do cadastro realizado perante a FORNECEDORA e o titular da conta de negociação utilizada nas operações. Identificada divergência entre tais identidades, a ProfitX poderá suspender as liberações até a regularização cadastral e, constatada má-fé, encerrar o acesso na forma da Cláusula 15.3 — permanecendo eficazes, em qualquer hipótese, as declarações e concordâncias prestadas por quem assinou este instrumento. O ALUNO declara ciência de que a ProfitX não realiza verificação documental de identidade (KYC), confiando nas declarações prestadas sob as penas da lei neste instrumento; eventuais procedimentos de verificação adotados por terceiros regem-se exclusivamente pelos termos destes.

CLÁUSULA 14 — DAS DECLARAÇÕES DO ALUNO

14.1. O ALUNO declara, sob as penas da lei, que:

a) É maior de 18 anos e plenamente capaz para os atos da vida civil;

b) Reside no Brasil, ou, residindo no exterior, verificou por conta própria a compatibilidade do uso do curso e das ferramentas com as normas de sua jurisdição;

c) Não é pessoa politicamente exposta, nos termos da regulamentação aplicável — ou, sendo, comunicará essa condição aos canais de suporte;

d) Eventuais recursos que venha a destinar a operações possuem origem lícita;

e) Não figura em listas de sanções nacionais ou internacionais;

f) As informações prestadas neste instrumento são verdadeiras e atuais;

g) É a pessoa que efetivamente utilizará as liberações de que trata a Cláusula 13 — em especial as ferramentas de replicação e de automação de execução —, realizando pessoalmente o cadastro perante a FORNECEDORA e as operações em conta de negociação de sua própria titularidade, sendo seus — e não de terceiros — os dados informados no ato da assinatura eletrônica deste instrumento;

h) Utilizará as ferramentas e participará dos canais exclusivamente em nome próprio, mediante cadastro e conta de negociação de sua própria titularidade, comprometendo-se a não assinar este instrumento em nome ou no interesse de terceiro, a não ceder suas liberações a terceiros e a não operar por meio de conta de terceiro;

i) Não compartilhará, cederá ou emprestará a terceiros seus acessos à área de membros, às ferramentas ou aos canais, sob pena de encerramento na forma da Cláusula 15.3;

j) Compromete-se a ler os termos e regras de qualquer plataforma de negociação antes de nela depositar recursos ou aderir a promoções, reconhecendo que o descumprimento de regras operacionais da plataforma é de sua exclusiva responsabilidade;

k) Leu integralmente este contrato, compreendeu seu conteúdo, teve oportunidade de esclarecer dúvidas pelos canais de suporte e o assina de forma livre, informada e consciente.

CLÁUSULA 15 — DA VIGÊNCIA E DO ENCERRAMENTO

15.1. Este contrato vigora pelo prazo de acesso ao curso indicado na oferta do plano contratado, informado ao ALUNO no ato da compra e disponível na área de membros.

15.2. Alterações que afetem materialmente o objeto ou o preço serão comunicadas ao ALUNO com antecedência mínima de 30 (trinta) dias. O ALUNO poderá, nesse prazo, manifestar discordância e requerer o encerramento da relação, com reembolso proporcional ao período não usufruído.

15.3. A ProfitX poderá encerrar o acesso do ALUNO, sem reembolso, nas hipóteses de descumprimento previstas neste contrato e no Termo de Uso da Área de Membros aceito pelo ALUNO no acesso à plataforma — assegurado, em qualquer caso, o direito previsto na Cláusula 3.3.

CLÁUSULA 16 — DAS DISPOSIÇÕES FINAIS

16.1. A eventual invalidade de qualquer disposição não afeta as demais, que permanecem íntegras.

16.2. Este instrumento é firmado por assinatura eletrônica, com validade jurídica fundada na Medida Provisória 2.200-2/2001, na Lei 14.063/2020 e nos arts. 104, 107 e 225 do Código Civil.

16.3. O registro eletrônico da assinatura — data, hora, endereço IP, dispositivo utilizado e dados informados pelo signatário — integra este instrumento para todos os fins probatórios.

16.4. Este contrato e o Termo de Uso da Área de Membros compõem o conjunto contratual da relação entre as partes, interpretando-se harmonicamente.

16.5. As partes buscarão, previamente, a solução amigável de eventuais controvérsias por meio dos canais oficiais de suporte da ProfitX.

16.6. Fica eleito o foro da comarca de Curitiba, Estado do Paraná, ressalvado o direito do consumidor de optar pelo foro de seu próprio domicílio.

Assinado eletronicamente por:

{{NOME COMPLETO}} · CPF {{CPF}} · {{EMAIL}} · {{TELEFONE}}

Data, hora, endereço IP e dados do dispositivo são registrados automaticamente pela plataforma de assinatura eletrônica e integram este instrumento.
$manual$
from products where slug = 'profitx';
