import type { CheckoutAdapter } from "./types";
import { normalizarEmail } from "../email";

// Baseado num payload real de teste mandado pelo produtor (evento "order" da
// Onprofit, pedido pago via Pix). Só vimos o status "PAID" até agora — outros
// valores (pendente, recusado, reembolso, cancelamento) ainda não foram
// confirmados, então qualquer status diferente de "PAID" é ignorado por
// enquanto (não gera tracking_event, não é erro). A Onprofit não tem um
// campo livre genérico pra "ref" custom — os únicos campos de rastreio que
// ela devolve são "utm_*" e "src"/"sck", então o link do checkout carrega o
// lead_id em "sck" (mesma convenção que a Hotmart usa) em vez de "?ref=".
//
// "price"/"offer_price" já vêm em CENTAVOS (confirmado: um teste com
// offer_price 9700 era R$97,00, não R$9.700 — bateu multiplicando por 100
// de novo). Nada de Math.round(price * 100) aqui, diferente da Hotmart
// (que manda em reais).
//
// "payment_type" confirmado com 2 payloads reais: "cc" (cartão de crédito)
// e o outro método usado no produto é "pix" — outros valores possíveis
// (ex: boleto) ainda não vistos, mas qualquer string desconhecida passa
// direto sem quebrar nada (só não fica com um rótulo bonito).
const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cc: "Cartão de crédito",
  pix: "Pix",
  boleto: "Boleto",
};

/**
 * "item_type" da Onprofit → o tipo que o app usa. Confirmados em payload real:
 * "product" (a compra principal) e "order_bump". Upsell e downsell ainda não
 * chegaram em nenhum payload, então são reconhecidos pelo texto (qualquer
 * variação com "upsell" / "downsell"); um valor desconhecido passa cru, e
 * conta como item extra — não como compra principal — até alguém mapear.
 */
export function classificarItem(cru: unknown): string {
  const t = typeof cru === "string" ? cru.trim().toLowerCase() : "";
  if (!t || t === "product" || t === "main" || t === "front") return "front";
  if (t.includes("bump")) return "order_bump";
  if (t.includes("upsell") || t.includes("up_sell") || t.includes("up-sell")) return "upsell";
  if (t.includes("downsell") || t.includes("down_sell") || t.includes("down-sell")) return "downsell";
  return t;
}

export const onprofitAdapter: CheckoutAdapter = (raw) => {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;

  if (body.object !== "order" || body.status !== "PAID") return null;

  const customer = isRecord(body.customer) ? body.customer : null;
  const product = isRecord(body.product) ? body.product : null;
  const price =
    typeof body.price === "number" ? body.price : typeof body.offer_price === "number" ? body.offer_price : null;
  const dateStr =
    (typeof body.confirmation_purchase_date === "string" ? body.confirmation_purchase_date : null) ??
    (typeof body.purchase_date === "string" ? body.purchase_date : null);

  // Telefone confirmado na documentação da Onprofit (objeto "customer"):
  // "cell" = padrão internacional (já com DDI, prioriza esse pra
  // normalizar melhor), "phone" = telefone formatado, sem DDI garantido —
  // usa como fallback se "cell" não vier.
  const phone =
    customer && typeof customer.cell === "string"
      ? customer.cell
      : customer && typeof customer.phone === "string"
        ? customer.phone
        : null;

  // A Onprofit separa nome e sobrenome ("André" + "DAmas") — junta os dois,
  // mas o primeiro nome sozinho já serve pra saudação.
  const nome = [customer?.name, customer?.lastname]
    .filter((p): p is string => typeof p === "string" && p.trim() !== "")
    .join(" ")
    .trim();

  const itemTipo = classificarItem(body.item_type);

  // O pagamento: todos os itens pagos juntos dividem a mesma transação, e o
  // valor dela é o do pedido inteiro (R$ 77 + R$ 37 + R$ 37 = R$ 151), que é o
  // que deve ir pra Meta como UMA compra.
  const transacoes = Array.isArray(body.transactions) ? body.transactions.filter(isRecord) : [];
  const primeira = transacoes[0] ?? null;
  const adicionais = primeira && isRecord(primeira.additional_data) ? primeira.additional_data : null;
  const orderId = idOf(primeira?.gateway_transaction_id) ?? idOf(adicionais?.charge_id);
  const totalPago = transacoes
    .filter((t) => t.status === "PAID" && typeof t.amount === "number")
    .reduce((soma, t) => soma + (t.amount as number), 0);

  return {
    email: normalizarEmail(customer?.email),
    phone,
    name: nome || null,
    amountCents: price !== null ? Math.round(price) : null,
    externalId: body.id !== undefined && body.id !== null ? String(body.id) : null,
    ref: typeof body.sck === "string" ? body.sck : typeof body.src === "string" ? body.src : null,
    occurredAt: parseBrDate(dateStr),
    offerName: typeof body.offer_name === "string" ? body.offer_name : null,
    // "product.id" é o plano (4831/4832/4833); "offer_id" é uma oferta
    // específica desse plano (promoção, preço diferente), então varia sem o
    // plano mudar — por isso o plano sai do product.id.
    // Item extra (bump/upsell): "product" é o item em si (ex: 6105), não o plano;
    // quem diz o plano da compra é "product_id".
    offerId: itemTipo === "front" ? (idOf(product?.id) ?? idOf(body.product_id)) : (idOf(body.product_id) ?? idOf(product?.id)),
    paymentMethod:
      typeof body.payment_type === "string"
        ? (PAYMENT_METHOD_LABEL[body.payment_type.toLowerCase()] ?? body.payment_type)
        : null,
    itemType: itemTipo,
    itemName: typeof product?.name === "string" && product.name.trim() ? product.name.trim() : null,
    orderId,
    orderTotalCents: totalPago > 0 ? Math.round(totalPago) : null,
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function idOf(value: unknown): string | null {
  if (typeof value === "number") return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

// "2026-08-18 11:04:14" (sem timezone no payload) — assume horário de
// Brasília (-03:00), que é onde a Onprofit/o produtor operam.
function parseBrDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value.replace(" ", "T") + "-03:00");
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
