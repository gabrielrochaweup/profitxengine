"use client";

/*
  Os gráficos que dependem do recharts.

  Ficam separados porque são carregados só no navegador. O ResponsiveContainer
  mede a largura do elemento pra decidir o tamanho do SVG — no servidor não
  existe elemento pra medir, então ele renderiza um desenho diferente do que o
  navegador renderiza logo em seguida. O React reclamava disso a cada carga
  ("Text content does not match server-rendered HTML") e jogava fora a árvore
  hidratada pra refazer do zero.

  Quem importa daqui é o charts.tsx, com next/dynamic e ssr desligado.
*/

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { AXIS_COLOR, EmptyChart, GRID_COLOR, TOOLTIP_STYLE, colorForLabel, fmtBRL } from "./chart-parts";

export function RevenueLineChart({ data }: { data: { label: string; bruto: number; liquido: number }[] }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS_COLOR }} />
        <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} tickFormatter={fmtBRL} width={56} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `R$ ${fmtBRL(Number(v) || 0)}`} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="bruto" name="Bruto" stroke="var(--accent-text)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="liquido" name="Líquido" stroke="var(--success)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({
  data,
  color = "var(--accent-text)",
  valueLabel,
  isCurrency,
  currencyPrefix = "R$",
}: {
  data: { label: string; value: number }[];
  color?: string;
  valueLabel: string;
  isCurrency?: boolean;
  currencyPrefix?: string;
}) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS_COLOR }} />
        <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} tickFormatter={fmtBRL} width={48} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v) => {
            const n = Number(v) || 0;
            return [isCurrency ? `${currencyPrefix} ${fmtBRL(n)}` : fmtBRL(n), valueLabel] as [string, string];
          }}
        />
        <Bar dataKey="value" name={valueLabel} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DynamicPieChart({
  data,
  innerRadius = 0,
  unit = "currency",
}: {
  data: { name: string; value: number }[];
  /** Passa um valor > 0 (ex: 55) pra virar rosca/donut em vez de pizza cheia. */
  innerRadius?: number;
  /** "count" mostra o número puro (ex: vendas), sem prefixo de moeda. */
  unit?: "currency" | "count";
}) {
  const withValue = data.filter((d) => d.value > 0);
  if (withValue.length === 0) return <EmptyChart />;
  const fmt = (n: number) => (unit === "currency" ? `R$ ${fmtBRL(n)}` : fmtBRL(n));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={withValue}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={90}
          label={(entry) => `${entry.name}: ${fmt(entry.value)}`}
          labelLine={false}
          /* O Recharts desenha contorno branco entre as fatias por padrão —
             herança de gráfico feito pra fundo claro. Em fundo escuro isso
             vira um risco luminoso separando as cores. */
          stroke="none"
        >
          {withValue.map((entry) => (
            <Cell key={entry.name} fill={colorForLabel(entry.name)} stroke="none" />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fmt(Number(v) || 0)} />
      </PieChart>
    </ResponsiveContainer>
  );
}
