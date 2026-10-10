import "server-only";
import { CATALOGO_DE_ITENS } from "@/lib/tracking/catalogo-itens";

export type Plano = "starter" | "pro" | "elite";

export const PLANOS: Plano[] = ["starter", "pro", "elite"];

// Catálogo do Método TRIAD na Onprofit. É o "product.id" do payload de
// compra — o id do plano em si, que não muda quando o produtor cria uma
// oferta nova (promoção, preço diferente) pro mesmo plano.
//
// Plano novo lá = uma linha nova aqui + os endereços dele no painel do
// SendPulse. Sem a linha aqui, a compra ainda cai no endereço "geral" (ver
// enderecoDoEvento), então ninguém fica sem mensagem em silêncio.
//
// Os IDs moram em lib/tracking/catalogo-itens.ts (planos, order bumps e
// upsells numa lista só). Plano novo = uma linha lá, com o campo `plano`.
const OFFER_ID_TO_PLANO: Record<string, Plano> = Object.fromEntries(
  CATALOGO_DE_ITENS.filter((i) => i.plano).map((i) => [i.id.toLowerCase(), i.plano as Plano])
);

/**
 * Descobre o plano de uma compra. O id da oferta é a fonte confiável; o
 * nome ("Método TRIAD - Starter") é só rede de segurança pra quando
 * aparecer um product.id ainda não mapeado aqui.
 */
export function resolvePlano(offerId: string | null, offerName: string | null): Plano | null {
  // Minúsculo porque o id da TorkPay é UUID e pode vir em caixa diferente.
  const chave = offerId?.trim().toLowerCase();
  if (chave && OFFER_ID_TO_PLANO[chave]) return OFFER_ID_TO_PLANO[chave];

  const nome = (offerName ?? "").toLowerCase();
  // Do mais específico pro mais genérico: um nome que cite dois planos é
  // ambíguo de qualquer jeito, e nesse caso o de cima ganha.
  if (/\belite\b/.test(nome)) return "elite";
  if (/\bpro\b/.test(nome)) return "pro";
  if (/\bstarter\b/.test(nome)) return "starter";

  return null;
}
