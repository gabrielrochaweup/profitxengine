import type { MembersAreaAdapter } from "./types";
import { normalizarEmail } from "../email";

// A Cademi manda 2 formatos DIFERENTES pro mesmo evento "Aluno criado" —
// confirmado com 2 payloads reais de alunos diferentes (02 e 04/09/2026),
// aparentemente dependendo da versão do webhook configurada do lado deles:
//
// Formato "V2 - Stable" (tem "version"): { "event": "user.created",
//   "version": "2", "event_id": "...", "payload": { "user": { "id", "name",
//   "email", "phone", "document", "access": { "first_at", "last_at" },
//   "created": { "at": { "iso", "unix" }, "by", "on" } } } }
//
// Formato mais antigo (sem "version", tem "event_type" solto): { "event":
//   { "usuario": { "id", "nome", "email", "doc", "celular", "gratis",
//   "pontos", "criado_em", "login_auto", "login_crstk", "ultimo_acesso_em" } },
//   "event_id": "...", "event_type": "usuario.criado" }
//
// Nenhum dos dois carrega campo de rastreio (ref/click_id) — o casamento
// do lead cai pra e-mail (ou telefone, quando vier preenchido).
export const cademiAdapter: MembersAreaAdapter = (raw) => {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;

  if (body.event === "user.created") {
    const payload = isRecord(body.payload) ? body.payload : null;
    const user = payload && isRecord(payload.user) ? payload.user : null;
    if (!user) return null;

    const created = isRecord(user.created) ? user.created : null;
    const createdAt = created && isRecord(created.at) ? created.at : null;

    return {
      email: normalizarEmail(user.email),
      phone: typeof user.phone === "string" ? user.phone : null,
      ref: null,
      externalId: user.id !== undefined && user.id !== null ? String(user.id) : null,
      occurredAt: createdAt && typeof createdAt.iso === "string" ? createdAt.iso : null,
    };
  }

  if (body.event_type === "usuario.criado") {
    const event = isRecord(body.event) ? body.event : null;
    const usuario = event && isRecord(event.usuario) ? event.usuario : null;
    if (!usuario) return null;

    return {
      email: normalizarEmail(usuario.email),
      phone: typeof usuario.celular === "string" ? usuario.celular : null,
      ref: null,
      externalId: usuario.id !== undefined && usuario.id !== null ? String(usuario.id) : null,
      occurredAt: typeof usuario.criado_em === "string" ? usuario.criado_em : null,
    };
  }

  return null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
