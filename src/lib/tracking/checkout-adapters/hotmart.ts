import type { CheckoutAdapter } from "./types";

// ATENÇÃO: os caminhos abaixo (data.buyer.email, data.purchase.transaction,
// data.purchase.price.value em reais, data.purchase.origin.sck pro parâmetro
// de rastreio) seguem o formato público conhecido do webhook Hotmart 2.0.0
// pra "Compra aprovada" — mas o Hotmart deixa cada produtor escolher quais
// campos manda e a Hotmart já mudou esse formato antes. Antes de ativar em
// produção, usar o botão "Enviar teste" do painel Hotmart (Ferramentas >
// Webhook) e comparar o payload real com o que este adapter espera —
// ajustar aqui se algum caminho tiver mudado. O raw_payload sempre fica
// salvo inteiro em tracking_events mesmo se algum campo não bater.
export const hotmartAdapter: CheckoutAdapter = (raw) => {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;

  if (body.event !== "PURCHASE_APPROVED" && body.event !== "PURCHASE_COMPLETE") return null;

  const data = isRecord(body.data) ? body.data : null;
  const buyer = data && isRecord(data.buyer) ? data.buyer : null;
  const purchase = data && isRecord(data.purchase) ? data.purchase : null;
  const price = purchase && isRecord(purchase.price) ? purchase.price : null;
  const origin = purchase && isRecord(purchase.origin) ? purchase.origin : null;
  const product = data && isRecord(data.product) ? data.product : null;

  const priceValue = price && typeof price.value === "number" ? price.value : null;

  // Telefone AINDA NÃO CONFIRMADO com um payload real — segue o formato
  // público documentado (checkout_phone_code + checkout_phone separados),
  // ajustar se um payload real vier diferente.
  const phoneCode = buyer && typeof buyer.checkout_phone_code === "string" ? buyer.checkout_phone_code : "";
  const phoneNumber = buyer && typeof buyer.checkout_phone === "string" ? buyer.checkout_phone : "";
  const phone = phoneNumber ? `${phoneCode}${phoneNumber}` : null;

  return {
    email: buyer && typeof buyer.email === "string" ? buyer.email : null,
    phone,
    amountCents: priceValue !== null ? Math.round(priceValue * 100) : null,
    externalId: purchase && typeof purchase.transaction === "string" ? purchase.transaction : null,
    ref: origin && typeof origin.sck === "string" ? origin.sck : null,
    occurredAt:
      purchase && typeof purchase.approved_date === "number"
        ? new Date(purchase.approved_date).toISOString()
        : null,
    offerName: product && typeof product.name === "string" ? product.name : null,
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
