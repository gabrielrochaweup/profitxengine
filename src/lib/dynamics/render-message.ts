import type { RotatingBanks, TradingWindow, VagasConfig } from "@/lib/supabase/types";
import {
  calcLucroLiveUSD,
  calcLucroPepeUSD,
  calcRendimentoCopy,
  calcResultadoMaratona,
  fmtBR,
  fonteFraseLucro,
  fonteFrasePlacar,
  getResult,
  rotate,
  toReais,
  vagasNaPosicao,
  type Depoimento,
  type TradingConfigValues,
  type WindowCount,
} from "./calc-engine";

// Valores de depósito usados como exemplo nos templates da dinâmica "Maratona".
const MARATONA_EXEMPLOS_USD = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000];

export interface ProductStatsByWindow {
  pepe: Record<TradingWindow, WindowCount>;
  live: Record<TradingWindow, WindowCount>;
  copy: Record<TradingWindow, WindowCount>;
  copyRendimento: Record<TradingWindow, number>;
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
  const { template, position, totalSlots, fonte, rotatingBanks, extraVars, vagasConfig, stats, config, depoimento } =
    input;

  const pepe = getResult(stats.pepe[fonte].wins, stats.pepe[fonte].losses, fonte);
  const live = getResult(stats.live[fonte].wins, stats.live[fonte].losses, fonte);
  const copy = getResult(stats.copy[fonte].wins, stats.copy[fonte].losses, fonte);
  const rendPct = stats.copyRendimento[fonte] ?? 0;

  const lucroPepeUSD = calcLucroPepeUSD(pepe.wins, pepe.losses, config.entradaPepe, config.payoutPepeLive);
  const lucroLiveUSD = calcLucroLiveUSD(live.wins, live.losses, config.entradaLive, config.payoutPepeLive);
  const lucroPepeR = toReais(lucroPepeUSD, config.cotacao);
  const lucroLiveR = toReais(lucroLiveUSD, config.cotacao);
  const rendimentoCopy = calcRendimentoCopy(config.bancaCopy, rendPct) * config.cotacao;

  const live50 = toReais(calcLucroLiveUSD(live.wins, live.losses, 50, config.payoutPepeLive), config.cotacao);
  const live100 = toReais(calcLucroLiveUSD(live.wins, live.losses, 100, config.payoutPepeLive), config.cotacao);
  const live500 = toReais(calcLucroLiveUSD(live.wins, live.losses, 500, config.payoutPepeLive), config.cotacao);
  const live1000 = toReais(calcLucroLiveUSD(live.wins, live.losses, 1000, config.payoutPepeLive), config.cotacao);
  const live2000 = toReais(calcLucroLiveUSD(live.wins, live.losses, 2000, config.payoutPepeLive), config.cotacao);

  const totalWins = pepe.wins + live.wins + copy.wins;
  const totalLosses = pepe.losses + live.losses + copy.losses;
  const acertoTotal = totalWins + totalLosses > 0 ? Math.round((totalWins / (totalWins + totalLosses)) * 100) : 0;
  const totalTriadR = lucroPepeR + lucroLiveR + rendimentoCopy;

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
    winsP: pepe.wins,
    lossP: pepe.losses,
    acertoP: pepe.acerto,
    fontePepe: fonte,
    lucroPepeR: fmtBR(lucroPepeR),
    entradaP: config.entradaPepe,
    // Live
    winsL: live.wins,
    lossL: live.losses,
    acertoL: live.acerto,
    fonteLive: fonte,
    lucroLiveR: fmtBR(lucroLiveR),
    entradaL: config.entradaLive,
    lucroLive50R: fmtBR(live50),
    lucroLive100R: fmtBR(live100),
    lucroLive500R: fmtBR(live500),
    lucroLive1000R: fmtBR(live1000),
    lucroLive2000R: fmtBR(live2000),
    // Copy
    winsC: copy.wins,
    lossC: copy.losses,
    acertoC: copy.acerto,
    fonteCopy: fonte,
    rendimentoCopyR: fmtBR(rendimentoCopy),
    bancaCopy: fmtBR(config.bancaCopy),
    // TRIAD total
    totalTriadR: fmtBR(totalTriadR),
    totalWinsT: totalWins,
    totalLossT: totalLosses,
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
  };

  let text = template;
  for (const [key, value] of Object.entries(vars)) {
    text = text.split(`\${${key}}`).join(String(value));
  }

  return {
    text,
    computedValues: [lucroPepeUSD, lucroLiveUSD, rendimentoCopy, totalTriadR],
  };
}
