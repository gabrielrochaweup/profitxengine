import type { BrokerAdapter } from "./types";

// Contrato genérico — pra corretora feita sob medida (código próprio, não
// uma plataforma de mercado com formato fixo):
// { "event": "account_created" | "deposit", "email": "...",
//   "ref": "<lead_id ou null>", "external_id": "<id da conta ou do depósito>",
//   "amount_cents": 45000, "occurred_at": "2026-08-26T12:00:00Z" }
const EVENT_MAP: Record<string, "broker_signup" | "broker_deposit"> = {
  account_created: "broker_signup",
  deposit: "broker_deposit",
};

export const genericAdapter: BrokerAdapter = (raw) => {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;

  const eventType = typeof body.event === "string" ? EVENT_MAP[body.event] : undefined;
  if (!eventType) return null;

  return {
    eventType,
    email: typeof body.email === "string" ? body.email : null,
    ref: typeof body.ref === "string" ? body.ref : null,
    externalId: typeof body.external_id === "string" ? body.external_id : null,
    amountCents: typeof body.amount_cents === "number" ? body.amount_cents : null,
    occurredAt: typeof body.occurred_at === "string" ? body.occurred_at : null,
  };
};
