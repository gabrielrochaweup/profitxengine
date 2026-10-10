// Formato normalizado que todo adapter de plataforma de checkout precisa
// produzir a partir do payload cru daquela plataforma. Adicionar uma
// plataforma nova = um arquivo novo aqui dentro implementando essa mesma
// forma, sem mexer em schema nem nas rotas de webhook.
export interface NormalizedCheckoutEvent {
  email: string | null;
  phone: string | null;
  /** Nome de quem comprou — vai no "Olá, {{nome}}" da mensagem de WhatsApp. */
  name: string | null;
  amountCents: number | null;
  externalId: string | null;
  ref: string | null;
  occurredAt: string | null;
  /** Nome do plano/oferta comprado, quando a plataforma manda isso (ex: "Método TRIAD - Starter"). */
  offerName: string | null;
  /**
   * Identificador estável do produto/plano na plataforma (ex: product.id da
   * Onprofit: 4831 = Starter, 4832 = PRO, 4833 = ELITE). É por ele que o
   * plano é resolvido — o nome da oferta é texto livre que o produtor muda
   * sem avisar, e o funil de WhatsApp depende de acertar o plano.
   */
  offerId: string | null;
  /** Forma de pagamento normalizada (ex: "Pix", "Cartão de crédito"), quando a plataforma manda isso. */
  paymentMethod: string | null;

  /*
    Itens de um pedido. Plataformas como a Onprofit mandam UM webhook por
    item: o produto principal e cada order bump chegam como compras
    separadas, no mesmo segundo, cada uma com o preço do próprio item. Sem
    estes campos, um pedido de R$ 151 virava três "compras" (R$ 77, R$ 37 e
    R$ 37) e a conta de compras e de CPA saía inflada.

    Todos opcionais: adapter que não distingue item (Hotmart, TorkPay, o
    genérico) simplesmente não preenche, e o evento vale como compra
    principal.
  */
  /** "front" | "order_bump" | "upsell" | "downsell" | texto cru de um tipo ainda não mapeado. */
  itemType?: string | null;
  /** ID do produto do item na plataforma (ex: 6104). Estável: o nome muda, o ID não. */
  itemId?: string | null;
  /** Nome do item em si (ex: "[TRIAD] VITALICIO"), diferente do nome da oferta que o comprou. */
  itemName?: string | null;
  /** Identificador do PAGAMENTO — o mesmo em todos os itens pagos juntos. */
  orderId?: string | null;
  /** Total cobrado no pagamento (todos os itens somados), em centavos. */
  orderTotalCents?: number | null;
}

// Retorna null quando o payload não representa uma compra aprovada pra essa
// plataforma (ex: webhook de teste, ou evento de reembolso/cancelamento —
// v1 só rastreia aprovação; reembolso fica pra um evento futuro).
export type CheckoutAdapter = (rawPayload: unknown) => NormalizedCheckoutEvent | null;
