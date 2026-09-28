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
}

export interface PilarLido {
  operou: boolean;
  dia: JanelaLida | null;
  semana: JanelaLida | null;
  mes: JanelaLida | null;
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
  return { ...placar, acerto, rendimento };
}

// Acha o bloco do acumulado de N dias, onde quer que ele esteja: dentro de
// "acumulado"/"acumulados" ou solto no pilar, com a chave citando o número
// ("7d", "acumulado_7d", "ultimos_7_dias"...). O \D em volta impede que o 7
// case dentro de "70" ou o 30 dentro de "300".
function acharAcumulado(pilar: Record<string, unknown>, dias: 7 | 30): Record<string, unknown> | null {
  const padrao = new RegExp(`(^|\\D)${dias}(\\D|$)`);
  for (const fonte of [pilar.acumulado, pilar.acumulados, pilar]) {
    if (!isRecord(fonte)) continue;
    for (const [chave, valor] of Object.entries(fonte)) {
      if (isRecord(valor) && padrao.test(chave)) return valor;
    }
  }
  return null;
}

function lerPilar(obj: unknown): PilarLido | null {
  if (!isRecord(obj)) return null;
  const operou = obj.operou !== false;
  const acumulado7 = acharAcumulado(obj, 7);
  const acumulado30 = acharAcumulado(obj, 30);
  return {
    operou,
    dia: operou ? lerJanela(obj) : null,
    semana: acumulado7 ? lerJanela(acumulado7) : null,
    mes: acumulado30 ? lerJanela(acumulado30) : null,
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
      const escritas: { pilar: Pilar; janela: Janela; valores: JanelaLida }[] = [];
      const faltando: string[] = [];
      for (const pilar of PILARES) {
        const p = lido.pilares[pilar];
        if (!p) continue;
        if (p.operou && !p.dia) faltando.push(`placar do dia de ${pilar}`);
        if (!p.semana) faltando.push(`7 dias de ${pilar}`);
        if (!p.mes) faltando.push(`30 dias de ${pilar}`);
        // Pilar que não operou: o dia vai como placar vazio, SEM inventar
        // taxa — e a escolha automática das mensagens nunca usa o Dia.
        const dia: JanelaLida | null = p.operou
          ? p.dia
          : { wins: 0, losses: 0, acerto: 0, rendimento: p.rentabilidadeDia };
        if (dia) {
          escritas.push({ pilar, janela: "dia", valores: { ...dia, rendimento: dia.rendimento ?? p.rentabilidadeDia } });
        }
        if (p.semana) escritas.push({ pilar, janela: "semana", valores: p.semana });
        if (p.mes) {
          escritas.push({ pilar, janela: "mes", valores: p.mes });
          escritas.push({ pilar, janela: "total", valores: p.mes });
        }
      }

      const falhas: string[] = [];
      for (const { pilar, janela, valores } of escritas) {
        // rendimento_pct fica FORA do objeto quando não veio: no upsert,
        // coluna ausente mantém o valor que já estava — ausente não é 0%.
        const linha: Omit<StatsInsert, "rendimento_pct"> & { rendimento_pct?: number } = {
          product: pilar,
          time_window: janela,
          wins: valores.wins,
          losses: valores.losses,
          acerto_pct: valores.acerto,
          updated_by: null,
          updated_at: new Date().toISOString(),
        };
        if (pilar === "copy" && valores.rendimento !== null) linha.rendimento_pct = valores.rendimento;

        const { error } = await admin
          .from("trading_performance_stats")
          .upsert(linha as StatsInsert, { onConflict: "product,time_window" });
        if (error) falhas.push(`${pilar}/${janela}`);
        else (gravado[pilar] ??= {})[janela] = fmtJanela(valores);
      }

      aplicado = escritas.length > 0 && falhas.length === 0;
      const avisos = [
        falhas.length ? `Falha ao gravar ${falhas.join(", ")}.` : null,
        naoLidos.length ? `Não reconhecido no payload: ${naoLidos.join(", ")}.` : null,
        faltando.length ? `Não veio ou não foi reconhecido: ${faltando.join(", ")}.` : null,
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
