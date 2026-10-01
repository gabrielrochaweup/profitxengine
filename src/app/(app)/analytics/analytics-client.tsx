"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/page";
import { SubTabs } from "@/components/ui/sub-tabs";
import { fromDateKey, toDateKey, weekdayFromDateKey, WEEKDAY_LABELS } from "../calendario/lib/date-utils";
import { RevenueLineChart, SimpleBarChart, DynamicPieChart } from "./components/charts";

interface DayResult {
  scheduled_date: string;
  dynamic_id: string | null;
  concluded: boolean;
  pepe_pessoas: number | null;
  pepe_valor: number | null;
  live_pessoas: number | null;
  live_valor: number | null;
  copy_pessoas: number | null;
  copy_valor: number | null;
  depositos_valor: number | null;
  depositos_qtd: number | null;
  faturamento_bruto: number | null;
  faturamento_liquido: number | null;
  observacoes: string | null;
}

interface DynamicMeta {
  id: string;
  name: string;
  icon: string | null;
}

interface AnalyticsClientProps {
  initialResults: DayResult[];
  dynamics: DynamicMeta[];
}

type Period = "hoje" | "ontem" | "7d" | "30d" | "90d" | "mes" | "tudo";

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "ontem", label: "Ontem" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "mes", label: "Este mês" },
  { key: "tudo", label: "Tudo" },
];

function sum(rows: DayResult[], key: keyof DayResult): number {
  return rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
}

function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function AnalyticsClient({ initialResults, dynamics }: AnalyticsClientProps) {
  const [period, setPeriod] = useState<Period>("30d");

  const dynamicsById = useMemo(() => {
    const map: Record<string, DynamicMeta> = {};
    dynamics.forEach((d) => {
      map[d.id] = d;
    });
    return map;
  }, [dynamics]);

  function dynamicLabel(dynamicId: string | null): string {
    if (!dynamicId) return "Sem dinâmica";
    const d = dynamicsById[dynamicId];
    return d ? `${d.icon ?? ""} ${d.name}`.trim() : "Sem dinâmica";
  }

  const filtered = useMemo(() => {
    if (period === "tudo") return initialResults;
    const now = new Date();
    if (period === "hoje") {
      const todayKey = toDateKey(now);
      return initialResults.filter((r) => r.scheduled_date === todayKey);
    }
    if (period === "ontem") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = toDateKey(yesterday);
      return initialResults.filter((r) => r.scheduled_date === yesterdayKey);
    }
    if (period === "mes") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return initialResults.filter((r) => fromDateKey(r.scheduled_date) >= monthStart);
    }
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    return initialResults.filter((r) => fromDateKey(r.scheduled_date) >= cutoff);
  }, [initialResults, period]);

  const kpis = useMemo(
    () => ({
      pepePessoas: sum(filtered, "pepe_pessoas"),
      pepeValor: sum(filtered, "pepe_valor"),
      livePessoas: sum(filtered, "live_pessoas"),
      liveValor: sum(filtered, "live_valor"),
      copyPessoas: sum(filtered, "copy_pessoas"),
      copyValor: sum(filtered, "copy_valor"),
      depositosValor: sum(filtered, "depositos_valor"),
      depositosQtd: sum(filtered, "depositos_qtd"),
      faturamentoBruto: sum(filtered, "faturamento_bruto"),
      faturamentoLiquido: sum(filtered, "faturamento_liquido"),
    }),
    [filtered]
  );

  const revenueByDay = useMemo(
    () =>
      filtered.map((r) => ({
        label: r.scheduled_date.slice(5).split("-").reverse().join("/"),
        bruto: r.faturamento_bruto ?? 0,
        liquido: r.faturamento_liquido ?? 0,
      })),
    [filtered]
  );

  const revenueByWeekday = useMemo(() => {
    const totals = new Array(7).fill(0);
    filtered.forEach((r) => {
      totals[weekdayFromDateKey(r.scheduled_date)] += r.faturamento_liquido ?? 0;
    });
    return WEEKDAY_LABELS.map((label, i) => ({ label, value: totals[i] }));
  }, [filtered]);

  const livePeopleByWeekday = useMemo(() => {
    const totals = new Array(7).fill(0);
    filtered.forEach((r) => {
      totals[weekdayFromDateKey(r.scheduled_date)] += r.live_pessoas ?? 0;
    });
    return WEEKDAY_LABELS.map((label, i) => ({ label, value: totals[i] }));
  }, [filtered]);

  const revenueByDynamic = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => {
      const name = dynamicLabel(r.dynamic_id);
      map.set(name, (map.get(name) ?? 0) + (r.faturamento_liquido ?? 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, dynamicsById]);

  return (
    <div className="mt-4 space-y-4">
      <SubTabs tabs={PERIOD_OPTIONS} active={period} onChange={setPeriod} className="mb-0" />

      <Section titulo="Resumo do período" className="mb-0">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <KpiTile label="🐸 Pepe" value={`${kpis.pepePessoas} pessoas`} sub={fmtBRL(kpis.pepeValor)} />
        <KpiTile label="📺 Live" value={`${kpis.livePessoas} pessoas`} sub={fmtBRL(kpis.liveValor)} />
        <KpiTile label="💰 Copy" value={`${kpis.copyPessoas} pessoas`} sub={fmtBRL(kpis.copyValor)} />
        <KpiTile label="Depósitos" value={fmtBRL(kpis.depositosValor)} sub={`${kpis.depositosQtd} depósitos`} />
        <KpiTile label="Faturamento bruto" value={fmtBRL(kpis.faturamentoBruto)} tone="accent" />
        <KpiTile label="Faturamento líquido" value={fmtBRL(kpis.faturamentoLiquido)} tone="success" />
      </div>
      </Section>

      <Section titulo="Faturamento por dia" className="mb-0">
        <Card className="p-4">
        <RevenueLineChart data={revenueByDay} />
      </Card>
      </Section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section titulo="Faturamento líquido por dia da semana" className="mb-0">
          <Card className="p-4">
          <SimpleBarChart data={revenueByWeekday} valueLabel="Faturamento líquido" isCurrency color="var(--series-1)" />
        </Card>
        </Section>
        <Section titulo="Pessoas na Live por dia da semana" className="mb-0">
          <Card className="p-4">
          <SimpleBarChart data={livePeopleByWeekday} valueLabel="Pessoas" color="var(--series-3)" />
        </Card>
        </Section>
      </div>

      <Section titulo="Faturamento líquido por dinâmica" className="mb-0">
        <Card className="p-4">
        <DynamicPieChart data={revenueByDynamic} />
      </Card>
      </Section>

      <Section titulo={<>Dias concluídos no período ({filtered.length})</>} className="mb-0">
        <Card className="p-4">
        {filtered.length === 0 ? (
          <p className="text-xs text-text-muted">Nenhum dia concluído nesse período ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-card-hover text-[10px] uppercase tracking-wide text-text-tertiary">
                  <th className="py-2 pr-3 font-medium">Data</th>
                  <th className="py-2 pr-3 font-medium">Dinâmica</th>
                  <th className="py-2 pr-3 font-medium">Pepe</th>
                  <th className="py-2 pr-3 font-medium">Live</th>
                  <th className="py-2 pr-3 font-medium">Copy</th>
                  <th className="py-2 pr-3 font-medium">Depósitos</th>
                  <th className="py-2 pr-3 font-medium">Bruto</th>
                  <th className="py-2 font-medium">Líquido</th>
                </tr>
              </thead>
              <tbody>
                {[...filtered].reverse().map((r) => (
                  <tr key={r.scheduled_date} className="border-b border-border text-text-secondary transition-colors last:border-0 hover:bg-card-hover">
                    <td className="py-2 pr-3 whitespace-nowrap">{r.scheduled_date.split("-").reverse().join("/")}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{dynamicLabel(r.dynamic_id)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {r.pepe_pessoas ?? 0}p · {fmtBRL(r.pepe_valor ?? 0)}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {r.live_pessoas ?? 0}p · {fmtBRL(r.live_valor ?? 0)}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {r.copy_pessoas ?? 0}p · {fmtBRL(r.copy_valor ?? 0)}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {r.depositos_qtd ?? 0} · {fmtBRL(r.depositos_valor ?? 0)}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmtBRL(r.faturamento_bruto ?? 0)}</td>
                    <td className="py-2 whitespace-nowrap">{fmtBRL(r.faturamento_liquido ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      </Section>
    </div>
  );
}

function KpiTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "accent" | "success";
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-app p-3.5">
      <p className="truncate text-[11px] font-medium text-text-tertiary">{label}</p>
      <p
        className={`mt-1.5 text-[18px] font-semibold leading-tight tabular-nums ${
          tone === "accent" ? "text-accent-text" : tone === "success" ? "text-ok" : "text-text-primary"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-text-muted">{sub}</p>}
    </div>
  );
}
