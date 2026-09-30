"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download, Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Deposito, Depositante } from "@/lib/tracking/depositantes";

/*
  Quem depositou, com nome.

  O Tracking já conta depósitos por campanha, mas número sem nome não serve
  pra ligar, agradecer ou cobrar o próximo. Aqui o topo dos depositantes fica
  à vista no início, e o clique abre a lista inteira, com recorte por período
  e o histórico de cada depósito.

  A lista chega completa do servidor e o recorte de 7/15/30/90 dias é feito
  aqui, sobre a data de cada depósito — trocar de período não faz pedido
  nenhum e o total de cada pessoa sempre fecha com os depósitos que aparecem
  ao expandir a linha.
*/

const PERIODOS = [
  { chave: "tudo", rotulo: "Tudo", dias: null },
  { chave: "7", rotulo: "7 dias", dias: 7 },
  { chave: "15", rotulo: "15 dias", dias: 15 },
  { chave: "30", rotulo: "30 dias", dias: 30 },
  { chave: "90", rotulo: "90 dias", dias: 90 },
] as const;

type ChavePeriodo = (typeof PERIODOS)[number]["chave"];

const COM_CENTAVOS = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const SEM_CENTAVOS = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const DATA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Dólar e real nunca se somam: a corretora manda a moeda de cada depósito. */
function valorEscrito(usdCents: number, brlCents: number, centavos = true): string {
  const fmt = centavos ? COM_CENTAVOS : SEM_CENTAVOS;
  const partes: string[] = [];
  if (usdCents > 0) partes.push(`US$ ${fmt.format(usdCents / 100)}`);
  if (brlCents > 0) partes.push(`R$ ${fmt.format(brlCents / 100)}`);
  return partes.length > 0 ? partes.join(" + ") : "US$ 0,00";
}

function valorDoDeposito(d: Deposito): string {
  return `${d.moeda === "BRL" ? "R$" : "US$"} ${COM_CENTAVOS.format(d.valor_cents / 100)}`;
}

function nomeParaMostrar(p: Depositante): string {
  return p.nome || p.email.split("@")[0] || "Sem identificação";
}

function soma(depositos: Deposito[], moeda: Deposito["moeda"]): number {
  return depositos.filter((d) => d.moeda === moeda).reduce((t, d) => t + d.valor_cents, 0);
}

function porTotal(a: Depositante, b: Depositante): number {
  return b.total_usd_cents - a.total_usd_cents || b.total_brl_cents - a.total_brl_cents;
}

function recortar(lista: Depositante[], dias: number | null, agora: number): Depositante[] {
  if (dias === null) return lista;
  const corte = agora - dias * 86_400_000;
  const saida: Depositante[] = [];
  for (const p of lista) {
    const depositos = p.depositos.filter((d) => new Date(d.em).getTime() >= corte);
    if (depositos.length === 0) continue;
    saida.push({
      ...p,
      depositos,
      total_usd_cents: soma(depositos, "USD"),
      total_brl_cents: soma(depositos, "BRL"),
    });
  }
  return saida.sort(porTotal);
}

function ultimoDeposito(p: Depositante): string {
  return p.depositos.reduce((mais, d) => (d.em > mais ? d.em : mais), p.depositos[0]?.em ?? "");
}

function baixarCsv(lista: Depositante[], rotulo: string) {
  const celula = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const cabecalho = [
    "Nome",
    "E-mail",
    "Telefone",
    "Depósitos",
    "Total US$",
    "Total R$",
    "Primeiro depósito",
    "Último depósito",
  ];
  const linhas = lista.map((p) => {
    const datas = p.depositos.map((d) => d.em).sort();
    const primeira = datas[0];
    const ultima = datas[datas.length - 1];
    return [
      p.nome,
      p.email,
      p.phone,
      p.depositos.length,
      COM_CENTAVOS.format(p.total_usd_cents / 100),
      COM_CENTAVOS.format(p.total_brl_cents / 100),
      primeira ? DATA.format(new Date(primeira)) : "",
      ultima ? DATA.format(new Date(ultima)) : "",
    ]
      .map(celula)
      .join(";");
  });
  // BOM pro Excel abrir os acentos certos; ";" porque é o separador do Excel em pt-BR.
  const conteudo = "﻿" + [cabecalho.map(celula).join(";"), ...linhas].join("\r\n");
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `depositantes-${rotulo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DepositantesDestaque({ depositantes }: { depositantes: Depositante[] }) {
  const [aberto, setAberto] = useState(false);
  const [periodo, setPeriodo] = useState<ChavePeriodo>("tudo");
  const [busca, setBusca] = useState("");
  const [expandido, setExpandido] = useState<string | null>(null);
  // Fixado ao abrir, não a cada render: o recorte de "últimos 7 dias" não
  // pode mudar sozinho com a lista na tela.
  const [agora, setAgora] = useState(0);

  const top = depositantes.slice(0, 10);
  const totalUsd = depositantes.reduce((t, p) => t + p.total_usd_cents, 0);
  const totalBrl = depositantes.reduce((t, p) => t + p.total_brl_cents, 0);
  const totalDepositos = depositantes.reduce((t, p) => t + p.depositos.length, 0);

  const dias = PERIODOS.find((p) => p.chave === periodo)?.dias ?? null;
  const noPeriodo = useMemo(() => recortar(depositantes, dias, agora), [depositantes, dias, agora]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return noPeriodo;
    const digitos = termo.replace(/\D/g, "");
    return noPeriodo.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) ||
        p.email.includes(termo) ||
        (digitos.length > 0 && p.phone.replace(/\D/g, "").includes(digitos))
    );
  }, [noPeriodo, busca]);

  function abrir() {
    setAgora(Date.now());
    setAberto(true);
  }

  const usdDoPeriodo = filtrados.reduce((t, p) => t + p.total_usd_cents, 0);
  const brlDoPeriodo = filtrados.reduce((t, p) => t + p.total_brl_cents, 0);
  const depositosDoPeriodo = filtrados.reduce((t, p) => t + p.depositos.length, 0);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold text-text-primary">
          <span className="h-4 w-0.5 shrink-0 rounded-full bg-accent" aria-hidden />
          Depositantes
        </h2>
        <button type="button" onClick={abrir} className="text-[11px] text-text-tertiary hover:text-accent-text">
          Ver lista completa ({depositantes.length}) →
        </button>
      </div>

      {depositantes.length === 0 ? (
        <div className="rounded-card bg-card px-4 py-6 text-center text-[12px] text-text-tertiary shadow-card">
          Nenhum depósito recebido da corretora ainda.
        </div>
      ) : (
        <button
          type="button"
          onClick={abrir}
          className="block w-full overflow-hidden rounded-card bg-card text-left shadow-card ring-1 ring-accent transition-colors hover:bg-card-hover"
        >
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            <Resumo rotulo="Pessoas" valor={String(depositantes.length)} />
            <Resumo rotulo="Depositado" valor={valorEscrito(totalUsd, totalBrl, false)} />
            <Resumo rotulo="Depósitos" valor={String(totalDepositos)} />
          </div>

          <ul className="divide-y divide-border">
            {top.map((p, i) => (
              <li key={p.email || i} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-5 shrink-0 text-[11px] font-semibold tabular-nums text-text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1 md:grid md:grid-cols-[1.1fr_1.3fr_0.9fr] md:items-center md:gap-4">
                  <p className="truncate text-[13px] font-medium text-text-primary">{nomeParaMostrar(p)}</p>
                  <p className="truncate text-[11px] text-text-tertiary md:text-[12px]">{p.email || "—"}</p>
                  <p className="hidden truncate text-[12px] tabular-nums text-text-tertiary md:block">
                    {p.phone || "—"}
                  </p>
                </div>
                <span className="max-w-[9rem] shrink-0 text-right text-[13px] font-semibold leading-tight tabular-nums text-success sm:max-w-none">
                  {valorEscrito(p.total_usd_cents, p.total_brl_cents)}
                </span>
              </li>
            ))}
          </ul>

          {depositantes.length > top.length && (
            <p className="border-t border-border px-4 py-2 text-center text-[11px] font-medium text-text-secondary">
              + {depositantes.length - top.length} na lista completa — clique pra abrir
            </p>
          )}
        </button>
      )}

      <Modal open={aberto} onClose={() => setAberto(false)} title="Depositantes" className="max-w-5xl">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {PERIODOS.map((p) => (
              <button
                key={p.chave}
                type="button"
                onClick={() => setPeriodo(p.chave)}
                className={cn(
                  "h-8 rounded-button px-2.5 text-[12px] font-medium transition-colors",
                  periodo === p.chave
                    ? "bg-accent text-accent-contrast"
                    : "border border-border bg-card-hover text-text-secondary hover:border-border-strong hover:text-text-primary"
                )}
              >
                {p.rotulo}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-64">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-2.5 text-text-muted" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, e-mail ou telefone"
              className="h-8 pl-8 text-xs"
            />
          </div>
          <button
            type="button"
            onClick={() => baixarCsv(filtrados, periodo === "tudo" ? "tudo" : `${periodo}-dias`)}
            disabled={filtrados.length === 0}
            className="flex h-8 items-center gap-1.5 rounded-button border border-border bg-card-hover px-2.5 text-[12px] font-medium text-text-secondary hover:border-border-strong hover:text-text-primary disabled:opacity-50"
          >
            <Download size={13} />
            CSV
          </button>
        </div>

        <p className="mb-3 text-[12px] text-text-tertiary">
          <span className="font-semibold tabular-nums text-text-primary">{filtrados.length}</span>{" "}
          {filtrados.length === 1 ? "pessoa" : "pessoas"} ·{" "}
          <span className="font-semibold tabular-nums text-success">{valorEscrito(usdDoPeriodo, brlDoPeriodo)}</span>{" "}
          · {depositosDoPeriodo} {depositosDoPeriodo === 1 ? "depósito" : "depósitos"}
          {dias !== null && <> nos últimos {dias} dias</>}
        </p>

        {filtrados.length === 0 ? (
          <p className="py-8 text-center text-[12px] text-text-tertiary">
            {busca.trim() ? "Ninguém corresponde à busca." : `Ninguém depositou nos últimos ${dias} dias.`}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-wide text-text-tertiary">
                  <th className="w-6 py-2" />
                  <th className="py-2 pr-3 font-medium">Nome</th>
                  <th className="py-2 pr-3 font-medium">E-mail</th>
                  <th className="py-2 pr-3 font-medium">Telefone</th>
                  <th className="py-2 pr-3 text-right font-medium">Dep.</th>
                  <th className="py-2 pr-3 font-medium">Último</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p, i) => {
                  const chave = p.email || `sem-email-${i}`;
                  const aberta = expandido === chave;
                  return (
                    <Fragment key={chave}>
                      <tr
                        onClick={() => setExpandido(aberta ? null : chave)}
                        className="cursor-pointer border-b border-border text-[12px] hover:bg-card-hover"
                      >
                        <td className="py-2 text-text-muted">
                          {aberta ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </td>
                        <td className="max-w-[180px] truncate py-2 pr-3 font-medium text-text-primary">
                          {nomeParaMostrar(p)}
                        </td>
                        <td className="max-w-[200px] truncate py-2 pr-3 text-text-secondary">{p.email || "—"}</td>
                        <td className="whitespace-nowrap py-2 pr-3 tabular-nums text-text-secondary">
                          {p.phone || "—"}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums text-text-secondary">{p.depositos.length}</td>
                        <td className="whitespace-nowrap py-2 pr-3 tabular-nums text-text-tertiary">
                          {DATA.format(new Date(ultimoDeposito(p)))}
                        </td>
                        <td className="whitespace-nowrap py-2 text-right font-semibold tabular-nums text-success">
                          {valorEscrito(p.total_usd_cents, p.total_brl_cents)}
                        </td>
                      </tr>
                      {aberta && (
                        <tr className="border-b border-border bg-card-hover">
                          <td />
                          <td colSpan={6} className="py-2 pr-3">
                            <p className="mb-1 text-[10px] uppercase tracking-wide text-text-tertiary">
                              Depósitos ao longo do tempo
                            </p>
                            <ul className="space-y-0.5">
                              {[...p.depositos]
                                .sort((a, b) => b.em.localeCompare(a.em))
                                .map((d, j) => (
                                  <li key={`${d.em}-${j}`} className="flex gap-4 text-[12px] tabular-nums">
                                    <span className="w-24 text-text-tertiary">{DATA.format(new Date(d.em))}</span>
                                    <span className="font-medium text-text-primary">{valorDoDeposito(d)}</span>
                                  </li>
                                ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </section>
  );
}

function Resumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-text-tertiary">{rotulo}</p>
      <p className="mt-1.5 truncate text-[22px] font-bold leading-none tabular-nums text-text-primary">{valor}</p>
    </div>
  );
}
