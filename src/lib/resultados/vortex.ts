import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Resultados do dia vindos da Vortex (a plataforma onde a equipe lança o
 * placar de Live, PEPE e Copy).
 *
 * Duas portas, um formato só:
 * - a Vortex MANDA (webhook) assim que a equipe salva o dia lá;
 * - o botão "Atualizar resultados" VAI BUSCAR (GET abaixo), com o mesmo
 *   token do endpoint.
 *
 * Contrato combinado com o dev da Vortex (setembro/2026): "live" no singular;
 * cada pilar com "operou" true/false; "preenchido" false quando o dia ainda
 * não foi lançado; taxa e rentabilidade como número; rentabilidade só no
 * Copy; acumulado de 7 e 30 dias junto.
 *
 * O leitor é tolerante nos NOMES (o JSON exato só aparece quando o token
 * existe) mas rígido no que grava: pilar que não for reconhecido não é
 * escrito — nunca vira "0x0" por não ter sido lido.
 */
export const VORTEX_RESULTADOS_URL = "https://profitx.digvortex.com/integracao/resultados";

export type Pilar = "pepe" | "live" | "copy";
const PILARES: Pilar[] = ["live", "pepe", "copy"];

// Nomes aceitos pra cada pilar no JSON. "live" é o combinado; os outros
// cobrem uma variação de escrita sem virar pilar ignorado em silêncio.
const NOMES_DO_PILAR: Record<Pilar, string[]> = {
  live: ["live", "lives", "live_traders"],
  pepe: ["pepe", "pepe_signal", "pepesignal"],
  copy: ["copy", "copy_trader", "copytrader"],
};

export interface JanelaLida {
  wins: number;
  losses: number;
  acerto: number;
  /** Só Copy. null = não veio — não é zero. */
  rendimento: number | null;
  /**
   * Janela sem nenhuma operação. A Vortex manda "placar": "" e "taxa": null
   * — e avisou de propósito: 0% diria que erramos tudo num período em que
   * talvez nada tenha acontecido. Aqui ela vira placar vazio, e a escolha
   * automática da mensagem não usa janela vazia (o score dela é zero).
   */
  semOperacao?: boolean;
}

export interface PilarLido {
  operou: boolean;
  dia: JanelaLida | null;
  semana: JanelaLida | null;
  mes: JanelaLida | null;
  /**
   * % do acumulado quando ele veio SEM placar (o formato de set/2026:
   * "acumulado": { "sete_dias": 87.9 }). Não é gravado — as mensagens
   * mostram placar e % juntos, e % sozinha não fecha a conta. Fica só pra
   * dizer na tela o que chegou.
   */
  semanaSoTaxa: number | null;
  mesSoTaxa: number | null;
  /** Rentabilidade do dia (Copy). Pode vir mesmo com o placar vazio. */
  rentabilidadeDia: number | null;
}

export interface ResultadoLido {
  /** YYYY-MM-DD */
  data: string;
  preenchido: boolean;
  texto: string | null;
  pilares: Partial<Record<Pilar, PilarLido>>;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function numero(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v.replace(",", ".")))) {
    return Number(v.replace(",", "."));
  }
  return null;
}

const PARES_DE_PLACAR: [string, string][] = [
  ["vitorias", "derrotas"],
  ["wins", "losses"],
  ["win", "loss"],
  ["acertos", "erros"],
  ["greens", "reds"],
  ["green", "red"],
  ["v", "d"],
];

/** "9x1", "9 x 1", { vitorias: 9, derrotas: 1 }, { wins, losses }... */
function lerPlacar(obj: unknown): { wins: number; losses: number } | null {
  if (typeof obj === "string") {
    const m = obj.match(/^\s*(\d+)\s*[xX×]\s*(\d+)\s*$/);
    return m ? { wins: Number(m[1]), losses: Number(m[2]) } : null;
  }
  if (!isRecord(obj)) return null;
  if (obj.placar !== undefined) {
    const dentro = lerPlacar(obj.placar);
    if (dentro) return dentro;
  }
  for (const [kw, kl] of PARES_DE_PLACAR) {
    const w = numero(obj[kw]);
    const l = numero(obj[kl]);
    if (w !== null && l !== null && w >= 0 && l >= 0) return { wins: Math.round(w), losses: Math.round(l) };
  }
  return null;
}

// % de acerto pelo placar — a MESMA regra do painel manual
// (trading-performance-panel.tsx), pra um dia sincronizado sair idêntico a
// um digitado. A taxa da Vortex só entra quando não há placar pra derivar.
function lerJanela(obj: unknown): JanelaLida | null {
  if (!isRecord(obj)) return null;
  const placar = lerPlacar(obj);
  if (!placar) return null;
  const total = placar.wins + placar.losses;
  const taxa = numero(obj.taxa);
  const acerto = total > 0 ? Math.round((placar.wins / total) * 100) : taxa !== null ? Math.round(taxa) : 0;
  const rendimento = numero(obj.rentabilidade) ?? numero(obj.rendimento);
  return { ...placar, acerto, rendimento, semOperacao: total === 0 && taxa === null };
}

// Janela que veio, mas vazia: "placar": "" e "taxa": null, sem vitórias
// nem derrotas. É diferente de janela que não veio.
function janelaVazia(obj: Record<string, unknown>): JanelaLida | null {
  const semPlacar = obj.placar === "" || obj.placar === null || obj.placar === undefined;
  const semTaxa = obj.taxa === null || obj.taxa === undefined;
  const semContagem = !(numero(obj.vitorias) ?? 0) && !(numero(obj.derrotas) ?? 0);
  if (!(semPlacar && semTaxa && semContagem)) return null;
  // O Copy pode ter rentabilidade medida mesmo sem placar lançado.
  const rendimento = numero(obj.rentabilidade) ?? numero(obj.rendimento);
  return { wins: 0, losses: 0, acerto: 0, rendimento, semOperacao: true };
}

// Como a chave de cada acumulado pode estar escrita. O formato real da
// Vortex usa por extenso ("sete_dias", "trinta_dias"); os dígitos cobrem
// "7d", "acumulado_7d", "rentabilidade_30d". O [^0-9] em volta impede que o
// 7 case dentro de "70" ou o 30 dentro de "300".
const CHAVE_DO_ACUMULADO: Record<7 | 30, RegExp> = {
  7: /(^|[^0-9])7([^0-9]|$)|sete/i,
  30: /(^|[^0-9])30([^0-9]|$)|trinta/i,
};

// Campos que podem vir "soltos" com o sufixo da janela, no formato das
// equipes do Copy ("rentabilidade_7d") ou num "vitorias_sete_dias".
const CAMPOS_SOLTOS = ["vitorias", "derrotas", "wins", "losses", "placar", "taxa", "rentabilidade", "rendimento"];

/**
 * O acumulado de N dias, em qualquer dos formatos:
 *   "acumulado": { "sete_dias": { "vitorias": 90, "derrotas": 10, ... } }  ← completo
 *   "acumulado": { "sete_dias": 87.9 }                                       ← só a %
 *   "vitorias_sete_dias": 90, "derrotas_sete_dias": 10                       ← solto
 */
function lerAcumulado(pilar: Record<string, unknown>, dias: 7 | 30): { janela: JanelaLida | null; soTaxa: number | null } {
  const padrao = CHAVE_DO_ACUMULADO[dias];
  let soTaxa: number | null = null;
  const soltos: Record<string, unknown> = {};

  for (const fonte of [pilar.acumulado, pilar.acumulados, pilar]) {
    if (!isRecord(fonte)) continue;
    for (const [chave, valor] of Object.entries(fonte)) {
      if (!padrao.test(chave)) continue;
      if (isRecord(valor)) {
        const janela = lerJanela(valor) ?? janelaVazia(valor);
        if (janela) return { janela, soTaxa: null };
        soTaxa ??= numero(valor.taxa);
        continue;
      }
      const campo = CAMPOS_SOLTOS.find((c) => chave.toLowerCase().startsWith(c));
      if (campo) soltos[campo] = valor;
      else if (numero(valor) !== null) soTaxa ??= numero(valor);
    }
  }

  const janela = lerJanela(soltos);
  return janela ? { janela, soTaxa: null } : { janela: null, soTaxa: soTaxa ?? numero(soltos.taxa) };
}

function lerPilar(obj: unknown): PilarLido | null {
  if (!isRecord(obj)) return null;
  const operou = obj.operou !== false;
  const semana = lerAcumulado(obj, 7);
  const mes = lerAcumulado(obj, 30);
  return {
    operou,
    dia: operou ? lerJanela(obj) : null,
    semana: semana.janela,
    mes: mes.janela,
    semanaSoTaxa: semana.soTaxa,
    mesSoTaxa: mes.soTaxa,
    rentabilidadeDia: numero(obj.rentabilidade) ?? numero(obj.rendimento),
  };
}

function lerData(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return br ? `${br[3]}-${br[2]}-${br[1]}` : null;
}

export function lerResultadoVortex(raw: unknown): ResultadoLido | { erro: string } {
  const item = Array.isArray(raw) ? raw[0] : raw;
  if (!isRecord(item)) return { erro: "Payload vazio ou não é um objeto JSON." };

  // O resultado pode vir na raiz ou embrulhado ("resultado" ou "data" como
  // objeto). "data" como TEXTO é a data do dia, não um embrulho.
  const raiz = isRecord(item.resultado) ? item.resultado : isRecord(item.data) ? item.data : item;

  const data = lerData(raiz.data) ?? lerData(raiz.dia) ?? lerData(raiz.date) ?? lerData(item.data) ?? lerData(item.dia);
  if (!data) return { erro: "Sem a data do dia no payload." };

  const blocoDosPilares = isRecord(raiz.pilares) ? raiz.pilares : raiz;
  const pilares: Partial<Record<Pilar, PilarLido>> = {};
  for (const pilar of PILARES) {
    const chave = NOMES_DO_PILAR[pilar].find((n) => isRecord(blocoDosPilares[n]));
    const lido = chave ? lerPilar(blocoDosPilares[chave]) : null;
    if (lido) pilares[pilar] = lido;
  }

  return {
    data,
    // Só "false" explícito é "não lançado". Ausente conta como lançado, mas
    // nada é gravado sem placar reconhecido, então ausência não inventa dado.
    preenchido: raiz.preenchido !== false && item.preenchido !== false,
    texto: typeof raiz.texto === "string" ? raiz.texto : typeof item.texto === "string" ? item.texto : null,
    pilares,
  };
}

/* ─────────────────────────── gravação ─────────────────────────── */

type Admin = SupabaseClient<Database>;
type StatsInsert = Database["public"]["Tables"]["trading_performance_stats"]["Insert"];
type Janela = "dia" | "semana" | "mes" | "total";

export interface ResultadoProcessado {
  data: string;
  preenchido: boolean;
  aplicado: boolean;
  motivo: string | null;
  texto: string | null;
  /** O que foi escrito, por pilar e janela — pra tela conferir. */
  gravado: Partial<Record<Pilar, Partial<Record<Janela, string>>>>;
}

function fmtJanela(j: { wins: number; losses: number; acerto: number }): string {
  return `${j.wins}x${j.losses} · ${j.acerto}%`;
}

/**
 * Registra o dia (sempre) e, quando cabe, grava nos resultados que as
 * dinâmicas usam (trading_performance_stats).
 *
 * Mapeamento das janelas:
 *   Dia    ← placar do dia        (nas mensagens, "Dia" é lido como "de ontem")
 *   Semana ← acumulado de 7 dias
 *   Mês    ← acumulado de 30 dias
 *   Total  ← igual ao Mês
 *
 * Total = Mês porque a Vortex não manda acumulado desde o início, e somar
 * as janelas (como o painel fazia) contaria o mesmo dia três vezes: o 7 e o
 * 30 da Vortex já incluem o dia. Mês e Total iguais não mudam a escolha
 * automática da mensagem (Mês pesa mais no desempate), e nenhum número
 * inflado chega na mensagem.
 */
export async function processarResultado(
  admin: Admin,
  productId: string,
  raw: unknown,
  origem: "webhook" | "botao"
): Promise<ResultadoProcessado | { erro: string }> {
  const lido = lerResultadoVortex(raw);
  if ("erro" in lido) return lido;

  const gravado: ResultadoProcessado["gravado"] = {};
  const naoLidos = PILARES.filter((p) => !lido.pilares[p]);

  let aplicado = false;
  let motivo: string | null = null;

  if (!lido.preenchido) {
    motivo = "Dia ainda não lançado na Vortex — nada foi alterado.";
  } else if (Object.keys(lido.pilares).length === 0) {
    motivo = "Nenhum pilar reconhecido no payload — nada foi alterado.";
  } else {
    // Correção de um dia antigo fica registrada, mas não passa por cima do
    // dia mais recente que as dinâmicas já estão usando.
    const { data: maisRecente } = await admin
      .from("resultados_do_dia")
      .select("data")
      .eq("product_id", productId)
      .eq("aplicado", true)
      .order("data", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maisRecente && maisRecente.data > lido.data) {
      motivo = `Correção de ${lido.data} registrada; os resultados continuam com ${maisRecente.data}, que é mais recente.`;
    } else {
      const escritas: { pilar: Pilar; janela: Janela; valores: JanelaLida; naoOperou?: boolean }[] = [];
      const semPlacarDoDia: Pilar[] = [];
      const soComTaxa: string[] = [];
      const ausentes: string[] = [];
      for (const pilar of PILARES) {
        const p = lido.pilares[pilar];
        if (!p) continue;
        if (p.operou && !p.dia) semPlacarDoDia.push(pilar);
        for (const [janela, lidoJ, taxa] of [
          ["7 dias", p.semana, p.semanaSoTaxa],
          ["30 dias", p.mes, p.mesSoTaxa],
        ] as const) {
          if (lidoJ) continue;
          if (taxa !== null) soComTaxa.push(`${pilar} ${janela} (${taxa}%)`);
          else ausentes.push(`${pilar} ${janela}`);
        }
        // Pilar que não operou: o dia vai como placar vazio, SEM taxa e SEM
        // rentabilidade inventadas — e a escolha automática das mensagens
        // nunca usa o Dia.
        if (!p.operou) {
          escritas.push({ pilar, janela: "dia", valores: { wins: 0, losses: 0, acerto: 0, rendimento: null }, naoOperou: true });
        } else if (p.dia) {
          escritas.push({ pilar, janela: "dia", valores: { ...p.dia, rendimento: p.dia.rendimento ?? p.rentabilidadeDia } });
        }
        if (p.semana) escritas.push({ pilar, janela: "semana", valores: p.semana });
        if (p.mes) {
          escritas.push({ pilar, janela: "mes", valores: p.mes });
          escritas.push({ pilar, janela: "total", valores: p.mes });
        }
      }

      const falhas: string[] = [];
      for (const { pilar, janela, valores, naoOperou } of escritas) {
        // rendimento_pct fica FORA do objeto quando não veio: no upsert,
        // coluna ausente mantém o valor que já estava — ausente não é 0%.
        // A exceção é o dia de quem não operou: ali a rentabilidade antiga
        // não vale mais, e fica vazia de propósito.
        const linha: Omit<StatsInsert, "rendimento_pct"> & { rendimento_pct?: number | null } = {
          product: pilar,
          time_window: janela,
          wins: valores.wins,
          losses: valores.losses,
          acerto_pct: valores.acerto,
          updated_by: null,
          updated_at: new Date().toISOString(),
        };
        if (pilar === "copy") {
          if (naoOperou) linha.rendimento_pct = null;
          else if (valores.rendimento !== null) linha.rendimento_pct = valores.rendimento;
          // Janela vazia sem rentabilidade: fica vazia, não herda a antiga.
          else if (valores.semOperacao) linha.rendimento_pct = null;
        }

        const { error } = await admin
          .from("trading_performance_stats")
          .upsert(linha as StatsInsert, { onConflict: "product,time_window" });
        if (error) falhas.push(`${pilar}/${janela}`);
        else (gravado[pilar] ??= {})[janela] = fmtJanela(valores);
      }

      aplicado = escritas.length > 0 && falhas.length === 0;
      const avisos = [
        falhas.length ? `Falha ao gravar ${falhas.join(", ")}.` : null,
        naoLidos.length ? `Pilar não reconhecido no payload: ${naoLidos.join(", ")}.` : null,
        semPlacarDoDia.length ? `Placar do dia não reconhecido: ${semPlacarDoDia.join(", ")}.` : null,
        soComTaxa.length
          ? `Semana/Mês NÃO atualizados: o acumulado veio só com a % e sem placar (${soComTaxa.join(", ")}). As mensagens mostram placar e % juntos — com placar antigo ou 0x0 a conta não fecharia.`
          : null,
        ausentes.length ? `Acumulado não veio: ${ausentes.join(", ")}.` : null,
      ].filter(Boolean);
      motivo = avisos.length ? avisos.join(" ") : null;
    }
  }

  await admin.from("resultados_do_dia").upsert(
    {
      product_id: productId,
      data: lido.data,
      preenchido: lido.preenchido,
      texto: lido.texto,
      resumo: gravado as Record<string, unknown>,
      raw_payload: raw,
      origem,
      aplicado,
      motivo,
      recebido_em: new Date().toISOString(),
    },
    { onConflict: "product_id,data" }
  );

  return { data: lido.data, preenchido: lido.preenchido, aplicado, motivo, texto: lido.texto, gravado };
}

/** YYYY-MM-DD no fuso de São Paulo, N dias atrás. */
export function diaEmSaoPaulo(diasAtras = 0): string {
  const alvo = new Date(Date.now() - diasAtras * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(alvo);
}
