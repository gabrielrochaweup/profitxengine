/*
  Itens de um pedido.

  Algumas plataformas de checkout (a Onprofit) mandam UM webhook por item:
  o produto principal e cada order bump chegam como compras separadas, no
  mesmo segundo. O tipo do item é gravado em tracking_events.item_tipo
  (migration 0134):

    front       o produto principal — é ele que conta como "compra" (pedido)
    order_bump  oferta adicionada no próprio checkout, paga junto
    upsell      oferta feita depois da compra
    downsell    oferta mais barata, feita depois que o upsell é recusado

  Item sem tipo (Hotmart, TorkPay, qualquer outra plataforma, ou evento
  anterior à migration) vale como principal.

  Importável do navegador e do servidor: não depende de nada de servidor.
*/

export const ROTULO_DO_ITEM: Record<string, string> = {
  front: "Produto principal",
  order_bump: "Order bump",
  upsell: "Upsell",
  downsell: "Downsell",
};

/** Os tipos de item extra que o painel acompanha, na ordem em que aparecem. */
export const TIPOS_EXTRAS = ["order_bump", "upsell", "downsell"] as const;

export function ehItemExtra(tipo: string | null | undefined): boolean {
  return !!tipo && tipo !== "front";
}

/** Rótulo de um tipo; um tipo que a Onprofit mandou e ainda não foi mapeado aparece como veio. */
export function rotuloDoItem(tipo: string | null | undefined): string {
  if (!tipo) return ROTULO_DO_ITEM.front;
  return ROTULO_DO_ITEM[tipo] ?? `Outro (${tipo})`;
}
