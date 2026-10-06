import "server-only";

export type Plano = "starter" | "pro" | "elite";

export const PLANOS: Plano[] = ["starter", "pro", "elite"];

// Catálogo do Método TRIAD na Onprofit. É o "product.id" do payload de
// compra — o id do plano em si, que não muda quando o produtor cria uma
// oferta nova (promoção, preço diferente) pro mesmo plano.
//
// Plano novo lá = uma linha nova aqui + os endereços dele no painel do
// SendPulse. Sem a linha aqui, a compra ainda cai no endereço "geral" (ver
// enderecoDoEvento), então ninguém fica sem mensagem em silêncio.
const OFFER_ID_TO_PLANO: Record<string, Plano> = {
  // Onprofit
  "4831": "starter",
  "4832": "pro",
  "4833": "elite",
  // TorkPay (product.id do webhook de cada produto)
  "8aff59e7-1b25-4789-8eb9-a43f97b742a9": "starter",
  "7ba60cef-25c0-4235-ad92-2ed1d21143f9": "pro",
  "929cee1e-607a-429e-a514-1f998bef82dd": "elite",
};

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
