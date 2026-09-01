import type { MembersAreaAdapter } from "./types";

// Contrato genérico — pra área de membros feita sob medida (código
// próprio, não uma plataforma de mercado com formato fixo):
// { "event": "first_login", "email": "...", "ref": "<lead_id ou null>",
//   "external_id": "<id do aluno>", "occurred_at": "2026-08-26T12:00:00Z" }
export const genericAdapter: MembersAreaAdapter = (raw) => {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;

  if (body.event !== "first_login") return null;

  return {
    email: typeof body.email === "string" ? body.email : null,
    ref: typeof body.ref === "string" ? body.ref : null,
    externalId: typeof body.external_id === "string" ? body.external_id : null,
    occurredAt: typeof body.occurred_at === "string" ? body.occurred_at : null,
  };
};
