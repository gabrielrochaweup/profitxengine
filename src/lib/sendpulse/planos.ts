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
  "4831": "starter",
  "4832": "pro",
  "4833": "elite",
};

// Quem é "maior" quando duas compras caem dentro da mesma carência. Só
// existe pra isso: em nenhum outro lugar um plano vale mais que outro.
const ORDEM: Record<Plano, number> = { starter: 1, pro: 2, elite: 3 };

/** Devolve o maior dos dois planos; null só quando os dois são null. */
export function planoMaior(a: Plano | null, b: Plano | null): Plano | null {
  if (!a) return b;
  if (!b) return a;
  return ORDEM[b] > ORDEM[a] ? b : a;
}

/**
 * Descobre o plano de uma compra. O id da oferta é a fonte confiável; o
 * nome ("Método TRIAD - Starter") é só rede de segurança pra quando
 * aparecer um product.id ainda não mapeado aqui.
 */
export function resolvePlano(offerId: string | null, offerName: string | null): Plano | null {
  if (offerId && OFFER_ID_TO_PLANO[offerId]) return OFFER_ID_TO_PLANO[offerId];

  const nome = (offerName ?? "").toLowerCase();
  // Do mais específico pro mais genérico: um nome que cite dois planos é
  // ambíguo de qualquer jeito, e nesse caso o de cima ganha.
  if (/\belite\b/.test(nome)) return "elite";
  if (/\bpro\b/.test(nome)) return "pro";
  if (/\bstarter\b/.test(nome)) return "starter";

  return null;
}
