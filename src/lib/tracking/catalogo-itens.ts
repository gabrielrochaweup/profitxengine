/*
  Catálogo de itens vendidos: os planos, os order bumps e os upsells/downsells
  do Método TRIAD, por ID de produto.

  É a FONTE ÚNICA de "o que cada ID é". Quem consome:
    * o leitor de webhook da Onprofit — decide o tipo do item pelo ID, em vez
      de depender só do texto que a plataforma manda (que a gente só viu
      como "product" e "order_bump"; o de upsell e downsell ninguém viu ainda);
    * o painel "Order bumps, upsells e downsells" — lista também o que está
      mapeado e ainda não vendeu (o upsell 6110 aparece "aguardando venda");
    * a resolução do plano de uma compra (lib/sendpulse/planos.ts).

  Por que por ID e não por nome: o nome muda sem aviso (o produto 6105 já foi
  "[TRIAD] COPY TRADER" e "SESSÃO COPY TRADER INDIVIDUAL"); o ID não.

  PRODUTO NOVO = uma linha aqui. Enquanto não houver a linha, a venda não se
  perde: o item é gravado com o tipo que a plataforma mandou e aparece no
  painel com o aviso "não mapeado".

  Este arquivo não depende de nada de servidor: pode ser importado do navegador.
*/

export type TipoDeItem = "front" | "order_bump" | "upsell" | "downsell";
export type PlanoDoCurso = "starter" | "pro" | "elite";

export interface ItemDoCatalogo {
  /** ID do produto na plataforma de checkout (como texto). UUID em minúsculo. */
  id: string;
  tipo: TipoDeItem;
  /** Nome de referência. O da plataforma pode mudar; este é o que o app mostra. */
  nome: string;
  /** Só nos produtos principais: o plano que a compra libera. */
  plano?: PlanoDoCurso;
  /** Onde esse ID existe (informativo). */
  plataforma: "onprofit" | "torkpay";
}

export const CATALOGO_DE_ITENS: ItemDoCatalogo[] = [
  // ── Planos (produto principal) ──
  { id: "4831", tipo: "front", nome: "Método TRIAD - Starter", plano: "starter", plataforma: "onprofit" },
  { id: "4832", tipo: "front", nome: "Método TRIAD - PRO", plano: "pro", plataforma: "onprofit" },
  { id: "4833", tipo: "front", nome: "Método TRIAD - ELITE", plano: "elite", plataforma: "onprofit" },
  // TorkPay: o product.id do webhook de cada produto.
  { id: "8aff59e7-1b25-4789-8eb9-a43f97b742a9", tipo: "front", nome: "Método TRIAD - Starter", plano: "starter", plataforma: "torkpay" },
  { id: "7ba60cef-25c0-4235-ad92-2ed1d21143f9", tipo: "front", nome: "Método TRIAD - PRO", plano: "pro", plataforma: "torkpay" },
  { id: "929cee1e-607a-429e-a514-1f998bef82dd", tipo: "front", nome: "Método TRIAD - ELITE", plano: "elite", plataforma: "torkpay" },

  // ── Order bumps (oferecidos no próprio checkout, pagos junto) ──
  { id: "6106", tipo: "order_bump", nome: "[TRIAD] CARTÃO BLACK", plataforma: "onprofit" },
  { id: "6104", tipo: "order_bump", nome: "[TRIAD] VITALICIO", plataforma: "onprofit" },
  { id: "6105", tipo: "order_bump", nome: "SESSÃO COPY TRADER INDIVIDUAL", plataforma: "onprofit" },

  // ── Upsells (oferecidos depois da compra) ──
  // Ainda sem nenhuma venda: o tipo do item que a Onprofit manda nesse caso
  // não foi visto, por isso o ID decide. Quando a primeira venda chegar, vale
  // conferir no painel se entrou como "Upsell".
  { id: "6110", tipo: "upsell", nome: "[TRIAD] ALAVANCAGEM INDIVIDUAL", plataforma: "onprofit" },

  // ── Downsells ──
  // Nenhum mapeado ainda. Quando existir, uma linha aqui com tipo: "downsell".
];

const POR_ID = new Map(CATALOGO_DE_ITENS.map((i) => [i.id.toLowerCase(), i]));

/** O item do catálogo com esse ID de produto, ou undefined se ainda não foi mapeado. */
export function itemDoCatalogo(id: string | null | undefined): ItemDoCatalogo | undefined {
  if (!id) return undefined;
  return POR_ID.get(id.trim().toLowerCase());
}

/** Os itens extras mapeados (order bump, upsell, downsell), na ordem do catálogo. */
export function extrasDoCatalogo(): ItemDoCatalogo[] {
  return CATALOGO_DE_ITENS.filter((i) => i.tipo !== "front");
}
