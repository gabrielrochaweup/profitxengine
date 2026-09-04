"use client";

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
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";

const GRID_COLOR = "var(--border)";
const AXIS_COLOR = "var(--text-muted)";
const TOOLTIP_STYLE = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--text-primary)",
};

export const PIE_PALETTE = [
  "var(--accent)",
  "var(--accent-pink)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "#60a5fa",
  "#f472b6",
  "#facc15",
];

function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

// Hash simples (não-criptográfico) só pra dar sempre a mesma cor pra uma
// mesma string (fonte/plataforma/produto) sem precisar de um mapa mantido
// à mão — mesma origem sempre cai no mesmo índice da paleta.
export function colorForLabel(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash << 5) - hash + label.charCodeAt(i);
    hash |= 0;
  }
  return PIE_PALETTE[Math.abs(hash) % PIE_PALETTE.length];
}

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
        <Line type="monotone" dataKey="bruto" name="Bruto" stroke="var(--accent)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="liquido" name="Líquido" stroke="var(--success)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({
  data,
  color = "var(--accent)",
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
        >
          {withValue.map((entry) => (
            <Cell key={entry.name} fill={colorForLabel(entry.name)} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fmt(Number(v) || 0)} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Funil trapezoidal de verdade (não barras retas) — cada estágio mostra o
// valor absoluto e a % de retenção em relação ao topo do funil. Opacidade
// decrescente por estágio em vez de cores diferentes, pra não competir com
// a cor que já identifica o funil (curso vs. corretora) no card em volta.
export function ConversionFunnel({
  data,
  color = "var(--accent)",
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  if (data.length === 0 || data[0].value <= 0) return <EmptyChart />;
  const top = data[0].value;
  const chartData = data.map((d) => ({
    name: d.label,
    value: d.value,
    display: `${fmtBRL(d.value)} · ${top > 0 ? Math.round((d.value / top) * 100) : 0}%`,
  }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 56)}>
      <FunnelChart>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fmtBRL(Number(v) || 0)} />
        <Funnel dataKey="value" data={chartData} nameKey="name" isAnimationActive={false}>
          {chartData.map((entry, i) => (
            <Cell key={entry.name} fillOpacity={Math.max(0.35, 1 - i * 0.22)} fill={color} />
          ))}
          <LabelList dataKey="name" position="left" fill={AXIS_COLOR} stroke="none" fontSize={11} offset={10} />
          <LabelList
            dataKey="display"
            position="right"
            fill="var(--text-primary)"
            stroke="none"
            fontSize={12}
            offset={10}
          />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

// Lista com barra horizontal de verdade (não só texto) — label, barra
// proporcional ao maior valor da lista, e o valor já formatado.
export function HorizontalBarList({
  data,
  valueFormatter = (n: number) => fmtBRL(n),
  colorFor = colorForLabel,
}: {
  data: { label: string; value: number }[];
  valueFormatter?: (value: number) => string;
  colorFor?: (label: string) => string;
}) {
  if (data.length === 0) return <EmptyChart />;
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-xs text-text-secondary" title={d.label}>
            {d.label}
          </span>
          <div className="h-5 flex-1 overflow-hidden rounded-button bg-card-hover">
            <div
              className="h-full rounded-button"
              style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, backgroundColor: colorFor(d.label) }}
            />
          </div>
          <span className="w-20 shrink-0 text-right text-xs font-medium text-text-primary">
            {valueFormatter(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[220px] items-center justify-center text-xs text-text-muted">
      Sem dados suficientes nesse período.
    </div>
  );
}
