"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { TIPOS_EXTRAS, ehItemExtra, rotuloDoItem } from "@/lib/tracking/itens";
import { Tabela, TabelaWrap, Td, Th, Tr, Vazio } from "./ui";

export interface ItemVendido {
  item_tipo: string;
  item_nome: string;
  vendas: number;
  receita_cents: number;
}

/**
 * Order bumps, upsells e downsells: o que foi vendido além do produto
 * principal, e quanto dos pedidos aceitou cada oferta.
 *
 * "Aceite" é vendas do item ÷ pedidos (compras do produto principal) no
 * período. Um bump vendido em 2 de 24 pedidos tem aceite de 8%.
 */
export function ItensVendidos({
  itens,
  fmtBRL,
}: {
  /** null = a função ainda não existe no banco (migration 0134 por rodar). */
  itens: ItemVendido[] | null;
  fmtBRL: (cents: number) => string;
}) {
  if (itens === null) {
    return <Vazio>Disponível depois que a migration 0134 for rodada no Supabase.</Vazio>;
  }

  const principais = itens.filter((i) => !ehItemExtra(i.item_tipo));
  const extras = itens.filter((i) => ehItemExtra(i.item_tipo));
  const pedidos = principais.reduce((t, i) => t + Number(i.vendas), 0);
  const receitaTotal = itens.reduce((t, i) => t + Number(i.receita_cents), 0);
  const receitaExtra = extras.reduce((t, i) => t + Number(i.receita_cents), 0);
  const vendasExtra = extras.reduce((t, i) => t + Number(i.vendas), 0);
  const aceite = (vendas: number) => (pedidos > 0 ? `${((vendas / pedidos) * 100).toFixed(vendas / pedidos < 0.1 ? 1 : 0)}%` : "—");

  // Tipos que o app conhece, na ordem fixa; depois qualquer tipo novo que a
  // Onprofit tenha mandado e ainda não esteja mapeado.
  const tiposVistos = Array.from(new Set(extras.map((i) => i.item_tipo)));
  const tipos = [...TIPOS_EXTRAS, ...tiposVistos.filter((t) => !(TIPOS_EXTRAS as readonly string[]).includes(t))];
  const semVenda = TIPOS_EXTRAS.filter((t) => !tiposVistos.includes(t));

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Resumo rotulo="Pedidos" valor={String(pedidos)} apoio="compras do produto principal" />
        <Resumo
          rotulo="Itens extras vendidos"
          valor={String(vendasExtra)}
          apoio={pedidos > 0 ? `${(vendasExtra / pedidos).toFixed(2).replace(".", ",")} por pedido` : undefined}
        />
        <Resumo
          rotulo="Receita dos extras"
          valor={fmtBRL(receitaExtra)}
          apoio={receitaTotal > 0 ? `${Math.round((receitaExtra / receitaTotal) * 100)}% da receita` : undefined}
        />
        <Resumo
          rotulo="Ticket médio do pedido"
          valor={pedidos > 0 ? fmtBRL(Math.round(receitaTotal / pedidos)) : "—"}
          apoio="com todos os itens"
        />
      </div>

      {extras.length === 0 ? (
        <Vazio>Nenhum order bump, upsell ou downsell vendido nesse período.</Vazio>
      ) : (
        <TabelaWrap>
          <Tabela>
            <thead>
              <tr className="border-b border-border">
                <Th>Item</Th>
                <Th>Tipo</Th>
                <Th num>Vendas</Th>
                <Th num>Receita</Th>
                <Th num>
                  <span className="inline-flex items-center gap-1">
                    Aceite
                    <Tooltip text="Vendas do item ÷ pedidos do período (compras do produto principal)." />
                  </span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {tipos.flatMap((tipo) =>
                extras
                  .filter((i) => i.item_tipo === tipo)
                  .sort((a, b) => Number(b.receita_cents) - Number(a.receita_cents))
                  .map((i) => (
                    <Tr key={`${i.item_tipo}|${i.item_nome}`}>
                      <Td forte>{i.item_nome}</Td>
                      <Td>{rotuloDoItem(i.item_tipo)}</Td>
                      <Td num>{i.vendas}</Td>
                      <Td num forte>
                        {fmtBRL(Number(i.receita_cents))}
                      </Td>
                      <Td num>{aceite(Number(i.vendas))}</Td>
                    </Tr>
                  ))
              )}
            </tbody>
          </Tabela>
        </TabelaWrap>
      )}

      {semVenda.length > 0 && extras.length > 0 && (
        <p className="mt-2 text-[11px] text-text-muted">
          Sem venda no período: {semVenda.map((t) => rotuloDoItem(t).toLowerCase()).join(", ")}.
        </p>
      )}
    </div>
  );
}

function Resumo({ rotulo, valor, apoio }: { rotulo: string; valor: string; apoio?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-app px-3 py-3">
      <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">{rotulo}</p>
      <p className="mt-2 font-display text-[22px] font-semibold leading-none tabular-nums text-text-primary">{valor}</p>
      {apoio && <p className="mt-1.5 truncate text-[11px] text-text-muted">{apoio}</p>}
    </div>
  );
}
