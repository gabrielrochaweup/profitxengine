"use client";

import { maiorQueda, porcentagem, type EtapaCalculada } from "./dados";
import { cn, Dica } from "./primitivos";

/*
  O funil.

  A regra que manda aqui, e que é o motivo do kit existir: PESSOA NÃO É
  EVENTO. O número grande é sempre gente distinta; a contagem de eventos
  aparece ao lado quando os dois diferem. No projeto de origem, ler evento
  como pessoa produzia "3.561% de conversão" numa etapa que a mesma pessoa
  repete várias vezes por dia.

  Onde não dá pra contar gente — evento que chegou sem lead casado — a
  conversão é "—" com a explicação. Nunca uma porcentagem estimada: número
  inventado num painel é pior que número ausente, porque alguém decide com
  base nele.
*/

export function Funil({
  etapas,
  selecionada,
  onSelecionar,
}: {
  etapas: EtapaCalculada[];
  selecionada: string | null;
  onSelecionar: (chave: string | null) => void;
}) {
  const pior = maiorQueda(etapas);

  return (
    <div>
      <div className="tk-funil">
        {etapas.map((e, i) => {
          const ativa = selecionada === e.chave;
          const ehPior = pior?.chave === e.chave;
          const valor = e.pessoas ?? e.eventos;
          const mostraEventos = e.repetePorPessoa && e.pessoas !== null && e.eventos !== e.pessoas;

          return (
            <button
              key={e.chave}
              type="button"
              aria-pressed={ativa}
              onClick={() => onSelecionar(ativa ? null : e.chave)}
              className={cn("tk-etapa", ativa && "tk-etapa-ativa")}
            >
              <span className="tk-etapa-topo">
                <span className="tk-etapa-ordem">{i + 1}</span>
                {e.rotulo}
                {e.dica && <Dica texto={e.dica} />}
              </span>

              <p className="tk-etapa-valor">{valor.toLocaleString("pt-BR")}</p>

              <p className="tk-etapa-unidade">
                {e.pessoas !== null ? (
                  <>
                    {e.pessoas === 1 ? "pessoa" : "pessoas"}
                    {mostraEventos && ` · ${e.eventos.toLocaleString("pt-BR")} ${e.unidade}`}
                  </>
                ) : (
                  <>
                    {e.unidade} — sem pessoa identificada{" "}
                    <Dica texto="Os eventos desta etapa chegaram sem ligação com um lead, então não dá pra contar quantas pessoas são." />
                  </>
                )}
              </p>

              {/* A barra é a leitura de relance. A tinta esvazia junto com o
                  funil: etapa que perdeu muita gente chega apagada, e isso
                  se lê antes do texto. */}
              <span className="tk-etapa-barra">
                <span
                  style={{
                    width: e.fracaoDaEntrada !== null ? `${Math.max(2, e.fracaoDaEntrada * 100)}%` : "0%",
                    opacity: e.fracaoDaEntrada !== null ? Math.max(0.35, e.fracaoDaEntrada) : 0,
                  }}
                />
              </span>

              <span className="tk-etapa-rodape">
                <span>
                  {e.fracaoDaEntrada !== null ? (
                    `${porcentagem(e.fracaoDaEntrada)} do topo`
                  ) : (
                    <>
                      — do topo <Dica texto="Conversão indisponível para esta etapa com os dados atuais." />
                    </>
                  )}
                </span>

                {i > 0 && (
                  <span title={e.rotuloAnterior ? `Em relação a "${e.rotuloAnterior}"` : undefined}>
                    {e.fracaoDaAnterior !== null ? `↳ ${porcentagem(e.fracaoDaAnterior)} da anterior` : "↳ —"}
                  </span>
                )}

                {ehPior && <span className="tk-etapa-queda">maior queda</span>}
              </span>
            </button>
          );
        })}
      </div>

      <p className="tk-funil-legenda">
        O número grande é de <strong>pessoas</strong> — leads distintos que chegaram na etapa. Ao lado, quando os
        dois diferem, vem a contagem de <strong>eventos</strong>. Etapa cujos eventos não têm lead ligado não entra
        em conversão: aparece “—”.
      </p>
    </div>
  );
}
