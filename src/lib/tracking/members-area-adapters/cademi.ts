import type { MembersAreaAdapter } from "./types";

// Baseado no payload documentado pela Cademi pro webhook "usuario.criado":
// { "event_id": "...", "event_type": "usuario.criado",
//   "event": { "usuario": { "id", "nome", "email", "doc", "celular",
//   "login_auto", "criado_em", "ultimo_acesso_em" } } }
//
// Esse evento não carrega nenhum campo de rastreio (ref/click_id) — a
// Cademi trata isso como um evento separado ("Click ID: quando um click_id
// de campanha é capturado no cadastro"), formato ainda não confirmado. Até
// integrarmos esse segundo evento, o casamento do lead cai pra e-mail.
export const cademiAdapter: MembersAreaAdapter = (raw) => {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;

  if (body.event_type !== "usuario.criado") return null;

  const event = isRecord(body.event) ? body.event : null;
  const usuario = event && isRecord(event.usuario) ? event.usuario : null;
  if (!usuario) return null;

  return {
    email: typeof usuario.email === "string" ? usuario.email : null,
    ref: null,
    externalId: usuario.id !== undefined && usuario.id !== null ? String(usuario.id) : null,
    occurredAt: typeof usuario.criado_em === "string" ? usuario.criado_em : null,
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
