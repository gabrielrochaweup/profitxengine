import { ehRegistro, normalizarEmail, numero, texto, type Adapter, type EventoNormalizado } from "../tipos";

/*
  Stripe.

  Três coisas que valem saber antes de mexer aqui:

  1. VALOR JÁ VEM EM CENTAVOS. `amount_total` de uma sessão de 97 reais é
     9700. Nada de multiplicar por 100 — esse é o erro clássico de quem
     porta um adapter da Hotmart (que manda em reais) pro Stripe. A exceção
     são as moedas sem casa decimal (JPY, KRW): lá 9700 é 9.700 ienes. O kit
     guarda o número como veio e a moeda junto, então a conversão certa
     acontece na hora de formatar, não aqui.

  2. O LEAD VEM EM client_reference_id. É o campo que o Stripe carrega do
     início ao fim do checkout e devolve no webhook, feito exatamente pra
     isso. Ao criar a sessão:

       stripe.checkout.sessions.create({
         client_reference_id: leadId,          // ← o uuid do nosso script
         metadata: { lead_id: leadId },        // ← reserva, ver abaixo
         ...
       })

     O `metadata.lead_id` é redundante de propósito: Payment Links criados
     pelo painel não têm como preencher client_reference_id sem passar o
     parâmetro na URL, e nesses casos metadata é o que sobra.

  3. A ASSINATURA NÃO É UM TOKEN. O Stripe não manda Authorization; ele
     assina o corpo da requisição com o `whsec_…` e põe o resultado no
     header `Stripe-Signature`. Quem confere isso é lib/webhook-auth.ts, que
     detecta a plataforma "stripe" e troca a checagem de token pela de
     assinatura. Não dá pra usar o token genérico aqui.
*/

/**
 * De evento do Stripe pra etapa do funil.
 *
 * AJUSTE ESTE MAPA: as chaves da direita são as etapas do SEU
 * tracking.config.ts. Se o seu funil não tem "refund", tire a linha — o que
 * não estiver aqui é ignorado, e ignorado não é erro.
 */
const ETAPA_POR_EVENTO: Record<string, string> = {
  "checkout.session.completed": "purchase",
  "checkout.session.async_payment_succeeded": "purchase",
  // Assinatura: a primeira cobrança já veio pela sessão acima, então a
  // fatura paga só interessa a partir da segunda (billing_reason
  // "subscription_cycle"). Sem esse filtro, toda assinatura nova contaria
  // duas compras.
  "invoice.paid": "subscription_renewed",
  "charge.refunded": "refund",
};

export const stripeAdapter: Adapter = (raw) => {
  if (!ehRegistro(raw)) return null;

  const tipoDoEvento = texto(raw.type);
  if (!tipoDoEvento) return null;

  const etapa = ETAPA_POR_EVENTO[tipoDoEvento];
  if (!etapa) return null;

  const data = ehRegistro(raw.data) ? raw.data : null;
  const objeto = data && ehRegistro(data.object) ? data.object : null;
  if (!objeto) return null;

  if (tipoDoEvento === "invoice.paid") return daFatura(raw, objeto, etapa);
  if (tipoDoEvento === "charge.refunded") return doReembolso(raw, objeto, etapa);
  return daSessao(raw, objeto, etapa);
};

/** checkout.session.completed — o caminho normal de uma venda. */
function daSessao(evento: Record<string, unknown>, sessao: Record<string, unknown>, etapa: string): EventoNormalizado | null {
  // Sessão criada mas não paga não é venda. `payment_status` é "paid",
  // "unpaid" ou "no_payment_required" (assinatura em trial, por exemplo).
  const statusDoPagamento = texto(sessao.payment_status);
  if (statusDoPagamento === "unpaid") return null;

  const cliente = ehRegistro(sessao.customer_details) ? sessao.customer_details : null;
  const metadata = ehRegistro(sessao.metadata) ? sessao.metadata : {};

  return {
    tipo: etapa,
    email: normalizarEmail(cliente?.email ?? sessao.customer_email),
    phone: texto(cliente?.phone),
    name: texto(cliente?.name),
    ref: texto(sessao.client_reference_id) ?? texto(metadata.lead_id) ?? texto(metadata.ref),
    amountCents: numero(sessao.amount_total),
    currency: moeda(sessao.currency),
    // A oferta: `metadata` é o único lugar confiável sem expandir line_items
    // na chamada da API. Preencha metadata.plan_id / plan_name ao criar a
    // sessão — é uma linha lá e evita uma ida à API do Stripe aqui.
    offerId: texto(metadata.plan_id) ?? texto(metadata.price_id),
    offerName: texto(metadata.plan_name) ?? texto(metadata.plan),
    paymentMethod: rotuloDoMetodo(sessao),
    externalId: texto(sessao.id) ?? texto(evento.id),
    occurredAt: emIso(evento.created),
  };
}

/** invoice.paid — só a renovação; a primeira cobrança já veio pela sessão. */
function daFatura(evento: Record<string, unknown>, fatura: Record<string, unknown>, etapa: string): EventoNormalizado | null {
  const motivo = texto(fatura.billing_reason);
  if (motivo !== "subscription_cycle") return null;

  const metadata = ehRegistro(fatura.metadata) ? fatura.metadata : {};

  return {
    tipo: etapa,
    email: normalizarEmail(fatura.customer_email),
    phone: null,
    name: texto(fatura.customer_name),
    ref: texto(metadata.lead_id) ?? texto(metadata.ref),
    amountCents: numero(fatura.amount_paid),
    currency: moeda(fatura.currency),
    offerId: texto(metadata.plan_id),
    offerName: texto(metadata.plan_name),
    paymentMethod: null,
    externalId: texto(fatura.id) ?? texto(evento.id),
    occurredAt: emIso(evento.created),
  };
}

/**
 * charge.refunded — dinheiro voltando.
 *
 * O valor vai NEGATIVO de propósito: assim a soma de amount_cents da etapa
 * de reembolso já é o quanto saiu, e um relatório que some as duas etapas
 * dá o líquido sem regra especial em lugar nenhum.
 */
function doReembolso(evento: Record<string, unknown>, cobranca: Record<string, unknown>, etapa: string): EventoNormalizado | null {
  const devolvido = numero(cobranca.amount_refunded);
  if (devolvido === null || devolvido <= 0) return null;

  const cobrado = ehRegistro(cobranca.billing_details) ? cobranca.billing_details : null;
  const metadata = ehRegistro(cobranca.metadata) ? cobranca.metadata : {};

  return {
    tipo: etapa,
    email: normalizarEmail(cobranca.receipt_email ?? cobrado?.email),
    phone: texto(cobrado?.phone),
    name: texto(cobrado?.name),
    ref: texto(metadata.lead_id) ?? texto(metadata.ref),
    amountCents: -devolvido,
    currency: moeda(cobranca.currency),
    offerId: null,
    offerName: null,
    paymentMethod: null,
    // O id da cobrança com sufixo: sem ele, um reembolso parcial seguido de
    // outro seria descartado como reentrega do primeiro.
    externalId: texto(cobranca.id) ? `${texto(cobranca.id)}:refund:${devolvido}` : texto(evento.id),
    occurredAt: emIso(evento.created),
  };
}

function moeda(valor: unknown): string | null {
  const m = texto(valor);
  return m ? m.toUpperCase() : null;
}

/** O Stripe manda unix em segundos; o resto do kit fala ISO. */
function emIso(valor: unknown): string | null {
  const segundos = numero(valor);
  return segundos === null ? null : new Date(segundos * 1000).toISOString();
}

const ROTULO_DO_METODO: Record<string, string> = {
  card: "Cartão de crédito",
  pix: "Pix",
  boleto: "Boleto",
  sepa_debit: "Débito SEPA",
  us_bank_account: "Débito em conta",
  link: "Link",
};

function rotuloDoMetodo(sessao: Record<string, unknown>): string | null {
  const tipos = sessao.payment_method_types;
  if (!Array.isArray(tipos) || tipos.length === 0) return null;
  const primeiro = texto(tipos[0]);
  if (!primeiro) return null;
  return ROTULO_DO_METODO[primeiro] ?? primeiro;
}
