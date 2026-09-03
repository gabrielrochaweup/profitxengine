import type { MembersAreaAdapter } from "./types";

// Confirmado com payload real do evento "Aluno criado" (webhook V2 da
// Cademi, 02/09/2026):
// { "event": "user.created", "version": "2", "event_id": "...",
//   "payload": { "user": { "id", "name", "email", "phone", "document",
//   "access": { "first_at", "last_at" },
//   "created": { "at": { "iso", "unix" }, "by", "on" } } } }
//
// Esse evento não carrega nenhum campo de rastreio (ref/click_id) — o
// casamento do lead cai pra e-mail (ou telefone, quando vier preenchido;
// no payload de teste veio null).
export const cademiAdapter: MembersAreaAdapter = (raw) => {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;

  if (body.event !== "user.created") return null;

  const payload = isRecord(body.payload) ? body.payload : null;
  const user = payload && isRecord(payload.user) ? payload.user : null;
  if (!user) return null;

  const created = isRecord(user.created) ? user.created : null;
  const createdAt = created && isRecord(created.at) ? created.at : null;

  return {
    email: typeof user.email === "string" ? user.email : null,
    phone: typeof user.phone === "string" ? user.phone : null,
    ref: null,
    externalId: user.id !== undefined && user.id !== null ? String(user.id) : null,
    occurredAt: createdAt && typeof createdAt.iso === "string" ? createdAt.iso : null,
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
