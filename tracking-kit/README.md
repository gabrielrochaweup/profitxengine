# Tracking Kit

Rastreamento de funil ponta a ponta: do clique no anúncio até o dinheiro entrar. Extraído do ENGINE (PROFITX) e reescrito pra servir qualquer produto.

Responde as perguntas que um painel de anúncio não responde:

- quantas **pessoas** entraram, e quantas chegaram em cada etapa;
- **de onde** vieram as que converteram — origem, campanha;
- **onde** está a maior queda do funil;
- quanto entrou, por origem.

---

## O que mudou em relação ao original

Não é um copiar e colar. Quatro coisas foram refeitas pra isso servir a outro produto:

**1. As etapas do funil viraram configuração.** No original, `event_type` era um `CHECK` no Postgres com a lista de etapas dentro — e essa constraint foi alterada três vezes em dois meses, porque toda etapa nova ("contrato assinado", "cadastro na ferramenta") era uma migration, mais uma coluna no relatório, mais um rótulo no cliente. Aqui etapa é uma linha em `tracking.config.ts`.

**2. O relatório ficou estreito.** Era uma tabela larga, com uma coluna por etapa, montada num `UNION ALL` que casava colunas **por posição** — uma coluna fora de ordem colocava o número de contratos dentro de outro indicador, sem erro de sintaxe pra denunciar. Agora é uma linha por `(origem, campanha, etapa)` e a tela pivota.

**3. Cinco tipos de adapter viraram um.** Havia contrato separado pra checkout, área de membros, contrato, ferramenta e corretora — cada um com sua rota, quase idênticas. Agora o adapter diz qual etapa o payload representa, e uma rota só atende todas as origens.

**4. Nada de nome de negócio.** Não existe "corretora", "aluno", "plano", "Pepe". Existe evento, pessoa, oferta, valor.

E entrou o que faltava: **Stripe**, com verificação de assinatura de verdade.

---

## O que está aqui

```
tracking.config.ts        ← o SEU funil. É o arquivo que você edita.
sql/001_schema.sql        ← tabelas, índices, RLS
sql/002_relatorios.sql    ← três funções de leitura
lib/
  tipos.ts                  formato único de evento
  adapters/
    stripe.ts               ← NOVO
    plataformas-br.ts       Hotmart, Onprofit, Cademi (portados)
    generico.ts             qualquer origem, contrato JSON simples
    registro.ts             o catálogo
  webhook-auth.ts         token OU assinatura do Stripe
  webhook-log.ts
  ingestao.ts             casamento de lead + gravação idempotente
  cripto.ts               segredo do endpoint, cifrado
  supabase.ts             cliente de serviço (troque pelo seu)
api/
  webhooks/[kind]/[slug]/route.ts   ← uma rota pra todas as origens
  collect/route.ts                  primeira visita
  client-event/route.ts             etapa disparada pelo site
  pixel.js/route.ts                 o script que se cola no site
  endpoints/route.ts                cadastro de webhook (PRECISA DE AUTH — veja o TODO)
ui/
  painel.tsx              a tela pronta
  funil.tsx               o funil
  origem.tsx              a matriz por origem
  dados.ts                as contas (funções puras)
  primitivos.tsx          peças visuais mínimas
  tokens.css              a paleta
```

---

## Instalação

**1. Copie as pastas.** `tracking-kit/` na raiz do projeto. Os imports usam `@/tracking-kit/...` — se o seu alias for outro, ajuste o `tsconfig.json`:

```json
{ "compilerOptions": { "paths": { "@/*": ["./*"] } } }
```

**2. Rode o SQL** no editor do Supabase, na ordem: `sql/001_schema.sql`, depois `sql/002_relatorios.sql`.

**3. Abra `001_schema.sql` e edite `tracking_pode_ver()`.** Como vem, qualquer pessoa autenticada vê tudo — certo pra produto único, errado pra multi-tenant. O arquivo tem os dois exemplos comentados logo acima da função.

**4. Variáveis de ambiente:**

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
TRACKING_ENCRYPTION_KEY=<qualquer string longa e aleatória>
```

A `TRACKING_ENCRYPTION_KEY` cifra o segredo dos endpoints. **Trocar depois torna ilegível todo segredo já gravado** — a recuperação é recadastrar endpoint por endpoint.

**5. Edite `tracking.config.ts`.** Suas etapas, suas fontes, sua moeda, seu fuso. Gere um uuid pro `workspaceIdPadrao` (`crypto.randomUUID()` no console serve).

**6. Mova as rotas** de `tracking-kit/api/` pra `src/app/api/tracking/`, mantendo os nomes de pasta. Elas estão separadas só pra você ver o kit inteiro num lugar.

**7. Monte a tela:**

```tsx
// src/app/(app)/tracking/page.tsx
import "@/tracking-kit/ui/tokens.css";
import { PainelDeTracking } from "@/tracking-kit/ui/painel";
import { createClient } from "@/lib/supabase/client";

export default function Page() {
  return <PainelDeTracking supabase={createClient()} />;
}
```

**8. Cole o script no site** que gera o tráfego:

```html
<script src="https://SEU-APP.com/api/tracking/pixel.js" async></script>
```

---

## Stripe

**No painel do Stripe:** Developers → Webhooks → Add endpoint.

- URL: `https://SEU-APP.com/api/tracking/webhooks/checkout/<slug>` (o slug sai do passo seguinte)
- Eventos: `checkout.session.completed`, `invoice.paid`, `charge.refunded`
- Copie o **Signing secret** (`whsec_…`)

**No kit:**

```bash
curl -X POST https://SEU-APP.com/api/tracking/endpoints \
  -H "Content-Type: application/json" \
  -d '{"kind":"checkout","platform":"stripe","signing_secret":"whsec_..."}'
```

A resposta traz a URL com o slug. Volte no Stripe e atualize o endpoint com ela.

**Na criação da sessão de checkout** — este é o passo que faz a atribuição funcionar:

```ts
stripe.checkout.sessions.create({
  client_reference_id: leadId,   // window.TrackingKit.leadId()
  metadata: { lead_id: leadId, plan_id: "pro", plan_name: "Plano Pro" },
  ...
});
```

Sem isso o casamento cai pro e-mail — que funciona na maioria das vezes e falha justamente em quem compra com um e-mail diferente do que usou na landing.

Três coisas que valem saber:

- **Valor já vem em centavos.** `amount_total` de R$ 97 é `9700`. Não multiplique por 100 (é o erro clássico de quem porta um adapter da Hotmart, que manda em reais).
- **A assinatura é verificada de verdade**, com tolerância de 5 minutos contra replay. Sem isso, quem descobrisse a URL injetaria receita no seu relatório.
- **Renovação** só conta a partir da segunda cobrança (`billing_reason = subscription_cycle`) — a primeira já veio na sessão. Sem esse filtro, toda assinatura nova contaria duas vendas.

---

## Como fazer as coisas

**Etapa nova no funil** → uma entrada em `etapas`, no config. Mais nada.

**Plataforma nova** → um arquivo em `lib/adapters/`, uma linha em `registro.ts`, o nome na fonte correspondente do config. Nem schema nem rota mudam.

**Link de checkout com o lead carimbado:**

```js
// no botão
window.TrackingKit.comRef("https://checkout...", "ref", "initiate_checkout")
```

Ou, em construtor onde só dá pra colar uma URL (Elementor, Wix, Inlead): monte o link com `?ref=&tkevt=checkout` (valor vazio mesmo) e o script preenche antes de navegar.

**Testar um webhook sem a plataforma:**

```bash
curl -X POST https://SEU-APP.com/api/tracking/webhooks/externo/<slug> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"event":"purchase","email":"teste@exemplo.com","amount_cents":9700,"external_id":"teste-1"}'
```

---

## O que NÃO veio junto

Ficou de fora o que era específico do produto de origem ou é um módulo por si só. Nada disso impede o kit de funcionar:

| O quê | Por quê |
|---|---|
| Disparo de WhatsApp (SendPulse) | Regra de negócio do produto original: plano, carência, funil por plano. |
| Sincronização de gasto (Meta/Google Ads) | Módulo próprio, com OAuth e contas de anúncio. Sem ele não há ROI/ROAS — só faturamento. |
| API de Conversões da Meta | Depende do módulo acima. |
| Gerador de UTM e de links | Conveniência, não rastreamento. |
| Painel de pixels por produto | Substituído pelos atributos `data-meta-pixel` / `data-google-tag` na tag do script. |
| Tela de "pessoas" | A função `tracking_pessoas()` está no SQL e devolve a jornada de cada pessoa em jsonb; falta a tela em cima dela. |

Se algum desses fizer falta, o original tem tudo — e agora você sabe onde encaixar.

---

## Antes de subir

- [ ] `tracking_pode_ver()` ajustada pro seu modelo de acesso
- [ ] `exigirAdmin()` em `api/endpoints/route.ts` com a checagem do seu login **(vem barrando produção de propósito)**
- [ ] `TRACKING_ENCRYPTION_KEY` definida — e guardada
- [ ] `workspaceIdPadrao` trocado pelo seu uuid
- [ ] Um webhook de teste chegando e aparecendo no painel

Um detalhe que economiza uma tarde: as rotas públicas (`collect`, `client-event`) **não têm token de propósito** — o script roda em qualquer site e segredo em código de navegador não é segredo. O que limita o estrago é que elas só gravam lead e só aceitam as etapas listadas em `eventosDoPixel`. Compra entra por webhook assinado, nunca por ali.
