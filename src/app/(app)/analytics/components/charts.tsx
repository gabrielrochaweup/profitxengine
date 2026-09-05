"use client";

import { useId, useState } from "react";
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

// Funil "fluido" em SVG puro (colunas lado a lado, separadas por linha
// tracejada, com % grande no meio e valor + variação embaixo de cada
// estágio) — inspirado no estilo de funil do Meta Ads. Feito à mão em vez
// de usar o Funnel do recharts porque esse formato é colunas lado a lado
// com transição suave entre elas, diferente do funil vertical empilhado
// que o recharts desenha nativamente.
export function ConversionFunnel({
  data,
  color = "var(--accent)",
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  if (data.length === 0 || data[0].value <= 0) return <EmptyChart />;

  const W = 900;
  const H = 220;
  const padTop = 34;
  const padBottom = 44;
  const chartH = H - padTop - padBottom;
  const midY = padTop + chartH / 2;
  const minH = 10; // altura mínima visível pra estágio com valor 0

  const n = data.length;
  const segW = W / n;
  const top = data[0].value;
  const heights = data.map((d) => Math.max(minH, Math.max(0, d.value / top) * chartH));
  const transitionW = segW * 0.42;

  // Contorno único (topo esquerda→direita, depois base direita→esquerda)
  // com plateau plano na maior parte de cada coluna e curva suave só perto
  // da borda — dá o efeito de "fluxo" em vez de trapézio de canto reto.
  let path = "";
  for (let i = 0; i < n; i++) {
    const x1 = (i + 1) * segW;
    const flatEndX = x1 - transitionW;
    const y = midY - heights[i] / 2;
    if (i === 0) path += `M 0 ${y} `;
    path += `L ${flatEndX} ${y} `;
    if (i < n - 1) {
      const yNext = midY - heights[i + 1] / 2;
      path += `C ${flatEndX + transitionW * 0.55} ${y}, ${x1 - transitionW * 0.15} ${yNext}, ${x1} ${yNext} `;
    } else {
      path += `L ${x1} ${y} `;
    }
  }
  path += `L ${W} ${midY + heights[n - 1] / 2} `;
  for (let i = n - 1; i >= 0; i--) {
    const x0 = i * segW;
    const x1 = (i + 1) * segW;
    const flatEndX = x1 - transitionW;
    const y = midY + heights[i] / 2;
    path += `L ${flatEndX} ${y} `;
    if (i > 0) {
      const yPrev = midY + heights[i - 1] / 2;
      path += `C ${flatEndX - transitionW * 0.3} ${y}, ${x0 + transitionW * 0.3} ${yPrev}, ${x0} ${yPrev} `;
    } else {
      path += `L ${x0} ${y} `;
    }
  }
  path += "Z";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }} role="img">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity={0.95} />
          <stop offset="100%" stopColor={color} stopOpacity={0.45} />
        </linearGradient>
      </defs>
      <path d={path} fill={`url(#${gradientId})`} stroke="none" />
      {Array.from({ length: n - 1 }).map((_, i) => {
        const x = (i + 1) * segW;
        return (
          <line
            key={x}
            x1={x}
            y1={padTop - 14}
            x2={x}
            y2={H - padBottom + 14}
            stroke="var(--border-strong)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        );
      })}
      {data.map((d, i) => {
        const cx = i * segW + segW / 2;
        const pct = Math.round((d.value / top) * 100);
        const drop = i > 0 && data[i - 1].value > 0 ? Math.round(((d.value - data[i - 1].value) / data[i - 1].value) * 100) : null;
        return (
          <g key={d.label}>
            <text
              x={cx}
              y={padTop - 18}
              fill="var(--text-muted)"
              fontSize={11}
              fontWeight={600}
              textAnchor="middle"
              letterSpacing={0.4}
            >
              {d.label.toUpperCase()}
            </text>
            <text x={cx} y={midY + 7} fill="#fff" fontSize={22} fontWeight={700} textAnchor="middle">
              {pct}%
            </text>
            <text x={cx} y={H - padBottom + 20} fill="var(--text-primary)" fontSize={13} fontWeight={600} textAnchor="middle">
              {fmtBRL(d.value)}
            </text>
            {drop !== null && (
              <text
                x={cx}
                y={H - padBottom + 36}
                fill={drop < 0 ? "var(--danger)" : "var(--success)"}
                fontSize={11}
                textAnchor="middle"
              >
                {drop > 0 ? "+" : ""}
                {drop}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  if (data.length === 0) return <EmptyChart />;
  const max = Math.max(1, ...data.map((d) => d.value));

  function toggle(label: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <div className="space-y-2.5">
      {data.map((d) => {
        const isExpanded = expanded.has(d.label);
        return (
          <div key={d.label} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggle(d.label)}
              title={isExpanded ? "Clique pra recolher" : "Clique pra ver o nome inteiro"}
              className={
                isExpanded
                  ? "w-32 shrink-0 whitespace-normal break-words text-left text-xs text-text-primary underline decoration-dotted"
                  : "w-32 shrink-0 truncate text-left text-xs text-text-secondary hover:text-text-primary hover:underline"
              }
            >
              {d.label}
            </button>
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
        );
      })}
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
