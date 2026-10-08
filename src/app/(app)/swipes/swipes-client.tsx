"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { BookmarkCheck, Search, TrendingUp, Trophy } from "@/components/ui/icones";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubTabs } from "@/components/ui/sub-tabs";
import { StatTile } from "@/components/ui/panel";
import { ActionBar, EmptyState, Section } from "@/components/ui/page";
import { cn } from "@/lib/utils";
import {
  STATUS_SWIPE,
  diasDesde,
  formatarPreco,
  rotuloFormato,
  tendenciaAnuncios,
  type StatusSwipe,
  type Swipe,
} from "@/lib/swipes";
import { ScoreBarra } from "./components/score";
import { BotaoNovoSwipe } from "./components/botao-novo";

type Filtro = "todos" | StatusSwipe;
type Ordem = "recentes" | "score" | "anuncios" | "rodando";

const ORDENS: { key: Ordem; label: string }[] = [
  { key: "recentes", label: "Mais recentes" },
  { key: "score", label: "Maior score" },
  { key: "anuncios", label: "Mais anúncios ativos" },
  { key: "rodando", label: "Rodando há mais tempo" },
];

export function SwipesClient({ swipes }: { swipes: Swipe[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [nicho, setNicho] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recentes");

  const nichos = useMemo(
    () => Array.from(new Set(swipes.map((s) => s.nicho).filter((n): n is string => !!n))).sort((a, b) => a.localeCompare(b)),
    [swipes]
  );

  const contagem = (st: StatusSwipe) => swipes.filter((s) => s.status === st).length;
  const comScore = swipes.filter((s) => s.status !== "descartado" && s.score !== null);
  const scoreMedio = comScore.length ? comScore.reduce((t, s) => t + (s.score ?? 0), 0) / comScore.length : null;
  const escalando = swipes.filter((s) => {
    const t = tendenciaAnuncios(s.historico_anuncios);
    return s.status !== "descartado" && t !== null && t.para > t.de;
  }).length;

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = swipes.filter((s) => {
      if (filtro !== "todos" && s.status !== filtro) return false;
      if (nicho && s.nicho !== nicho) return false;
      if (!termo) return true;
      return [s.nome, s.nicho, s.subnicho, s.plataforma, s.promessa, s.mecanismo, s.pagina_fb, ...s.ganchos]
        .filter(Boolean)
        .some((c) => (c as string).toLowerCase().includes(termo));
    });
    const porNumero = (f: (s: Swipe) => number | null) => (a: Swipe, b: Swipe) => (f(b) ?? -1) - (f(a) ?? -1);
    if (ordem === "score") lista.sort(porNumero((s) => s.score));
    if (ordem === "anuncios") lista.sort(porNumero((s) => s.anuncios_ativos));
    if (ordem === "rodando") lista.sort(porNumero((s) => diasDesde(s.rodando_desde)));
    return lista;
  }, [swipes, filtro, nicho, busca, ordem]);

  const filtros = [
    { key: "todos" as Filtro, label: `Todos · ${swipes.length}` },
    ...STATUS_SWIPE.map((s) => ({ key: s.key as Filtro, label: `${s.label} · ${contagem(s.key)}` })),
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Swipes salvos" value={swipes.length} icon={BookmarkCheck} />
        <StatTile label="Em análise" value={contagem("em_analise")} tone={contagem("em_analise") ? "warning" : "neutral"} />
        <StatTile
          label="Escalando"
          value={escalando}
          icon={TrendingUp}
          tone={escalando ? "success" : "neutral"}
          hint="anúncios ativos subindo desde a 1ª contagem"
        />
        <StatTile
          label="Score médio"
          value={scoreMedio === null ? "—" : scoreMedio.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
          icon={Trophy}
          hint="sem contar os descartados"
        />
      </div>

      <Section>
        <ActionBar
          filtros={<SubTabs tabs={filtros} active={filtro} onChange={setFiltro} className="mb-0" />}
          acoes={
            <>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar nome, promessa, gancho..."
                  aria-label="Buscar swipes"
                  className="w-[260px] pl-8"
                />
              </div>
              {nichos.length > 1 && (
                <Select value={nicho} onChange={(e) => setNicho(e.target.value)} aria-label="Filtrar por nicho" className="w-44">
                  <option value="">Todos os nichos</option>
                  {nichos.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              )}
              <Select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar" className="w-52">
                {ORDENS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </>
          }
        />

        {visiveis.length === 0 ? (
          swipes.length === 0 ? (
            <EmptyState
              titulo="Nenhum swipe salvo ainda"
              descricao="Achou um produto rodando forte? Cole o JSON dele (ou preencha campo a campo) e ele vira uma ficha aqui."
              acao={<BotaoNovoSwipe rotulo="Salvar o primeiro" />}
            />
          ) : (
            <EmptyState titulo="Nada encontrado" descricao="Nenhum swipe bate com esse filtro ou com a busca." />
          )
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visiveis.map((s) => (
              <CartaoSwipe key={s.id} swipe={s} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function CartaoSwipe({ swipe: s }: { swipe: Swipe }) {
  const status = STATUS_SWIPE.find((x) => x.key === s.status)!;
  const formato = rotuloFormato(s.formato_pagina);
  const dias = diasDesde(s.rodando_desde);
  const tendencia = tendenciaAnuncios(s.historico_anuncios);
  const capa = s.prints[0];

  return (
    <Link
      href={`/swipes/${s.id}`}
      className={cn(
        "group flex min-w-0 flex-col border border-border bg-app transition-[border-color,box-shadow] duration-150",
        "hover:border-frame-line hover:shadow-[inset_0_2px_0_var(--frame)]",
        s.status === "descartado" && "opacity-60 hover:opacity-100"
      )}
    >
      {capa && (
        <div className="relative aspect-[16/6] overflow-hidden border-b border-border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={capa} alt="" className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]" />
          {s.prints.length > 1 && (
            <span className="absolute bottom-2 right-2 border border-border bg-app px-1.5 py-0.5 font-display text-[10px] font-semibold tracking-[0.1em] text-text-secondary">
              +{s.prints.length - 1} PRINTS
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2.5 flex flex-wrap items-center gap-1">
          <Badge tone={status.tom}>{status.label}</Badge>
          {formato && <Badge>{formato}</Badge>}
        </div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-display text-[16px] font-bold uppercase leading-tight tracking-[0.04em] text-text-primary">
            {s.nome}
          </h3>
          {s.plataforma && <span className="shrink-0 pt-0.5 text-[11px] text-text-tertiary">{s.plataforma}</span>}
        </div>
        {(s.nicho || s.subnicho) && (
          <p className="mt-1 text-[12px] text-frame-text">{[s.nicho, s.subnicho].filter(Boolean).join(" · ")}</p>
        )}
        {s.promessa && <p className="mt-2.5 line-clamp-2 text-[13px] leading-snug text-text-secondary">“{s.promessa}”</p>}

        <dl className="mt-auto grid grid-cols-3 border-t border-border pt-3 [&>div+div]:border-l [&>div+div]:border-border [&>div+div]:pl-3">
          <Metrica rotulo="Front" valor={formatarPreco(s.preco_front, s.pais_idioma)} />
          <Metrica
            rotulo="Anúncios"
            valor={s.anuncios_ativos ?? "—"}
            extra={
              tendencia && tendencia.para !== tendencia.de ? (
                <span className={cn("text-[10px]", tendencia.para > tendencia.de ? "text-success" : "text-danger")}>
                  {tendencia.para > tendencia.de ? "▲" : "▼"}
                  {Math.abs(tendencia.para - tendencia.de)}
                </span>
              ) : null
            }
          />
          <Metrica rotulo="Rodando" valor={dias === null ? "—" : `${dias}d`} />
        </dl>
        <div className="mt-3 pt-0">
          <ScoreBarra valor={s.score} />
        </div>
      </div>
    </Link>
  );
}

function Metrica({ rotulo, valor, extra }: { rotulo: string; valor: ReactNode; extra?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">{rotulo}</dt>
      <dd className="mt-0.5 flex items-baseline gap-1 truncate font-display text-[15px] font-semibold tabular-nums text-text-primary">
        {valor}
        {extra}
      </dd>
    </div>
  );
}
