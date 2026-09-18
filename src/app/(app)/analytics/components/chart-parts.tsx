"use client";

/*
  Pedaços compartilhados pelos gráficos.

  Existem num arquivo próprio porque os gráficos de recharts passaram a ser
  carregados só no cliente (ver charts.tsx): sem isso, o arquivo dos tokens
  importaria o dos gráficos e vice-versa.
*/

export const GRID_COLOR = "var(--border)";
export const AXIS_COLOR = "var(--text-muted)";
export const TOOLTIP_STYLE = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--text-primary)",
};

export const PIE_PALETTE = [
  "var(--accent-text)",
  "var(--accent-pink)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "#60a5fa",
  "#f472b6",
  "#facc15",
];

export function fmtBRL(n: number): string {
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

export function EmptyChart() {
  return (
    <div className="flex h-[220px] items-center justify-center text-xs text-text-muted">
      Sem dados suficientes nesse período.
    </div>
  );
}

/**
 * Espaço reservado enquanto o gráfico carrega.
 *
 * Tem a altura exata do gráfico que vai entrar no lugar: sem isso, o conteúdo
 * abaixo pularia 220–260px quando o recharts aparecesse.
 */
export function ChartSkeleton({ height }: { height: number }) {
  return <div style={{ height }} aria-hidden />;
}
