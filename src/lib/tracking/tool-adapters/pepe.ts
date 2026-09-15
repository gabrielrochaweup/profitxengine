import type { NormalizedToolEvent, ToolAdapter } from "./types";
import { normalizarEmail } from "../email";

// Pepe — a IA. Payload confirmado com o time (exemplo real de 15/09/2026):
//
//   { "id": 1843, "event": "user.first_access", "occurred_at": "...",
//     "app": "pepe",
//     "user": { "id", "name", "email", "phone", "plan", "cadastrado",
//               "cadastrado_em", "acesso_criado", "acesso_criado_em",
//               "ativo", "status", "ultimo_acesso" },
//     "data": { "ip": "..." } }
//
// O payload carrega o ESTADO inteiro do usuário junto com o evento, não só
// o que mudou. Isso é bom: a mesma chamada serve pra registrar o fato e pra
// corrigir o que estiver defasado deste lado.
//
// Os nomes de evento são casados por padrão, não por igualdade exata, pra
// que uma variação na escrita do outro lado ("user.created", "user.signup",
// "cadastro") não vire evento ignorado em silêncio no dia do lançamento.
const PADRAO_ACESSO = /first[_.\s-]?access|primeiro[_.\s-]?acesso/i;
const PADRAO_CADASTRO = /created|registered|sign[_.\s-]?up|cadastr/i;

export const pepeAdapter: ToolAdapter = (raw) => {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;

  const evento = typeof body.event === "string" ? body.event : "";
  if (!evento) return null;

  // Primeiro acesso tem prioridade: "user.first_access" também casa com o
  // padrão de cadastro em algumas escritas, e acessar é o fato mais forte.
  let kind: NormalizedToolEvent["kind"] | null = null;
  if (PADRAO_ACESSO.test(evento)) kind = "tool_access";
  else if (PADRAO_CADASTRO.test(evento)) kind = "tool_signup";
  if (!kind) return null;

  const user = isRecord(body.user) ? body.user : null;
  const email = normalizarEmail(user?.email);
  if (!email) return null;

  return {
    kind,
    email,
    phone: user && typeof user.phone === "string" && user.phone.trim() ? user.phone.trim() : null,
    name: user && typeof user.name === "string" && user.name.trim() ? user.name.trim() : null,
    ref: typeof body.ref === "string" && body.ref.trim() ? body.ref.trim() : null,
    // O id do evento é único por webhook — é ele que faz um reenvio virar
    // no-op em vez de um segundo cadastro.
    externalId: body.id !== undefined && body.id !== null ? String(body.id) : null,
    occurredAt: parseDate(body.occurred_at),
    plano: user && typeof user.plan === "string" && user.plan.trim() ? user.plan.trim().toLowerCase() : null,
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Vem em ISO com timezone ("2026-09-15T11:32:04.000Z"), então aqui é só
// validar — diferente da Onprofit, que manda sem timezone.
function parseDate(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
