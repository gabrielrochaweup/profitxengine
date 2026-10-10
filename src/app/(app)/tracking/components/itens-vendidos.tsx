"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { TIPOS_EXTRAS, ehItemExtra, rotuloDoItem } from "@/lib/tracking/itens";
import { extrasDoCatalogo, itemDoCatalogo } from "@/lib/tracking/catalogo-itens";
import { Tabela, TabelaWrap, Td, Th, Tr, Vazio } from "./ui";

export interface ItemVendido {
  item_tipo: string;
  /** ID do produto na plataforma. Nulo em plataformas que não mandam item por item. */
  item_id?: string | null;
  item_nome: string;
  vendas: number;
  receita_cents: number;
}

interface LinhaDoPainel {
  chave: string;
  tipo: string;
  nome: string;
  vendas: number;
  receita: number;
  /** Está no catálogo (lib/tracking/catalogo-itens.ts). */
  mapeado: boolean;
}

/**
 * Order bumps, upsells e downsells: o que foi vendido além do produto
 * principal, e quanto dos pedidos aceitou cada oferta.
 *
 * "Aceite" é vendas do item ÷ pedidos (compras do produto principal) no
 * período. Um bump vendido em 2 de 24 pedidos tem aceite de 8%.
 *
 * A lista mostra TODO item extra do catálogo, mesmo sem venda no período: é
 * assim que um upsell recém-mapeado aparece "aguardando venda" até a primeira
 * chegar. Item vendido que NÃO está no catálogo aparece com o aviso "não
 * mapeado" — é o sinal de que falta uma linha em catalogo-itens.ts.
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
  const aceite = (vendas: number) =>
    pedidos > 0 ? `${((vendas / pedidos) * 100).toFixed(vendas / pedidos < 0.1 ? 1 : 0).replace(".", ",")}%` : "—";

  // Vendido no período + mapeado sem venda. O nome e o tipo do catálogo
  // mandam quando o ID é conhecido (o nome da plataforma muda; o ID não).
  const linhas = new Map<string, LinhaDoPainel>();
  for (const i of extras) {
    const doCatalogo = itemDoCatalogo(i.item_id);
    const chave = doCatalogo ? doCatalogo.id : `${i.item_tipo}|${i.item_nome}`;
    const atual = linhas.get(chave);
    linhas.set(chave, {
      chave,
      tipo: doCatalogo?.tipo ?? i.item_tipo,
      nome: doCatalogo?.nome ?? i.item_nome,
      vendas: (atual?.vendas ?? 0) + Number(i.vendas),
      receita: (atual?.receita ?? 0) + Number(i.receita_cents),
      mapeado: !!doCatalogo,
    });
  }
  for (const c of extrasDoCatalogo()) {
    if (!linhas.has(c.id)) linhas.set(c.id, { chave: c.id, tipo: c.tipo, nome: c.nome, vendas: 0, receita: 0, mapeado: true });
  }

  // Tipos que o app conhece, na ordem fixa; depois qualquer tipo novo que a
  // plataforma tenha mandado e ainda não esteja mapeado.
  const todas = Array.from(linhas.values());
  const tiposVistos = Array.from(new Set(todas.map((l) => l.tipo)));
  const tipos = [...TIPOS_EXTRAS, ...tiposVistos.filter((t) => !(TIPOS_EXTRAS as readonly string[]).includes(t))];
  const ordenadas = tipos.flatMap((tipo) =>
    todas.filter((l) => l.tipo === tipo).sort((a, b) => b.receita - a.receita || b.vendas - a.vendas)
  );
  const naoMapeados = todas.filter((l) => !l.mapeado && l.vendas > 0).length;

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

      {ordenadas.length === 0 ? (
        <Vazio>Nenhum order bump, upsell ou downsell mapeado ou vendido nesse período.</Vazio>
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
              {ordenadas.map((l) => (
                <Tr key={l.chave}>
                  <Td forte={l.vendas > 0} className={l.vendas === 0 ? "text-text-tertiary" : undefined}>
                    {l.nome}
                    {l.vendas === 0 && (
                      <span className="ml-2 border border-border px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted">
                        aguardando venda
                      </span>
                    )}
                    {!l.mapeado && (
                      <span className="ml-2 border border-warning/30 bg-warning-soft px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-warning">
                        não mapeado
                      </span>
                    )}
                  </Td>
                  <Td>{rotuloDoItem(l.tipo)}</Td>
                  <Td num>{l.vendas}</Td>
                  <Td num forte={l.vendas > 0}>
                    {l.vendas > 0 ? fmtBRL(l.receita) : "—"}
                  </Td>
                  <Td num>{l.vendas > 0 ? aceite(l.vendas) : "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </Tabela>
        </TabelaWrap>
      )}

      {naoMapeados > 0 && (
        <p className="mt-2 text-[11px] text-warning">
          {naoMapeados === 1 ? "1 item vendido não está" : `${naoMapeados} itens vendidos não estão`} no catálogo
          (src/lib/tracking/catalogo-itens.ts). A venda está contada; falta só dar o nome e o tipo.
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
