"use client";

import { Fragment, useState } from "react";
import { trackingConfig } from "../tracking.config";
import { dinheiro, ehBaldeSemOrigem, EXPLICACAO_DO_BALDE, type LinhaDeOrigem, type LinhaDoRelatorio } from "./dados";
import { cn, Dica, Vazio } from "./primitivos";

/*
  De onde vêm os resultados.

  Uma linha por origem, com a progressão da entrada até a última etapa, e as
  campanhas saindo por baixo no clique. No projeto de origem essa mesma
  pergunta estava espalhada em quatro recortes — "leads por fonte",
  "depósitos por fonte", "depósitos por campanha", "vendas por UTM" — e
  nenhum deles mostrava a LINHA, que é o que se quer ver: entrou por onde, e
  até onde foi.

  As colunas saem do config. Etapa nova aparece aqui sozinha.
*/

export function MatrizDeOrigem({
  origens,
  linhas,
  etapaDestacada,
}: {
  origens: LinhaDeOrigem[];
  /** As linhas cruas, pra abrir as campanhas de uma origem sem outra ida ao banco. */
  linhas: LinhaDoRelatorio[];
  etapaDestacada: string | null;
}) {
  const [aberta, setAberta] = useState<string | null>(null);

  if (origens.length === 0) return <Vazio>Sem dados nesse período.</Vazio>;

  const etapas = trackingConfig.etapas;

  return (
    <div className="tk-tabela-wrap">
      <table className="tk-tabela">
        <thead>
          <tr>
            <th>Origem</th>
            {etapas.map((e) => (
              <th key={e.chave} className={cn("tk-num", etapaDestacada === e.chave && "tk-forte")}>
                {e.rotulo}
              </th>
            ))}
            {etapas
              .filter((e) => e.valor)
              .map((e) => (
                <th key={`${e.chave}-valor`} className="tk-num">
                  {e.valor!.rotulo}
                </th>
              ))}
          </tr>
        </thead>

        <tbody>
          {origens.map((o, i) => {
            const expandida = aberta === o.origem;
            const soUma = o.campanhas.length === 1;

            return (
              <Fragment key={o.origem}>
                <tr className={cn(i % 2 === 1 && "tk-linha-par", i === 0 && "tk-linha-topo")}>
                  <td>
                    <button
                      type="button"
                      className="tk-origem-botao"
                      disabled={soUma}
                      onClick={() => setAberta(expandida ? null : o.origem)}
                      title={soUma ? undefined : expandida ? "Recolher" : "Ver campanhas"}
                    >
                      <span>{soUma ? "" : expandida ? "▾" : "▸"}</span>
                      {o.origem}
                      {ehBaldeSemOrigem(o.origem) && <Dica texto={EXPLICACAO_DO_BALDE[o.origem]} />}
                      {!soUma && <span className="tk-zero">{o.campanhas.length} camp.</span>}
                    </button>
                  </td>

                  {etapas.map((e) => {
                    const dado = o.porEtapa[e.chave];
                    // Pessoas quando dá pra contar; senão, eventos. É a
                    // mesma escolha do funil, pra tabela e funil nunca
                    // mostrarem números diferentes da mesma etapa.
                    const valor = dado ? (dado.pessoas > 0 ? dado.pessoas : dado.eventos) : 0;
                    return (
                      <td key={e.chave} className={cn("tk-num", valor === 0 ? "tk-zero" : "tk-forte")}>
                        {valor}
                      </td>
                    );
                  })}

                  {etapas
                    .filter((e) => e.valor)
                    .map((e) => {
                      const cents = o.porEtapa[e.chave]?.valorCents ?? 0;
                      return (
                        <td key={`${e.chave}-valor`} className={cn("tk-num", cents === 0 ? "tk-zero" : "tk-dinheiro")}>
                          {dinheiro(cents, e.valor!.moeda)}
                        </td>
                      );
                    })}
                </tr>

                {expandida &&
                  o.campanhas.map((campanha) => {
                    const doCampanha = linhas.filter((l) => l.utm_source === o.origem && l.utm_campaign === campanha);
                    const somar = (chave: string, campo: "pessoas" | "eventos" | "valor_cents") =>
                      doCampanha.filter((l) => l.event_type === chave).reduce((a, l) => a + (Number(l[campo]) || 0), 0);

                    return (
                      <tr key={`${o.origem}-${campanha}`} className="tk-origem-campanha">
                        <td>
                          {campanha}
                          {ehBaldeSemOrigem(campanha) && <Dica texto={EXPLICACAO_DO_BALDE[campanha]} />}
                        </td>
                        {etapas.map((e) => {
                          const pessoas = somar(e.chave, "pessoas");
                          const valor = pessoas > 0 ? pessoas : somar(e.chave, "eventos");
                          return (
                            <td key={e.chave} className={cn("tk-num", valor === 0 && "tk-zero")}>
                              {valor}
                            </td>
                          );
                        })}
                        {etapas
                          .filter((e) => e.valor)
                          .map((e) => {
                            const cents = somar(e.chave, "valor_cents");
                            return (
                              <td key={`${e.chave}-valor`} className={cn("tk-num", cents === 0 && "tk-zero")}>
                                {dinheiro(cents, e.valor!.moeda)}
                              </td>
                            );
                          })}
                      </tr>
                    );
                  })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
