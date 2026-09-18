"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ALVO_LABEL, type SendPulseAlvo } from "@/lib/sendpulse/config-keys";
import { Bloco, Cartao, Ponto, Tabela, TabelaWrap, Td, Th, Tr, Vazio } from "./ui";

interface Aluno {
  email: string;
  nome: string;
  phone: string;
  plano: string | null;
  assinou: boolean;
  pepe: boolean;
  primeira_compra: string | null;
  ultima_compra: string | null;
  assinado_em: string | null;
  pepe_em: string | null;
}

function data(v: string | null) {
  return v ? new Date(v).toLocaleDateString("pt-BR") : "—";
}

// Link que abre a conversa no WhatsApp já no número certo — o telefone
// vem normalizado em +55, então é só tirar o que não for dígito.
function linkWhatsapp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export function AlunosPanel({
  productId,
  de,
  ate,
  recarregar,
}: {
  productId: string;
  de: string;
  ate: string;
  recarregar: number;
}) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [soPendentes, setSoPendentes] = useState(false);
  const [soSemPepe, setSoSemPepe] = useState(false);

  useEffect(() => {
    fetch(`/api/tracking/alunos?product_id=${productId}`)
      .then((r) => r.json())
      .then((d) => setAlunos(d.alunos ?? []))
      .finally(() => setLoading(false));
  }, [productId, recarregar]);

  // O período recorta por QUANDO a pessoa entrou, não pelos eventos dela: o
  // plano, o contrato e o Pepe continuam sendo o estado atual e completo.
  // Recortar os eventos faria alguém que comprou hoje e assinou semana
  // passada aparecer como "pendente" no filtro de hoje — numa lista cuja
  // razão de existir é cobrar quem não assinou, isso é pior do que inútil.
  const noPeriodo = useMemo(() => {
    const inicio = new Date(de).getTime();
    const fim = new Date(ate).getTime();
    return alunos.filter((a) => {
      const entrada = a.primeira_compra ?? a.assinado_em ?? a.pepe_em;
      // Sem nenhuma data conhecida, fica visível: sumir de uma lista de
      // cobrança é um jeito silencioso de perder a pessoa de vista.
      if (!entrada) return true;
      const quando = new Date(entrada).getTime();
      return quando >= inicio && quando <= fim;
    });
  }, [alunos, de, ate]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return noPeriodo.filter((a) => {
      if (soPendentes && a.assinou) return false;
      if (soSemPepe && a.pepe) return false;
      if (!termo) return true;
      return (
        a.email.includes(termo) ||
        a.nome.toLowerCase().includes(termo) ||
        a.phone.includes(termo)
      );
    });
  }, [noPeriodo, busca, soPendentes, soSemPepe]);

  // Os contadores seguem o período (e não a busca): eles descrevem o
  // universo daquela janela, que é o que os botões abaixo filtram.
  const semContrato = noPeriodo.filter((a) => !a.assinou).length;
  const semPepe = noPeriodo.filter((a) => !a.pepe).length;

  if (loading) return <Cartao className="text-sm text-text-secondary">Carregando…</Cartao>;

  return (
    <Bloco
      titulo="Alunos e contratos"
      acoes={
        // Os três números são o resumo da lista: ficam na linha do título,
        // em texto, em vez de três selos disputando atenção com os status
        // que a tabela usa embaixo.
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="text-text-tertiary">
            <span className="font-semibold tabular-nums text-text-primary">{noPeriodo.length}</span> alunos
          </span>
          <span className="flex items-center gap-1.5">
            <Ponto tom={semContrato > 0 ? "alerta" : "ok"} />
            <span className="text-text-tertiary">
              <span className="font-semibold tabular-nums text-text-primary">{semContrato}</span> sem contrato
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Ponto tom={semPepe > 0 ? "alerta" : "ok"} />
            <span className="text-text-tertiary">
              <span className="font-semibold tabular-nums text-text-primary">{semPepe}</span> sem Pepe
            </span>
          </span>
        </div>
      }
    >
      <p className="-mt-1 mb-3 max-w-[80ch] text-[11px] text-text-tertiary">
        Quem comprou, em que plano está, se já assinou e se já criou conta no Pepe. Sem assinatura o acesso não
        abre — esta lista existe pra cobrar quem ficou pelo caminho.
      </p>

      <Cartao>
        <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-3">
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone"
            className="h-8 max-w-xs text-xs"
          />
          <Button size="sm" variant={soPendentes ? "primary" : "secondary"} onClick={() => setSoPendentes((v) => !v)}>
            Só quem não assinou
          </Button>
          <Button size="sm" variant={soSemPepe ? "primary" : "secondary"} onClick={() => setSoSemPepe((v) => !v)}>
            Só quem não entrou no Pepe
          </Button>
        </div>

        {filtrados.length === 0 ? (
          <Vazio>
            {alunos.length > 0 && noPeriodo.length === 0
              ? "Ninguém entrou nesse período — troque o filtro de data acima."
              : "Nenhum aluno encontrado."}
          </Vazio>
        ) : (
          <TabelaWrap>
            <Tabela>
              <thead>
                <tr className="border-b border-border">
                  <Th>Aluno</Th>
                  <Th>Telefone</Th>
                  <Th>Plano</Th>
                  <Th>Contrato</Th>
                  <Th>Pepe</Th>
                  <Th num>1ª compra</Th>
                  <Th num>Última compra</Th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((a) => {
                  const wa = linkWhatsapp(a.phone);
                  return (
                    <Tr key={a.email}>
                      <Td className="max-w-[280px]">
                        <span className="block truncate font-medium text-text-primary">{a.nome || "—"}</span>
                        <span className="block truncate text-[11px] text-text-tertiary" title={a.email}>
                          {a.email}
                        </span>
                      </Td>
                      <Td className="font-mono text-[11px]">
                        {wa ? (
                          <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary">
                            {a.phone}
                          </a>
                        ) : (
                          <span className="text-text-muted">sem telefone</span>
                        )}
                      </Td>
                      <Td>{a.plano ? (ALVO_LABEL[a.plano as SendPulseAlvo] ?? a.plano) : "—"}</Td>
                      {/* Status em ponto + palavra: numa lista de centenas de
                          linhas, selo em toda célula vira textura, não sinal. */}
                      <Td>
                        <span className="inline-flex items-center gap-1.5">
                          <Ponto tom={a.assinou ? "ok" : "alerta"} />
                          <span className={a.assinou ? "text-text-tertiary" : "font-medium text-warning"}>
                            {a.assinou ? "assinado" : "pendente"}
                          </span>
                        </span>
                      </Td>
                      <Td title={a.pepe ? `Cadastrou em ${data(a.pepe_em)}` : undefined}>
                        <span className="inline-flex items-center gap-1.5">
                          <Ponto tom={a.pepe ? "ok" : "neutro"} />
                          <span className="text-text-tertiary">{a.pepe ? "cadastrado" : "pendente"}</span>
                        </span>
                      </Td>
                      <Td num>{data(a.primeira_compra)}</Td>
                      <Td num>{data(a.ultima_compra)}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Tabela>
          </TabelaWrap>
        )}
      </Cartao>
    </Bloco>
  );
}
