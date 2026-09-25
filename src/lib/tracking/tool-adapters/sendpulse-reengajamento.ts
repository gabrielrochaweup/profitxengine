import type { ToolAdapter } from "./types";
import { normalizarEmail } from "../email";

// SendPulse — "Send webhook" no Action element de um fluxo do Automation
// 360. Confirmado na documentação oficial deles (Webhooks > "Webhooks
// triggered upon reaching a flow element"): dispara quando o contato
// ALCANÇA aquele passo do fluxo, não quando clica num link — é por isso que
// o endpoint marca o CONVITE saindo, não a pessoa voltando a acessar. Pra
// medir o retorno de verdade seria preciso um webhook de LOGIN vindo da
// própria plataforma da área de membros (a Cademi hoje só avisa a criação
// da conta, não logins seguintes).
//
// Payload real (a doc mostra um array com um objeto só, não o objeto
// direto):
//
//   [{ "info": null, "service": "whatsapp", "title": "<nome que você deu
//      ao passo>", "bot": {...}, "contact": { "email", "phone", "name",
//      "id", ... }, "date": 1617401679 }]
//
// "date" é epoch em SEGUNDOS nos exemplos oficiais.
export const sendpulseReengajamentoAdapter: ToolAdapter = (raw) => {
  const lista = Array.isArray(raw) ? raw : [raw];
  const item = lista[0];
  if (!isRecord(item)) return null;

  const contact = isRecord(item.contact) ? item.contact : null;
  if (!contact) return null;

  const email = normalizarEmail(contact.email);
  const phone = typeof contact.phone === "string" && contact.phone.trim() ? contact.phone.trim() : null;
  // Sem os dois, não tem como casar com um lead — não é erro, só nada pra
  // gravar (ex: um teste de webhook feito na hora de configurar).
  if (!email && !phone) return null;

  const contactId = typeof contact.id === "string" && contact.id.trim() ? contact.id.trim() : null;
  const ocorridoEm = parseData(item.date);

  return {
    kind: "members_reengagement_sent",
    email,
    phone,
    name: typeof contact.name === "string" && contact.name.trim() ? contact.name.trim() : null,
    ref: null,
    // contact.id sozinho é o ID do contato pra sempre — usar só ele faria
    // uma SEGUNDA campanha pro mesmo aluno, meses depois, virar duplicata
    // silenciosa (o upsert ignora). Junto com o horário do disparo, cada
    // envio vira único; um reenvio do MESMO webhook (retry do SendPulse)
    // continua batendo no mesmo id e não dobra a contagem.
    externalId: contactId && ocorridoEm ? `${contactId}:${ocorridoEm}` : null,
    occurredAt: ocorridoEm,
    plano: null,
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Os exemplos oficiais da SendPulse mostram epoch em segundos (10 dígitos).
// Se um dia vier em milissegundos, 10 dígitos vira ~11 anos no passado —
// tratamento defensivo: acima de ~10^12 é milissegundos.
function parseData(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  const ms = value > 1e12 ? value : value * 1000;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
