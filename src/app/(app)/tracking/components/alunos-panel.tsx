"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { ALVO_LABEL, type SendPulseAlvo } from "@/lib/sendpulse/config-keys";
import { cn } from "@/lib/utils";
import { Bloco, Cartao, Ponto, Tabela, TabelaWrap, Td, Th, Tr, Vazio } from "./ui";

/*
  Os recortes da lista.

  Um de cada vez, e não caixinhas que se somam: cada um deles é uma fila de
  cobrança com uma conversa própria ("assina o contrato", "abre a conta",
  "põe dinheiro"), e cruzar duas produz uma lista que não corresponde a
  nenhuma mensagem. Ser um só também é o que deixa o Dashboard linkar
  direto pra fila certa — ?aba=pessoas&filtro=sem-deposito.
*/
export const FILTROS_DE_ALUNO = [
  { chave: "todos", rotulo: "Todos" },
  { chave: "sem-contrato", rotulo: "Sem contrato" },
  { chave: "sem-pepe", rotulo: "Sem Pepe" },
  { chave: "sem-corretora", rotulo: "Sem corretora" },
  { chave: "sem-deposito", rotulo: "Conta sem depósito" },
  { chave: "ja-depositou", rotulo: "Já depositou" },
] as const;

export type FiltroDeAluno = (typeof FILTROS_DE_ALUNO)[number]["chave"];

export function ehFiltroDeAluno(v: unknown): v is FiltroDeAluno {
  return typeof v === "string" && FILTROS_DE_ALUNO.some((f) => f.chave === v);
}

function passaNoFiltro(a: Aluno, filtro: FiltroDeAluno): boolean {
  if (filtro === "sem-contrato") return !a.assinou;
  if (filtro === "sem-pepe") return !a.pepe;
  if (filtro === "sem-corretora") return !a.corretora;
  // "Conta sem depósito" é quem ABRIU a conta e não pôs dinheiro. Quem nem
  // abriu está na fila anterior, e misturar as duas daria uma lista que não
  // serve pra nenhuma das duas conversas.
  if (filtro === "sem-deposito") return a.corretora && !a.depositou;
  // O espelho do anterior: quem já pôs dinheiro. Serve pra agradecer, dar o
  // próximo passo e separar quem já virou depositante de quem ainda não.
  if (filtro === "ja-depositou") return a.depositou;
  return true;
}

interface Aluno {
  email: string;
  nome: string;
  phone: string;
  plano: string | null;
  assinou: boolean;
  pepe: boolean;
  corretora: boolean;
  depositou: boolean;
  depositos: number;
  depositado_cents: number;
  primeira_compra: string | null;
  ultima_compra: string | null;
  assinado_em: string | null;
  pepe_em: string | null;
  corretora_em: string | null;
  deposito_em: string | null;
}

function data(v: string | null) {
  return v ? new Date(v).toLocaleDateString("pt-BR") : "—";
}

// Depósito de corretora é sempre em dólar.
function usd(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
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
  filtroInicial = "todos",
}: {
  productId: string;
  de: string;
  ate: string;
  recarregar: number;
  /** Fila escolhida lá fora — o Dashboard manda a pessoa direto pra ela. */
  filtroInicial?: FiltroDeAluno;
}) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroDeAluno>(filtroInicial);

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
      if (!passaNoFiltro(a, filtro)) return false;
      if (!termo) return true;
      return (
        a.email.includes(termo) ||
        a.nome.toLowerCase().includes(termo) ||
        a.phone.includes(termo)
      );
    });
  }, [noPeriodo, busca, filtro]);

  // Os contadores seguem o período (e não a busca): eles descrevem o
  // universo daquela janela, que é o que os botões abaixo filtram.
  const quantos = (f: FiltroDeAluno) => noPeriodo.filter((a) => passaNoFiltro(a, f)).length;
  const semContrato = quantos("sem-contrato");
  const semPepe = quantos("sem-pepe");
  const semDeposito = quantos("sem-deposito");

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
          <span className="flex items-center gap-1.5">
            <Ponto tom={semDeposito > 0 ? "alerta" : "ok"} />
            <span className="text-text-tertiary">
              <span className="font-semibold tabular-nums text-text-primary">{semDeposito}</span> sem depósito
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
          {/* O contador vai junto do rótulo: o tamanho da fila é metade da
              decisão de qual delas atacar primeiro. */}
          <div className="flex flex-wrap items-center gap-1">
            {FILTROS_DE_ALUNO.map((f) => {
              const total = f.chave === "todos" ? noPeriodo.length : quantos(f.chave);
              const ativo = filtro === f.chave;
              return (
                <button
                  key={f.chave}
                  type="button"
                  onClick={() => setFiltro(f.chave)}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-button px-2.5 text-[12px] font-medium transition-colors",
                    ativo
                      ? "bg-accent text-accent-contrast"
                      : "border border-border bg-card-hover text-text-secondary hover:border-border-strong hover:text-text-primary"
                  )}
                >
                  {f.rotulo}
                  <span className={cn("tabular-nums", ativo ? "opacity-80" : "text-text-muted")}>{total}</span>
                </button>
              );
            })}
          </div>
        </div>

        {filtrados.length === 0 ? (
          <Vazio>
            {alunos.length > 0 && noPeriodo.length === 0
              ? "Ninguém entrou nesse período — troque o filtro de data acima."
              : "Nenhum aluno encontrado."}
          </Vazio>
        ) : (
          <TabelaWrap alta>
            <Tabela fixarPrimeira>
              <thead>
                <tr className="border-b border-border">
                  <Th>Aluno</Th>
                  <Th>Telefone</Th>
                  <Th>Plano</Th>
                  <Th>Contrato</Th>
                  <Th>Pepe</Th>
                  <Th>
                    <span className="inline-flex items-center gap-1">
                      Depositou?
                      <Tooltip text="Casa pelo e-mail da compra. Quem abriu conta na corretora com outro e-mail aparece como “sem conta” — confira antes de cobrar." />
                    </span>
                  </Th>
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
                      {/* Três estados, não dois: "não depositou" com conta
                          aberta e "não depositou" sem conta pedem conversas
                          diferentes — uma é lembrar de depositar, a outra é
                          ajudar a abrir a conta. */}
                      <Td
                        title={
                          a.depositou
                            ? `${a.depositos} ${a.depositos === 1 ? "depósito" : "depósitos"} · ${usd(a.depositado_cents)} · primeiro em ${data(a.deposito_em)}`
                            : a.corretora
                              ? `Conta aberta em ${data(a.corretora_em)}, sem depósito`
                              : "Sem cadastro na corretora com este e-mail"
                        }
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Ponto tom={a.depositou ? "ok" : a.corretora ? "alerta" : "neutro"} />
                          {a.depositou ? (
                            <span className="text-text-tertiary">
                              sim
                              <span className="ml-1 tabular-nums text-text-muted">{usd(a.depositado_cents)}</span>
                            </span>
                          ) : a.corretora ? (
                            <span className="font-medium text-warning">não · tem conta</span>
                          ) : (
                            <span className="text-text-tertiary">não · sem conta</span>
                          )}
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
