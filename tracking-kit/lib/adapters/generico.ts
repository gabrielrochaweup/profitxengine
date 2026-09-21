import { ehRegistro, normalizarEmail, numero, texto, type Adapter } from "../tipos";

/*
  O adapter que atende qualquer coisa.

  É o que se usa quando a origem não tem adapter dedicado: um sistema
  interno, um Zapier/Make no meio do caminho, o CRM da casa. O contrato é
  um JSON com o nome da etapa dentro, e nada mais:

    POST /api/tracking/webhooks/<kind>/<slug>
    Authorization: Bearer <token do endpoint>

    {
      "event": "purchase",              ← a chave da etapa no seu config
      "email": "pessoa@exemplo.com",
      "phone": "+55 11 98765-4321",     (opcional)
      "name": "Nome da Pessoa",         (opcional)
      "ref": "<lead_id>",               (opcional, mas é o casamento preciso)
      "amount_cents": 9700,             (opcional)
      "currency": "BRL",                (opcional)
      "offer_id": "plano-pro",          (opcional)
      "offer_name": "Plano Pro",        (opcional)
      "payment_method": "Pix",          (opcional)
      "external_id": "pedido-123",      (opcional, evita duplicar na reentrega)
      "occurred_at": "2026-09-21T14:00:00Z"   (opcional)
    }

  Por que "event" é obrigatório e não tem valor padrão: um endpoint genérico
  que assume a etapa quando ela falta grava o evento errado em silêncio, e
  isso só aparece semanas depois, num funil que não fecha.
*/
export const adapterGenerico: Adapter = (raw) => {
  if (!ehRegistro(raw)) return null;

  const tipo = texto(raw.event) ?? texto(raw.event_type) ?? texto(raw.tipo);
  if (!tipo) return null;

  return {
    tipo,
    email: normalizarEmail(raw.email),
    phone: texto(raw.phone) ?? texto(raw.telefone),
    name: texto(raw.name) ?? texto(raw.nome),
    ref: texto(raw.ref) ?? texto(raw.lead_id) ?? texto(raw.click_id),
    amountCents: numero(raw.amount_cents) ?? centavosDeValor(raw.amount ?? raw.valor),
    currency: texto(raw.currency)?.toUpperCase() ?? null,
    offerId: texto(raw.offer_id) ?? texto(raw.plan_id),
    offerName: texto(raw.offer_name) ?? texto(raw.plan_name),
    paymentMethod: texto(raw.payment_method),
    externalId: texto(raw.external_id) ?? texto(raw.id),
    occurredAt: texto(raw.occurred_at) ?? texto(raw.created_at),
  };
};

/**
 * "amount": 97.00 vira 9700.
 *
 * Só entra quando amount_cents não veio. Aceitar as duas formas é
 * conveniência pra quem está plugando um Zapier na pressa; o campo em
 * centavos continua sendo o recomendado, porque float de dinheiro erra
 * (0.1 + 0.2 não é 0.3 em lugar nenhum).
 */
function centavosDeValor(valor: unknown): number | null {
  const n = numero(valor);
  return n === null ? null : Math.round(n * 100);
}
