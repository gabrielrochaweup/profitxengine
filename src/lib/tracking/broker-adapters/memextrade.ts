import type { BrokerAdapter } from "./types";

// Baseado no payload real do evento "REGISTER" mandado pela Memex Trade:
// { "method": "REGISTER", "data": { "email", "userId", "registeredAt",
//   "utm": { "referralCode", "source", "medium", "campaign", "term",
//   "content", "gclid", "fbclid" } }, "timestamp", "webhookId" }
//
// "referralCode" dentro de "utm" é o campo que carrega o identificador do
// lead — a confirmar contra um cadastro real usando ?referralCode=<lead_id>
// na URL de cadastro (ainda não testado, só vimos o teste de conectividade
// do painel, que manda tudo null).
//
// DEPOSIT_PAYED ainda não foi confirmado — nenhum payload real visto ainda,
// então esse "method" não é reconhecido por enquanto (cai como "ignorado",
// aparece em Ver payloads pra gente ajustar assim que um depósito de teste
// passar por aqui).
const METHOD_MAP: Record<string, "broker_signup" | "broker_deposit"> = {
  REGISTER: "broker_signup",
};

export const memextradeAdapter: BrokerAdapter = (raw) => {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;

  const eventType = typeof body.method === "string" ? METHOD_MAP[body.method] : undefined;
  if (!eventType) return null;

  const data = isRecord(body.data) ? body.data : null;
  const utm = data && isRecord(data.utm) ? data.utm : null;

  return {
    eventType,
    email: data && typeof data.email === "string" ? data.email : null,
    ref: utm && typeof utm.referralCode === "string" ? utm.referralCode : null,
    externalId: data && typeof data.userId === "string" ? data.userId : null,
    amountCents: null,
    occurredAt:
      (data && typeof data.registeredAt === "string" ? data.registeredAt : null) ??
      (typeof body.timestamp === "string" ? body.timestamp : null),
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
