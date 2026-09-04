import type { CheckoutAdapter } from "./types";

// Contrato genérico pra qualquer plataforma sem adapter dedicado ainda —
// documentar isso pro time que for configurar o webhook do lado da
// plataforma (ou de um automatizador tipo Zapier/Make entre os dois):
//
// { "event": "purchase", "email": "...", "phone": "<opcional>",
//   "amount_cents": 49700, "external_id": "<id do pedido>",
//   "ref": "<lead_id ou null>", "occurred_at": "2026-08-26T12:00:00Z",
//   "offer_name": "<plano, opcional>", "payment_method": "<Pix/Cartão, opcional>" }
export const genericAdapter: CheckoutAdapter = (raw) => {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;

  if (body.event !== "purchase") return null;

  return {
    email: typeof body.email === "string" ? body.email : null,
    phone: typeof body.phone === "string" ? body.phone : null,
    amountCents: typeof body.amount_cents === "number" ? body.amount_cents : null,
    externalId: typeof body.external_id === "string" ? body.external_id : null,
    ref: typeof body.ref === "string" ? body.ref : null,
    occurredAt: typeof body.occurred_at === "string" ? body.occurred_at : null,
    offerName: typeof body.offer_name === "string" ? body.offer_name : null,
    paymentMethod: typeof body.payment_method === "string" ? body.payment_method : null,
  };
};
