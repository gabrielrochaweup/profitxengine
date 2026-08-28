import type { TradingWindow } from "@/lib/supabase/types";

/**
 * Engine de cálculo portada fielmente dos HTMLs de referência (Método TRIAD —
 * dinâmicas Batalha/Bônus/Kamikaze/Maratona/Mentoria/Premium). Mesma lógica,
 * mesmas fórmulas — só trocou de JS solto no HTML pra TS compartilhado.
 */

export interface ProductResult {
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

export function getResult(acerto: number, fonte: TradingWindow): ProductResult {
  return { acerto, fonte };
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

export function calcularMelhorCenario(acertoPorJanela: Record<TradingWindow, number>): MelhorCenario | null {
  let best: MelhorCenario | null = null;
  for (const { window, peso } of WINDOW_WEIGHTS) {
    const acerto = acertoPorJanela[window] ?? 0;
    const score = acerto * peso;
    if (!best || score > best.score) {
      best = { fonte: window, acerto, score };
    }
  }
  return best;
}

export function calcularMelhorCenarioCopy(
  acertoPorJanela: Record<TradingWindow, number>,
  rendimentoPorJanela: Record<TradingWindow, number>
): MelhorCenario | null {
  let best: MelhorCenario | null = null;
  for (const { window, peso } of WINDOW_WEIGHTS) {
    const acerto = acertoPorJanela[window] ?? 0;
    const rend = rendimentoPorJanela[window] ?? 0;
    const score = (rend * 10 + acerto) * peso;
    if (!best || score > best.score) {
      best = { fonte: window, acerto, score };
    }
  }
  return best;
}

// ============================================================
// MELHOR CENÁRIO DO TRIAD — a mensagem de placar mostra Pepe + Live +
// Copy juntos, então a janela escolhida não pode ser "a melhor pro Pepe" e
// ignorar que o Copy foi mal nela. Usa o MÍNIMO entre os três produtos (o
// elo mais fraco limita a janela inteira) em vez de média — senão um Pepe
// excelente disfarça um Copy ruim na mesma semana. Rendimento negativo do
// Copy pesa muito mais que o % de acerto sozinho: prometer prejuízo não
// pode "vencer" só porque o placar (V x D) parece razoável.
// ============================================================
export function calcularMelhorCenarioTriad(
  acertoPepe: Record<TradingWindow, number>,
  acertoLive: Record<TradingWindow, number>,
  acertoCopy: Record<TradingWindow, number>,
  rendimentoCopy: Record<TradingWindow, number>
): MelhorCenario | null {
  let best: MelhorCenario | null = null;
  for (const { window, peso } of WINDOW_WEIGHTS) {
    const pepe = acertoPepe[window] ?? 0;
    const live = acertoLive[window] ?? 0;
    const copy = acertoCopy[window] ?? 0;
    const rend = rendimentoCopy[window] ?? 0;
    const copyScore = rend < 0 ? rend * 10 : copy;
    const geral = Math.min(pepe, live, copyScore);
    const score = geral * peso;
    if (!best || score > best.score) {
      best = { fonte: window, acerto: Math.round((pepe + live + copy) / 3), score };
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
// MARATONA — escala progressiva de alavancagem por depósito.
// Fórmula reconstruída a partir dos exemplos reais dos templates
// (conferida contra dezenas de pares depósito→resultado): de $200 a
// $999 fica fixo em 50%; a partir de $1.000 cresce linearmente
// +0,5% a cada $1 depositado (equivalente a +5% a cada $1.000), sem
// teto. Ex.: $7.500 → 87,5% → lucro R$ 36.094 (cotação 5,5).
// ============================================================
export function pctEscalaMaratona(depositoUSD: number): number {
  if (depositoUSD < 200) return 0;
  if (depositoUSD < 1000) return 50;
  return 50 + depositoUSD * 0.005;
}

export interface ResultadoMaratona {
  pct: number;
  lucroUSD: number;
  lucroBRL: number;
  totalUSD: number;
  totalBRL: number;
}

export function calcResultadoMaratona(depositoUSD: number, cotacao: number): ResultadoMaratona {
  const pct = pctEscalaMaratona(depositoUSD);
  const lucroUSD = depositoUSD * (pct / 100);
  const totalUSD = depositoUSD + lucroUSD;
  return {
    pct,
    lucroUSD,
    lucroBRL: lucroUSD * cotacao,
    totalUSD,
    totalBRL: totalUSD * cotacao,
  };
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
