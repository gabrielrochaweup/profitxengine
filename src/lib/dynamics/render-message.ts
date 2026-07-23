import type { RotatingBanks, TradingWindow, Top5Config, VagasConfig } from "@/lib/supabase/types";
import {
  calcRendimentoCopy,
  calcResultadoMaratona,
  fmtBR,
  fonteFraseLucro,
  fonteFrasePlacar,
  getResult,
  rotate,
  vagasNaPosicao,
  type Depoimento,
  type TradingConfigValues,
} from "./calc-engine";

// Valores de depósito usados como exemplo nos templates da dinâmica "Maratona".
const MARATONA_EXEMPLOS_USD = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000];

export interface ProductStatsByWindow {
  pepe: Record<TradingWindow, number>;
  live: Record<TradingWindow, number>;
  copy: Record<TradingWindow, number>;
  copyRendimento: Record<TradingWindow, number>;
  // Placar bruto (vitórias/derrotas) por produto e janela — junto com o %
  // de acerto, não em vez dele.
  pepeWins: Record<TradingWindow, number>;
  pepeLosses: Record<TradingWindow, number>;
  liveWins: Record<TradingWindow, number>;
  liveLosses: Record<TradingWindow, number>;
  copyWins: Record<TradingWindow, number>;
  copyLosses: Record<TradingWindow, number>;
}

export interface RenderSlotInput {
  template: string;
  position: number;
  totalSlots: number;
  fonte: TradingWindow;
  rotatingBanks: RotatingBanks;
  extraVars: Record<string, string>;
  vagasConfig: VagasConfig;
  stats: ProductStatsByWindow;
  config: TradingConfigValues;
  depoimento?: Depoimento | null;
  top5?: Top5Config | null;
}

const TOP5_MEDALS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
const TOP5_PLACEHOLDER = "${top5_bloco}";

// Enquanto ninguém preenche o TOP 5 real em Performance de Trading, o bloco
// não pode ficar vazio — usa esse valor fictício pré-estipulado por posição
// (1º a 5º lugar) e vai crescendo a cada mensagem enviada no dia, pra
// simular resultado se acumulando organicamente. Assim que o admin preenche
// os valores reais (top5.enabled = true), esse cálculo fictício deixa de
// valer e os 5 valores fixos passam a aparecer sempre iguais.
const TOP5_FICTICIO_BASE = [3000, 2200, 1600, 1100, 700];
const TOP5_FICTICIO_CRESCIMENTO_POR_SLOT = [200, 150, 100, 70, 40];

// Usado pra sinalizar na lista de mensagens (Dinâmicas do Dia) quais slots
// dependem do TOP 5 global — essas não podem ser agendadas antes de alguém
// atualizar os valores em Performance de Trading.
export function hasTop5Placeholder(template: string): boolean {
  return template.includes(TOP5_PLACEHOLDER);
}

// Monta o bloco "TOP 5 ACUMULADO". Com valores reais preenchidos (Performance
// de Trading → TOP 5, igual ao placar/% de acerto), usa eles fixos. Sem
// preenchimento, usa o fictício crescente acima com base na posição da
// mensagem no dia.
function buildTop5Bloco(config: Top5Config | null | undefined, position: number): string {
  const values = config?.enabled
    ? config.values.slice(0, 5)
    : TOP5_FICTICIO_BASE.map((base, i) => base + TOP5_FICTICIO_CRESCIMENTO_POR_SLOT[i] * position);
  const linhas = values.map(
    (valor, i) => `${TOP5_MEDALS[i] ?? `${i + 1}º`} ${i + 1}º → *$${Math.round(valor).toLocaleString("en-US")}*`
  );
  return ["🏆 *TOP 5 ACUMULADO DO FDS:*", ...linhas].join("\n");
}

export interface RenderSlotOutput {
  text: string;
  computedValues: number[];
}

function bankValue(banks: RotatingBanks, name: string, position: number): string {
  const bank = banks[name];
  if (!bank || bank.length === 0) return "";
  return rotate(bank, position);
}

export function renderSlot(input: RenderSlotInput): RenderSlotOutput {
  const {
    template,
    position,
    totalSlots,
    fonte,
    rotatingBanks,
    extraVars,
    vagasConfig,
    stats,
    config,
    depoimento,
    top5,
  } = input;

  const pepe = getResult(stats.pepe[fonte], fonte);
  const live = getResult(stats.live[fonte], fonte);
  const copy = getResult(stats.copy[fonte], fonte);
  const rendPct = stats.copyRendimento[fonte] ?? 0;

  const rendimentoCopy = calcRendimentoCopy(config.bancaCopy, rendPct) * config.cotacao;
  const acertoTotal = Math.round((pepe.acerto + live.acerto + copy.acerto) / 3);

  const vagasMode = vagasConfig.mode ?? "tiered";
  const vagas =
    vagasMode === "tiered"
      ? vagasNaPosicao(
          {
            turbo: vagasConfig.turbo ?? 0,
            suprema: vagasConfig.suprema ?? 0,
            lendaria: vagasConfig.lendaria ?? 0,
            galactica: vagasConfig.galactica ?? 0,
            ignicao: vagasConfig.ignicao,
          },
          vagasConfig.curva ?? "linear",
          position,
          totalSlots
        )
      : { turbo: 0, suprema: 0, lendaria: 0, galactica: 0, ignicao: 0 };
  const vagasTotais = (vagas.turbo ?? 0) + (vagas.suprema ?? 0) + (vagas.lendaria ?? 0) + (vagas.galactica ?? 0);

  // Exemplos de resultado da escala progressiva da Maratona (${mLucroX}/${mTotalX}),
  // calculados a partir da cotação real em vez de fixos no texto.
  const maratonaExemplos = Object.fromEntries(
    MARATONA_EXEMPLOS_USD.flatMap((valor) => {
      const resultado = calcResultadoMaratona(valor, config.cotacao);
      return [
        [`mLucro${valor}`, fmtBR(resultado.lucroBRL)],
        [`mTotal${valor}`, fmtBR(resultado.totalBRL)],
      ];
    })
  );
  const escalaMaratona = [
    "$200 a $999 → *50%*",
    `$1.000 → *${fmtBR(calcResultadoMaratona(1000, config.cotacao).pct)}%*`,
    `$2.000 → *${fmtBR(calcResultadoMaratona(2000, config.cotacao).pct)}%*`,
    `$3.000 → *${fmtBR(calcResultadoMaratona(3000, config.cotacao).pct)}%*`,
    `$5.000 → *${fmtBR(calcResultadoMaratona(5000, config.cotacao).pct)}%*`,
    `$10.000 → *${fmtBR(calcResultadoMaratona(10000, config.cotacao).pct)}%* (DOBRA a banca!)`,
    `$20.000 → *${fmtBR(calcResultadoMaratona(20000, config.cotacao).pct)}%* (TRIPLICA!)`,
    `$30.000 → *${fmtBR(calcResultadoMaratona(30000, config.cotacao).pct)}%* (QUADRUPLICA!)`,
  ].join("\n");

  const vars: Record<string, string | number> = {
    ...maratonaExemplos,
    escalaMaratona,
    // Bancos rotativos genéricos — qualquer ${nomeDoBanco} definido em rotating_banks
    ...Object.fromEntries(Object.keys(rotatingBanks).map((name) => [name, bankValue(rotatingBanks, name, position)])),
    // Variáveis extras fixas/editáveis por dinâmica (links, cláusulas, etc.)
    ...extraVars,
    // Vagas
    vagasI: vagas.ignicao ?? 0,
    vagasT: vagas.turbo,
    vagasS: vagas.suprema,
    vagasL: vagas.lendaria,
    vagasG: vagas.galactica,
    vagasTotais,
    // Pepe
    acertoP: pepe.acerto,
    winsP: stats.pepeWins[fonte] ?? 0,
    lossP: stats.pepeLosses[fonte] ?? 0,
    fontePepe: fonte,
    entradaP: config.entradaPepe,
    // Live
    acertoL: live.acerto,
    winsL: stats.liveWins[fonte] ?? 0,
    lossL: stats.liveLosses[fonte] ?? 0,
    fonteLive: fonte,
    entradaL: config.entradaLive,
    // Copy
    acertoC: copy.acerto,
    winsC: stats.copyWins[fonte] ?? 0,
    lossC: stats.copyLosses[fonte] ?? 0,
    fonteCopy: fonte,
    rendimentoCopyR: fmtBR(rendimentoCopy),
    bancaCopy: fmtBR(config.bancaCopy),
    // TRIAD total
    fonteTRIAD: fonte,
    acertoT: acertoTotal,
    // Fontes com preposição correta
    fontePlacar: fonteFrasePlacar(fonte),
    fonteLucro: fonteFraseLucro(fonte),
    fonteLivePlacar: fonteFrasePlacar(fonte),
    fonteLucroLive: fonteFraseLucro(fonte),
    fonteCopyPlacar: fonteFrasePlacar(fonte),
    fonteCopyLucro: fonteFraseLucro(fonte),
    fonteTriadPlacar: fonteFrasePlacar(fonte),
    fonteTriadLucro: fonteFraseLucro(fonte),
    // Depoimento (se a dinâmica tiver slot de depoimento)
    depNome: depoimento?.nome ?? "",
    depValor: (depoimento?.valor ?? "").replace("R$ ", ""),
    depSituacao: depoimento?.situacao ?? "",
    // TOP 5 acumulado (global, Performance de Trading)
    top5_bloco: buildTop5Bloco(top5, position),
  };

  let text = template;
  for (const [key, value] of Object.entries(vars)) {
    text = text.split(`\${${key}}`).join(String(value));
  }

  return {
    text,
    computedValues: [rendimentoCopy],
  };
}
