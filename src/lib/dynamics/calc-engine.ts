import type { TradingWindow } from "@/lib/supabase/types";

/**
 * Engine de cálculo portada fielmente dos HTMLs de referência (Método TRIAD —
 * dinâmicas Batalha/Bônus/Kamikaze/Maratona/Mentoria/Premium). Mesma lógica,
 * mesmas fórmulas — só trocou de JS solto no HTML pra TS compartilhado.
 */

export interface WindowCount {
  wins: number;
  losses: number;
}

export interface ProductResult {
  wins: number;
  losses: number;
  acerto: number;
  fonte: TradingWindow;
}

export interface TradingConfigValues {
  cotacao: number;
  payoutCopy: number;
  payoutPepeLive: number;
  bancaCopy: number;
  entradaPepe: number;
  entradaLive: number;
}

const WINDOW_LABEL: Record<TradingWindow, string> = {
  dia: "Dia",
  semana: "Semana",
  mes: "Mês",
  total: "Total",
};

export function fmtBR(n: number): string {
  return Math.round(n).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

export function calcAcerto(wins: number, losses: number): number {
  const total = wins + losses;
  return total > 0 ? Math.round((wins / total) * 100) : 0;
}

export function getResult(wins: number, losses: number, fonte: TradingWindow): ProductResult {
  return { wins, losses, acerto: calcAcerto(wins, losses), fonte };
}

// FÓRMULA PEPE: (wins × entrada × payout) − (losses × entrada × 3)
// O 3× no loss = Martingale Gale 1 (entrada + 2× entrada).
export function calcLucroPepeUSD(wins: number, losses: number, entrada: number, payout: number): number {
  return wins * entrada * (payout / 100) - losses * entrada * 3;
}

// FÓRMULA LIVE: (wins × entrada × payout) − (losses × entrada). Sem gale fixo.
export function calcLucroLiveUSD(wins: number, losses: number, entrada: number, payout: number): number {
  return wins * entrada * (payout / 100) - losses * entrada;
}

export function toReais(usd: number, cotacao: number): number {
  return usd * cotacao;
}

export function calcRendimentoCopy(banca: number, rendimentoPct: number): number {
  return banca * (rendimentoPct / 100);
}

export function fonteFrasePlacar(fonte: TradingWindow): string {
  const map: Record<TradingWindow, string> = {
    dia: "de ontem",
    semana: "da semana",
    mes: "do mês",
    total: "no total",
  };
  return map[fonte] ?? "da semana";
}

export function fonteFraseLucro(fonte: TradingWindow): string {
  const map: Record<TradingWindow, string> = {
    dia: "no dia",
    semana: "na semana",
    mes: "no mês",
    total: "no total",
  };
  return map[fonte] ?? "na semana";
}

export function fonteLabel(fonte: TradingWindow): string {
  return WINDOW_LABEL[fonte];
}

// ============================================================
// MELHOR CENÁRIO — escolhe a janela com maior score ponderado.
// Peso: Semana × 1.05, Mês × 1.03, Total × 1.02, Dia × 1.00 (desempate).
// ============================================================
const WINDOW_WEIGHTS: { window: TradingWindow; peso: number }[] = [
  { window: "semana", peso: 1.05 },
  { window: "mes", peso: 1.03 },
  { window: "total", peso: 1.02 },
  { window: "dia", peso: 1.0 },
];

export interface MelhorCenario {
  fonte: TradingWindow;
  acerto: number;
  score: number;
}

export function calcularMelhorCenario(stats: Record<TradingWindow, WindowCount>): MelhorCenario | null {
  let best: MelhorCenario | null = null;
  for (const { window, peso } of WINDOW_WEIGHTS) {
    const { wins, losses } = stats[window];
    const acerto = calcAcerto(wins, losses);
    const score = acerto * peso;
    if (!best || score > best.score) {
      best = { fonte: window, acerto, score };
    }
  }
  return best;
}

export function calcularMelhorCenarioCopy(
  stats: Record<TradingWindow, WindowCount>,
  rendimentoPorJanela: Record<TradingWindow, number>
): MelhorCenario | null {
  let best: MelhorCenario | null = null;
  for (const { window, peso } of WINDOW_WEIGHTS) {
    const { wins, losses } = stats[window];
    const acerto = calcAcerto(wins, losses);
    const rend = rendimentoPorJanela[window] ?? 0;
    const score = (rend * 10 + acerto) * peso;
    if (!best || score > best.score) {
      best = { fonte: window, acerto, score };
    }
  }
  return best;
}

// ============================================================
// VAGAS — decaem ao longo do dia (curva configurável).
// Curva LINEAR: msg 1 = 100%, última msg = ~10%.
// ============================================================
export type CurvaVagas = "linear" | "agressiva" | "suave";

export interface VagasTiers {
  turbo: number;
  suprema: number;
  lendaria: number;
  galactica: number;
  ignicao?: number;
}

export function vagasNaPosicao(
  vagasIniciais: VagasTiers,
  curva: CurvaVagas,
  position: number,
  totalSlots: number
): VagasTiers {
  const denom = Math.max(1, totalSlots - 1);
  let factor: number;
  if (curva === "linear") {
    factor = 1 - ((position - 1) / denom) * 0.9;
  } else if (curva === "agressiva") {
    factor = Math.max(0.05, Math.pow(1 - (position - 1) / denom, 1.5));
  } else {
    factor = Math.max(0.08, 1 - Math.pow((position - 1) / denom, 2));
  }
  const apply = (v: number | undefined) => Math.max(0, Math.round((v ?? 0) * factor));
  return {
    turbo: apply(vagasIniciais.turbo),
    suprema: apply(vagasIniciais.suprema),
    lendaria: apply(vagasIniciais.lendaria),
    galactica: apply(vagasIniciais.galactica),
    ignicao: vagasIniciais.ignicao !== undefined ? apply(vagasIniciais.ignicao) : undefined,
  };
}

// ============================================================
// ROTATIVOS — variedade de copy sem repetir dia a dia.
// ============================================================
export function rotate(bank: string[], position: number, offset = 0): string {
  if (!bank || bank.length === 0) return "";
  return bank[(position + offset) % bank.length];
}

// ============================================================
// DEPOIMENTO — nome/valor/situação sorteados pelo MESMO índice
// (garante consistência matemática entre valor e situação).
// ============================================================
export interface Depoimento {
  nome: string;
  valor: string;
  situacao: string;
}

export function sortearDepoimento(nomes: string[], valores: string[], situacoes: string[]): Depoimento | null {
  if (valores.length === 0 || situacoes.length === 0 || nomes.length === 0) return null;
  const idx = Math.floor(Math.random() * situacoes.length);
  const nome = nomes[Math.floor(Math.random() * nomes.length)];
  return { nome, valor: valores[idx % valores.length], situacao: situacoes[idx] };
}

// ============================================================
// CARACTERES — aviso de mensagem muito longa pro WhatsApp.
// ============================================================
export type CharCountLevel = "normal" | "high" | "veryhigh";

export function charCountLevel(text: string): { chars: number; level: CharCountLevel } {
  const chars = text.length;
  if (chars > 1500) return { chars, level: "veryhigh" };
  if (chars > 900) return { chars, level: "high" };
  return { chars, level: "normal" };
}

// ============================================================
// GUARD DE SEGURANÇA — bloqueia mensagem que prometeria lucro negativo.
// ============================================================
export function isResultBlocked(text: string, computedValues: number[]): boolean {
  const hasNegative = computedValues.some((v) => v < 0);
  const menciona = /R\$|lucro|lucra/i.test(text);
  return hasNegative && menciona;
}

// ============================================================
// TEMPLATE RESOLVER — substitui ${var} por valores calculados.
// ============================================================
export function resolveTemplate(template: string, vars: Record<string, string | number>): string {
  let text = template;
  for (const [key, value] of Object.entries(vars)) {
    text = text.split(`\${${key}}`).join(String(value));
  }
  return text;
}
