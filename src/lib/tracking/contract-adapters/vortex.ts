import type { ContractAdapter } from "./types";
import { normalizarEmail } from "../email";

// A assinatura acontece na ZapSign, mas quem avisa aqui é o Vortex: ele já
// recebe o webhook da ZapSign pra liberar o acesso do aluno, confere se o
// documento está fechado (a ZapSign manda um evento por assinante, e só
// quando todos assinaram o status vira "signed") e só então repassa. Evita
// ter duas integrações concorrentes com a ZapSign interpretando o mesmo
// payload de formas diferentes.
//
// Payload esperado (montado pelo Vortex, não é o JSON cru da ZapSign):
//   { event, doc_token, doc_name, email, name, phone, signed_at, verify_url }
//
// O plano NÃO vem aqui de propósito: quem sabe o plano é a compra na
// Onprofit, que já chega neste app pelo webhook de checkout. Aceitar um
// plano vindo junto da assinatura criaria uma segunda fonte de verdade que
// pode divergir (aluno assina no Starter e faz upgrade no mesmo dia).
export const vortexAdapter: ContractAdapter = (raw) => {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;

  if (body.event !== "contrato_assinado") return null;

  const email = normalizarEmail(body.email);
  if (!email) return null;

  return {
    email,
    phone: typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null,
    name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : null,
    ref: typeof body.ref === "string" && body.ref.trim() ? body.ref.trim() : null,
    externalId: typeof body.doc_token === "string" && body.doc_token.trim() ? body.doc_token.trim() : null,
    occurredAt: parseDate(body.signed_at),
    backfill: body.backfill === true,
  };
};

// A ZapSign manda ISO com timezone ("2026-09-04T18:56:13.953328Z"), então
// aqui é só validar — diferente da Onprofit, que manda sem timezone e
// precisa assumir Brasília.
function parseDate(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
