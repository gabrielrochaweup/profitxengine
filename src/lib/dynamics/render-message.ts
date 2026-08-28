import type { RotatingBanks, TradingWindow, VagasConfig } from "@/lib/supabase/types";
import {
  calcAlavancagem,
  calcRendimentoCopy,
  fmtBR,
  fonteFraseLucro,
  fonteFrasePlacar,
  getResult,
  rotate,
  snipersExtras,
  tierCeilingPct,
  vagasIniciaisDoDia,
  vagasNaPosicao,
  type Depoimento,
  type PlanoAlavancagem,
  type TradingConfigValues,
} from "./calc-engine";

// Valores de depósito usados como exemplo nos templates das dinâmicas com
// Alavancagem (Maratona, Batalha, Bônus, Mentoria, Premium) — mesmo conjunto
// pros dois usos (exemplos de escala progressiva e exemplos de faixa+plano).
const EXEMPLOS_DEPOSITO_USD = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000];
const PLANOS_ALAVANCAGEM: PlanoAlavancagem[] = ["start", "pro", "elite"];

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
  // Só a Maratona usa a tabela de faixas do fim de semana (+5 pontos em
  // toda faixa) — as demais dinâmicas usam a tabela padrão de segunda a sexta.
  isWeekend?: boolean;
  // Data (YYYY-MM-DD) da dinâmica sendo renderizada e slug da dinâmica —
  // seed do sorteio diário de vagas (não pode ficar fixo no mesmo número
  // todo dia — Regra Permanente 2).
  dateKey: string;
  dynamicSlug: string;
}

// Frases de apoio pro bloco "faixa exclusiva" (ordem de serviço "Ajuste das
// Mensagens das Dinâmicas", Tarefa 1 — substitui o antigo TOP 5: em vez de
// ranking/disputa por maior depósito, puxa ticket alto mostrando a própria
// escada de faixas + tratamento exclusivo pra quem deposita mais).
const FAIXA_EXCLUSIVA_FRASES = [
  "Quanto maior a banca, maior a faixa — é o tamanho da operação que muda",
  "Ticket alto tem tratamento direto com o comercial",
  "A faixa Galáctica é a maior da tabela — e ainda soma o bônus do teu plano",
];

function buildFaixaExclusivaBloco(position: number, isWeekend: boolean): string {
  const galacticaPct = tierCeilingPct(10000, isWeekend);
  return [
    `🌀 *GALÁCTICA | $10.000+ → até ${galacticaPct}% + bônus do teu plano*`,
    "🔒 Acima de $30.000: condições especiais exclusivas — fala com o comercial",
    rotate(FAIXA_EXCLUSIVA_FRASES, position),
  ].join("\n");
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
    isWeekend = false,
    dateKey,
    dynamicSlug,
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
          vagasIniciaisDoDia(dateKey, dynamicSlug, (vagasConfig.ignicao ?? 0) > 0),
          vagasConfig.curva ?? "linear",
          position,
          totalSlots
        )
      : { turbo: 0, suprema: 0, lendaria: 0, galactica: 0, ignicao: 0 };
  const vagasTotais = (vagas.turbo ?? 0) + (vagas.suprema ?? 0) + (vagas.lendaria ?? 0) + (vagas.galactica ?? 0);

  // Exemplos de Alavancagem por faixa (todas as dinâmicas) — sempre pelo
  // TETO da faixa do depósito, em tempo real a partir da cotação.
  // ${lucroXElite}/${totalXElite} etc. pros planos com bônus (Start/Pró/
  // Elite, vale em toda dinâmica inclusive Maratona); ${lucroX}/${totalX}
  // sem plano (Mentoria/Premium) e ${snipersX} só pro Premium. Na Maratona
  // (isWeekend), a faixa usa a tabela de fim de semana (+5 pontos) — e
  // ${mLucroX}/${mTotalX} (nome herdado dos templates antigos) ficam como
  // alias de ${lucroXElite}/${totalXElite} pra não precisar editar o texto.
  const alavancagemExemplos = Object.fromEntries(
    EXEMPLOS_DEPOSITO_USD.flatMap((valor) => {
      const semPlano = calcAlavancagem(valor, config.cotacao, undefined, isWeekend);
      const porPlano = PLANOS_ALAVANCAGEM.flatMap((plano) => {
        const r = calcAlavancagem(valor, config.cotacao, plano, isWeekend);
        const sufixo = plano.charAt(0).toUpperCase() + plano.slice(1);
        return [
          [`lucro${valor}${sufixo}`, fmtBR(r.lucroBRL)],
          [`total${valor}${sufixo}`, fmtBR(r.totalBRL)],
        ];
      });
      const elite = calcAlavancagem(valor, config.cotacao, "elite", isWeekend);
      const start = calcAlavancagem(valor, config.cotacao, "start", isWeekend);
      return [
        [`lucro${valor}`, fmtBR(semPlano.lucroBRL)],
        [`total${valor}`, fmtBR(semPlano.totalBRL)],
        [`mLucro${valor}`, fmtBR(elite.lucroBRL)],
        [`mTotal${valor}`, fmtBR(elite.totalBRL)],
        [`snipers${valor}`, snipersExtras(valor)],
        [`diferencaEliteStart${valor}`, fmtBR(elite.totalBRL - start.totalBRL)],
        ...porPlano,
      ];
    })
  );

  // Tabela de faixas (${escalaMaratona}) — mesmo texto pras duas versões
  // (padrão e FDS), só troca os tetos conforme isWeekend.
  const tetoTxt = (tier: "ignicao" | "turbo" | "suprema" | "lendaria" | "galactica") => {
    const deposito = { ignicao: 200, turbo: 500, suprema: 2000, lendaria: 5000, galactica: 10000 }[tier];
    return fmtBR(tierCeilingPct(deposito, isWeekend));
  };
  const escalaMaratona = [
    `🔥 IGNIÇÃO $200 – $499 → até *${tetoTxt("ignicao")}%*`,
    `⚡ TURBO $500 – $1.999 → até *${tetoTxt("turbo")}%*`,
    `💥 SUPREMA $2.000 – $4.999 → até *${tetoTxt("suprema")}%*`,
    `👑 LENDÁRIA $5.000 – $9.999 → até *${tetoTxt("lendaria")}%*`,
    `🌀 GALÁCTICA $10.000+ → até *${tetoTxt("galactica")}%*`,
    "🔒 Acima de $30.000: condições especiais exclusivas — fala com o comercial",
  ].join("\n");

  const vars: Record<string, string | number> = {
    ...alavancagemExemplos,
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
    // Faixa exclusiva (substitui o antigo TOP 5 — ver Tarefa 1)
    faixa_exclusiva: buildFaixaExclusivaBloco(position, isWeekend),
  };

  let text = template;
  for (const [key, value] of Object.entries(vars)) {
    text = text.split(`\${${key}}`).join(String(value));
  }

  // Rodapé fixo obrigatório em toda mensagem de dinâmica (ordem de serviço
  // "Ajuste das Mensagens das Dinâmicas") — colado aqui no motor em vez de
  // em cada template pra garantir que nenhuma mensagem saia sem ele.
  text = `${text}\n\n_Valores são projeção, não garantia. Opere com capital de risco._`;

  return {
    text,
    computedValues: [rendimentoCopy],
  };
}
