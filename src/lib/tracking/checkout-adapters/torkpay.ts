import type { CheckoutAdapter } from "./types";
import { normalizarEmail } from "../email";

// TorkPay. Payload de teste recebido do próprio painel deles (06/10/2026):
//
//   { "event": "Compra aprovada", "platform": "TorkPay",
//     "timestamp": "2026-10-06T11:48:43.399Z", "payload_version": "2.0",
//     "data": {
//       "transaction_id": "tork_IMPRWN5F",
//       "buyer":   { "name", "email", "phone", "document" },
//       "order":   { "amount": 147, "status": "paid", "currency": "BRL",
//                    "installments": 1, "payment_method": "credit_card" },
//       "product": { "id": "prod_demo_123", "name": "Todos os produtos" } } }
//
// Confirmado pelo produtor: "amount" vem em REAIS (147 = R$ 147,00), vale pra
// qualquer valor. Os dados do comprador e do rastreio do payload de teste são
// de mentira; num pedido real vêm do cliente e do link do checkout.
//
// O bloco de rastreio da TorkPay (fbc, fbp, sck, src, utm_*) aparece repetido
// em vários pontos do JSON (topo, data, data.tracking, data.trackingParameters,
// trackingParameters). A busca abaixo varre o payload atrás de um UUID em
// chaves de rastreio, então acha o "sck" em qualquer um deles.

/** "amount" vem em reais (147 = R$ 147,00). Confirmado. */
const VALOR_EM_REAIS = true;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Nomes sob os quais as plataformas de checkout devolvem o parâmetro de
// rastreio do link. Só vale um UUID: é o formato do id do lead.
const CHAVES_DE_RASTREIO = new Set(["sck", "src", "ref", "lead_id", "tracking_id", "click_id"]);

function acharRef(valor: unknown, profundidade = 0): string | null {
  if (profundidade > 5 || typeof valor !== "object" || valor === null) return null;
  for (const [chave, v] of Object.entries(valor as Record<string, unknown>)) {
    if (CHAVES_DE_RASTREIO.has(chave.toLowerCase()) && typeof v === "string" && UUID.test(v.trim())) {
      return v.trim().toLowerCase();
    }
  }
  for (const v of Object.values(valor as Record<string, unknown>)) {
    const achado = acharRef(v, profundidade + 1);
    if (achado) return achado;
  }
  return null;
}

const FORMA_DE_PAGAMENTO: Record<string, string> = {
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  pix: "Pix",
  boleto: "Boleto",
};

// "Compra aprovada" e "paid" são os únicos que contam. Recusa, reembolso,
// estorno, Pix gerado e afins casam com a lista de exclusão e viram null:
// não é erro, só não é venda.
const EVENTO_APROVADO = /aprovad|approved|\bpaid\b|\bpago\b/i;
const EVENTO_EXCLUIDO = /reembols|refund|recus|declin|cancel|estorn|chargeback|pendente|pending|gerad|expir/i;
const STATUS_APROVADO = /^(paid|approved|aprovado|aprovada|pago|completed)$/i;

function isRecord(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

// Aceita número ou texto. No texto, a vírgula é o separador decimal e o ponto
// o de milhar ("1.234,56"); sem vírgula, o ponto é decimal ("77.50").
function lerNumero(valor: unknown): number {
  if (typeof valor === "number") return valor;
  if (typeof valor !== "string") return NaN;
  const t = valor.trim();
  return Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
}

function valorEmCentavos(valor: unknown): number | null {
  const numero = lerNumero(valor);
  if (!Number.isFinite(numero) || numero < 0) return null;
  return Math.round(VALOR_EM_REAIS ? numero * 100 : numero);
}

function data(valor: unknown): string | null {
  const t = texto(valor);
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export const torkpayAdapter: CheckoutAdapter = (raw) => {
  if (!isRecord(raw)) return null;

  const dados = isRecord(raw.data) ? raw.data : null;
  if (!dados) return null;

  const pedido = isRecord(dados.order) ? dados.order : null;
  const comprador = isRecord(dados.buyer) ? dados.buyer : null;
  const produto = isRecord(dados.product) ? dados.product : null;

  const evento = texto(raw.event) ?? "";
  if (!EVENTO_APROVADO.test(evento) || EVENTO_EXCLUIDO.test(evento)) return null;

  // O status do pedido confirma o evento: um "Compra aprovada" com pedido
  // que não está pago não vira venda.
  const status = texto(pedido?.status);
  if (status && !STATUS_APROVADO.test(status)) return null;

  const formaCrua = texto(pedido?.payment_method);
  const idProduto = produto?.id;

  return {
    email: normalizarEmail(comprador?.email),
    phone: texto(comprador?.phone),
    name: texto(comprador?.name),
    amountCents: valorEmCentavos(pedido?.amount),
    externalId: texto(dados.transaction_id),
    ref: acharRef(raw),
    occurredAt: data(raw.timestamp),
    offerName: texto(produto?.name),
    offerId: typeof idProduto === "string" || typeof idProduto === "number" ? String(idProduto) : null,
    paymentMethod: formaCrua ? (FORMA_DE_PAGAMENTO[formaCrua.toLowerCase()] ?? formaCrua) : null,
  };
};
