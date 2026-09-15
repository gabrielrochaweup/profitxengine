import type { MembersAreaAdapter } from "./types";
import { normalizarEmail } from "../email";

// Contrato genérico — pra área de membros feita sob medida (código
// próprio, não uma plataforma de mercado com formato fixo):
// { "event": "first_login", "email": "...", "phone": "<opcional>",
//   "ref": "<lead_id ou null>", "external_id": "<id do aluno>",
//   "occurred_at": "2026-08-26T12:00:00Z" }
export const genericAdapter: MembersAreaAdapter = (raw) => {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;

  if (body.event !== "first_login") return null;

  return {
    email: normalizarEmail(body.email),
    phone: typeof body.phone === "string" ? body.phone : null,
    ref: typeof body.ref === "string" ? body.ref : null,
    externalId: typeof body.external_id === "string" ? body.external_id : null,
    occurredAt: typeof body.occurred_at === "string" ? body.occurred_at : null,
  };
};
