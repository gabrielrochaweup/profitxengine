"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ALVO_LABEL, type SendPulseAlvo } from "@/lib/sendpulse/config-keys";

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

  if (loading) return <Card className="p-5 text-sm text-text-secondary">Carregando…</Card>;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Alunos e contratos</h3>
          <p className="mt-1 text-xs text-text-secondary">
            Quem comprou, em que plano está, se já assinou e se já criou conta no Pepe. Sem assinatura o acesso
            não abre — esta lista existe pra cobrar quem ficou pelo caminho.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Badge tone="neutral">{noPeriodo.length} alunos</Badge>
          <Badge tone={semContrato > 0 ? "warning" : "success"}>{semContrato} sem contrato</Badge>
          <Badge tone={semPepe > 0 ? "warning" : "success"}>{semPepe} sem Pepe</Badge>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, e-mail ou telefone"
          className="max-w-xs"
        />
        <Button variant={soPendentes ? "primary" : "secondary"} onClick={() => setSoPendentes((v) => !v)}>
          Só quem não assinou
        </Button>
        <Button variant={soSemPepe ? "primary" : "secondary"} onClick={() => setSoSemPepe((v) => !v)}>
          Só quem não entrou no Pepe
        </Button>
      </div>

      {filtrados.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">
          {alunos.length > 0 && noPeriodo.length === 0
            ? "Ninguém entrou nesse período — troque o filtro de data acima."
            : "Nenhum aluno encontrado."}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Aluno</th>
                <th className="py-2 pr-3 font-medium">Telefone</th>
                <th className="py-2 pr-3 font-medium">Plano</th>
                <th className="py-2 pr-3 font-medium">Contrato</th>
                <th className="py-2 pr-3 font-medium">Pepe</th>
                <th className="py-2 pr-3 font-medium">1ª compra</th>
                <th className="py-2 font-medium">Última compra</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              {filtrados.map((a) => {
                const wa = linkWhatsapp(a.phone);
                return (
                  <tr key={a.email}>
                    <td className="py-2 pr-3">
                      <div className="text-text-primary">{a.nome || "—"}</div>
                      <div className="text-text-muted">{a.email}</div>
                    </td>
                    <td className="py-2 pr-3 font-mono">
                      {wa ? (
                        <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-text-primary">
                          {a.phone}
                        </a>
                      ) : (
                        <span className="text-text-muted">sem telefone</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {a.plano ? (ALVO_LABEL[a.plano as SendPulseAlvo] ?? a.plano) : "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {a.assinou ? (
                        <Badge tone="success">assinado</Badge>
                      ) : (
                        <Badge tone="warning">pendente</Badge>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {a.pepe ? (
                        <Badge tone="success" title={`Cadastrou em ${data(a.pepe_em)}`}>
                          cadastrado
                        </Badge>
                      ) : (
                        <Badge tone="neutral">pendente</Badge>
                      )}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{data(a.primeira_compra)}</td>
                    <td className="py-2 whitespace-nowrap">{data(a.ultima_compra)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
