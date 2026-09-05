import type { BrokerAdapter } from "./types";

// Baseado nos payloads reais dos eventos "REGISTER" e "DEPOSIT_PAYED"
// mandados pela Memex Trade:
// { "method": "REGISTER", "data": { "id" (id do usuário, não "userId" —
//   confirmado com payload real, o "data" de REGISTER vem com o objeto de
//   usuário inteiro da Memex Trade, dezenas de campos internos deles),
//   "email", "registeredAt", "lead": { "userId" (mesmo id, duplicado),
//   ... }, "utm": { "referralCode", ... } }, "timestamp" }
// { "method": "DEPOSIT_PAYED", "data": { "email", "phone", "userId",
//   "firstName", "lastName", "depositId", "amount", "totalAmount",
//   "bonusAmount", "currency", "paidAt", "method" (forma de pagamento, ex:
//   "PIX"), "status" (ex: "COMPLETED"),
//   "lead": { "email", "phone", "userId", "firstName", "lastName" } (os
//   mesmos dados duplicados dentro de um sub-objeto — ainda não confirmado
//   qual dos dois a Memex Trade realmente preenche num depósito de
//   verdade, então checa os dois lugares pro telefone),
//   "utm": { "referralCode", ... } }, "timestamp" }
//
// "referralCode" dentro de "utm" é o campo que carrega o identificador do
// lead — presente na mesma forma nos dois eventos, então o casamento por
// ref funciona igual pro depósito (assumindo que a Memex Trade guarda o
// referralCode do cadastro e devolve ele de novo em eventos futuros do
// mesmo usuário — ainda não confirmado com um referralCode de verdade, só
// vimos os testes de conectividade com tudo null).
//
// Valor do depósito usa "amount" (antes de bônus) — "totalAmount" inclui
// bonusAmount, que pode não ser dinheiro de verdade entrando. A moeda vem
// dinâmica do payload (o teste veio em "USD", não fixo em BRL como as
// outras integrações).
//
// ATENÇÃO — unidade de "amount" ainda não confirmada: multiplica por 100
// assumindo reais/dólares, igual a Hotmart, mas o único teste visto foi um
// valor redondo (100) que não distingue "R$1,00 em centavos" de
// "R$100,00 em unidade cheia" (foi exatamente esse erro que aconteceu com
// a Onprofit — lá "price" já vinha em centavos). Conferir contra um
// depósito real de valor não-redondo antes de confiar 100% nesse número.
//
// "isTest" vem true nos testes de conectividade do painel da própria
// Memex Trade (diferente do nosso botão "Testar", que usa um header
// próprio) — sem esse filtro, cada clique deles vira um tracking_event de
// verdade (foi o que aconteceu: um depósito de teste de admin@memextrade.com
// ficou gravado como depósito real até ser limpo manualmente).
const METHOD_MAP: Record<string, "broker_signup" | "broker_deposit"> = {
  REGISTER: "broker_signup",
  DEPOSIT_PAYED: "broker_deposit",
};

export const memextradeAdapter: BrokerAdapter = (raw) => {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;

  const eventType = typeof body.method === "string" ? METHOD_MAP[body.method] : undefined;
  if (!eventType) return null;

  const data = isRecord(body.data) ? body.data : null;
  if (data?.isTest === true) return null;

  const utm = data && isRecord(data.utm) ? data.utm : null;

  const amount =
    data && typeof data.amount === "number"
      ? data.amount
      : data && typeof data.totalAmount === "number"
        ? data.totalAmount
        : null;

  const occurredAt =
    (data && typeof data.paidAt === "string" ? data.paidAt : null) ??
    (data && typeof data.registeredAt === "string" ? data.registeredAt : null) ??
    (typeof body.timestamp === "string" ? body.timestamp : null);

  const lead = data && isRecord(data.lead) ? data.lead : null;

  // Confirmado com payload real de REGISTER: o id do usuário vem em
  // "data.id" (raiz), não em "data.userId" como o código assumia antes —
  // isso deixava todo broker_signup sem external_id, sem proteção nenhuma
  // contra duplicata em reenvio de webhook (achado numa varredura, nenhum
  // duplicado real ainda, mas o campo errado zerava a defesa).
  const externalId =
    eventType === "broker_deposit"
      ? data && typeof data.depositId === "string"
        ? data.depositId
        : null
      : (data && typeof data.id === "string" ? data.id : null) ??
        (lead && typeof lead.userId === "string" ? lead.userId : null);

  const email = (data && typeof data.email === "string" ? data.email : null) ?? (lead && typeof lead.email === "string" ? lead.email : null);
  const phone = (data && typeof data.phone === "string" ? data.phone : null) ?? (lead && typeof lead.phone === "string" ? lead.phone : null);

  return {
    eventType,
    email,
    phone,
    ref: utm && typeof utm.referralCode === "string" ? utm.referralCode : null,
    externalId,
    amountCents: eventType === "broker_deposit" && amount !== null ? Math.round(amount * 100) : null,
    currency: data && typeof data.currency === "string" ? data.currency : null,
    occurredAt,
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
