"use client";

import { useId, useState } from "react";
import dynamic from "next/dynamic";
import { ChartSkeleton, EmptyChart, colorForLabel, fmtBRL } from "./chart-parts";

export { PIE_PALETTE, colorForLabel } from "./chart-parts";

/*
  Os gráficos de recharts entram só no navegador.

  O ResponsiveContainer decide o tamanho do SVG medindo o elemento onde ele
  está. No servidor não existe elemento pra medir, então o HTML que vinha de
  lá era diferente do que o navegador desenhava — e o React descartava a
  árvore inteira pra refazer, com um "Text content does not match
  server-rendered HTML" no console a cada carga da página.

  Desligar o SSR resolve na raiz: o servidor manda um espaço da altura certa
  (ChartSkeleton) e o gráfico aparece nele. Como o dado já chega junto com a
  página, a troca acontece no mesmo quadro — e nada abaixo pula de lugar,
  porque a altura reservada é a mesma do gráfico.
*/
export const RevenueLineChart = dynamic(() => import("./charts-recharts").then((m) => m.RevenueLineChart), {
  ssr: false,
  loading: () => <ChartSkeleton height={260} />,
});

export const SimpleBarChart = dynamic(() => import("./charts-recharts").then((m) => m.SimpleBarChart), {
  ssr: false,
  loading: () => <ChartSkeleton height={220} />,
});

export const DynamicPieChart = dynamic(() => import("./charts-recharts").then((m) => m.DynamicPieChart), {
  ssr: false,
  loading: () => <ChartSkeleton height={260} />,
});

// Funil "fluido" em SVG puro (colunas lado a lado, separadas por linha
// tracejada, com % grande no meio e valor + variação embaixo de cada
// estágio) — inspirado no estilo de funil do Meta Ads. Feito à mão em vez
// de usar o Funnel do recharts porque esse formato é colunas lado a lado
// com transição suave entre elas, diferente do funil vertical empilhado
// que o recharts desenha nativamente.
export function ConversionFunnel({
  data,
  color = "var(--accent-text)",
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
