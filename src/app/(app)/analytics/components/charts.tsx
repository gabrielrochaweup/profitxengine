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

export function DynamicPieChart({ data }: { data: { name: string; value: number }[] }) {
  const withValue = data.filter((d) => d.value > 0);
  if (withValue.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={withValue}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={(entry) => `${entry.name}: R$ ${fmtBRL(entry.value)}`}
          labelLine={false}
        >
          {withValue.map((entry, i) => (
            <Cell key={entry.name} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `R$ ${fmtBRL(Number(v) || 0)}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[220px] items-center justify-center text-xs text-text-muted">
      Sem dados suficientes nesse período.
    </div>
  );
}
