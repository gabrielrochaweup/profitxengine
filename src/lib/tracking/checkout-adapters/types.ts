// Formato normalizado que todo adapter de plataforma de checkout precisa
// produzir a partir do payload cru daquela plataforma. Adicionar uma
// plataforma nova = um arquivo novo aqui dentro implementando essa mesma
// forma, sem mexer em schema nem nas rotas de webhook.
export interface NormalizedCheckoutEvent {
  email: string | null;
  phone: string | null;
  amountCents: number | null;
  externalId: string | null;
  ref: string | null;
  occurredAt: string | null;
  /** Nome do plano/oferta comprado, quando a plataforma manda isso (ex: "Método TRIAD - Starter"). */
  offerName: string | null;
  /** Forma de pagamento normalizada (ex: "Pix", "Cartão de crédito"), quando a plataforma manda isso. */
  paymentMethod: string | null;
}

// Retorna null quando o payload não representa uma compra aprovada pra essa
// plataforma (ex: webhook de teste, ou evento de reembolso/cancelamento —
// v1 só rastreia aprovação; reembolso fica pra um evento futuro).
export type CheckoutAdapter = (rawPayload: unknown) => NormalizedCheckoutEvent | null;
