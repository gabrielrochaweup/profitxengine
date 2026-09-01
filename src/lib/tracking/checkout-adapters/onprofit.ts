import type { CheckoutAdapter } from "./types";

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
export const onprofitAdapter: CheckoutAdapter = (raw) => {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;

  if (body.object !== "order" || body.status !== "PAID") return null;

  const customer = isRecord(body.customer) ? body.customer : null;
  const price =
    typeof body.price === "number" ? body.price : typeof body.offer_price === "number" ? body.offer_price : null;
  const dateStr =
    (typeof body.confirmation_purchase_date === "string" ? body.confirmation_purchase_date : null) ??
    (typeof body.purchase_date === "string" ? body.purchase_date : null);

  return {
    email: customer && typeof customer.email === "string" ? customer.email : null,
    amountCents: price !== null ? Math.round(price) : null,
    externalId: body.id !== undefined && body.id !== null ? String(body.id) : null,
    ref: typeof body.sck === "string" ? body.sck : typeof body.src === "string" ? body.src : null,
    occurredAt: parseBrDate(dateStr),
    offerName: typeof body.offer_name === "string" ? body.offer_name : null,
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// "2026-08-18 11:04:14" (sem timezone no payload) — assume horário de
// Brasília (-03:00), que é onde a Onprofit/o produtor operam.
function parseBrDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value.replace(" ", "T") + "-03:00");
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
