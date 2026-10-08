"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Megaphone } from "@/components/ui/icones";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Bloco, Segmentado, Vazio } from "./ui";
import { BarraProporcional, Metrica, corDaFonte, pct } from "./ranking";

/*
  Performance por campanha, conjunto, anúncio e conta — o mesmo desenho das
  Páginas e das Origens: ranking com barras, nome da Meta no lugar do ID, e a
  tabela completa a um clique.

  De onde vem cada número:
    resultados (leads, checkout, compras, depósitos)  → tracking_origem_detalhada,
        agrupado pelas UTMs do link (utm_campaign = campanha, utm_term = conjunto,
        utm_content = anúncio);
    gasto da campanha         → ad_campaign_spend (uma linha por campanha por dia,
        então NÃO se repete por origem como no relatório antigo);
    gasto de conjunto/anúncio → ad_entity_spend (migration 0128, vem do botão
        "Sincronizar gasto" em Anúncios);
    nomes                     → ad_entity_names.

  Gasto que a plataforma não informa fica "—", nunca zero inventado: zero diria
  "não gastou", e o que acontece é "não sabemos".
*/

export type NivelPerformance = "campanha" | "conjunto" | "anuncio" | "conta";

interface LinhaDetalhada {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  leads: number;
  checkouts: number;
  compras: number;
  receita_cents: number;
  cadastros_corretora: number;
  depositos: number;
  depositado_cents: number;
}

interface Metricas {
  leads: number;
  checkouts: number;
  compras: number;
  receita_cents: number;
  depositos: number;
  depositado_cents: number;
}

type NivelNo = "campanha" | "conjunto" | "anuncio";

interface No {
  id: string;
  nivel: NivelNo;
  /** Valor cru da UTM (ID ou texto). Vazio = a UTM não veio. */
  chave: string;
  rotulo: string;
  /** ID por baixo do nome (ou aviso, quando falta o nome). */
  sub?: string;
  semNome?: boolean;
  m: Metricas;
  /** null = a plataforma não informou o gasto desse item. */
  gasto: number | null;
  fontes: string[];
  /** Pra listas planas: "da campanha X / conjunto Y". */
  pai?: string;
  filhos: No[];
}

interface Credencial {
  id: string;
  platform: "meta" | "google";
  label: string | null;
  ad_account_id: string | null;
  status: string;
  is_valid: boolean;
  last_synced_at: string | null;
}

interface GastoCampanha {
  campaign_id: string;
  campaign_name: string | null;
  platform: "meta" | "google";
  spend_cents: number;
}

interface GastoEntidade {
  level: "adset" | "ad";
  entity_id: string;
  entity_name: string | null;
  campaign_id: string | null;
  adset_id: string | null;
  spend_cents: number;
}

interface GrupoConta {
  chave: string;
  rotulo: string;
  sub?: string;
  gasto: number | null;
  m: Metricas;
  fontes: string[];
  contas: Credencial[];
}

const ROTULO: Record<NivelNo, string> = { campanha: "Campanha", conjunto: "Conjunto", anuncio: "Anúncio" };
const COR_NIVEL: Record<NivelNo, string> = {
  campanha: "var(--series-1)",
  conjunto: "var(--series-2)",
  anuncio: "var(--series-3)",
};

const METRICAS_BARRA = [
  { key: "leads", label: "Leads" },
  { key: "gasto", label: "Gasto" },
  { key: "compras", label: "Compras" },
  { key: "receita_cents", label: "Receita" },
  { key: "depositos", label: "Depósitos" },
] as const;
type MetricaBarra = (typeof METRICAS_BARRA)[number]["key"];

const ZERO: Metricas = { leads: 0, checkouts: 0, compras: 0, receita_cents: 0, depositos: 0, depositado_cents: 0 };

function somar(a: Metricas, l: Metricas): Metricas {
  return {
    leads: a.leads + Number(l.leads),
    checkouts: a.checkouts + Number(l.checkouts),
    compras: a.compras + Number(l.compras),
    receita_cents: a.receita_cents + Number(l.receita_cents),
    depositos: a.depositos + Number(l.depositos),
    depositado_cents: a.depositado_cents + Number(l.depositado_cents),
  };
}

const ehId = (v: string) => /^\d{8,}$/.test(v);
const curto = (id: string) => (id.length > 10 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id);

const FONTES_META = ["fb", "facebook", "ig", "instagram", "meta", "an", "audience_network", "messenger", "ms", "threads"];
const FONTES_GOOGLE = ["google", "gads", "youtube", "yt"];

function valorDe(gasto: number | null, m: Metricas, k: MetricaBarra): number {
  return k === "gasto" ? (gasto ?? 0) : m[k];
}

function dia(d: Date): string {
  // As datas de gasto vêm no fuso da conta de anúncio (Brasil): -3h evita pegar o dia seguinte à noite.
  return new Date(d.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

function Roi({ valor }: { valor: number | null }) {
  if (valor === null) return <span className="text-text-muted">—</span>;
  return (
    <span className={valor >= 0 ? "text-ok" : "text-danger"}>
      {valor >= 0 ? "+" : ""}
      {Math.round(valor * 100)}%
    </span>
  );
}

interface DadosLinha {
  id: string;
  rotulo: string;
  sub?: string;
  semNome?: boolean;
  gasto: number | null;
  m: Metricas;
  fontes: string[];
  pai?: string;
  /** Texto antes do contexto; "em " por padrão, vazio quando não cabe (contas). */
  prefixoPai?: string;
  cor: string;
  max: number;
  totalDaMetrica: number;
  filhos: No[];
  profundidade: number;
  tag?: string;
}

export function PerformancePanel({
  productId,
  nivel,
  from,
  to,
  usdBrlRate,
  fmtBRL,
  fmtUSD,
  tabelaCompleta,
  onIrParaAnuncios,
}: {
  productId: string;
  nivel: NivelPerformance;
  from: Date;
  to: Date;
  usdBrlRate: number | null;
  fmtBRL: (cents: number) => string;
  fmtUSD: (cents: number) => string;
  /** A tabela de sempre (só em Campanhas), pra quem quer todas as colunas. */
  tabelaCompleta?: ReactNode;
  onIrParaAnuncios?: () => void;
}) {
  const [linhas, setLinhas] = useState<LinhaDetalhada[] | null>(null);
  const [nomesTab, setNomesTab] = useState<Map<string, string>>(new Map());
  const [gastoCamp, setGastoCamp] = useState<GastoCampanha[]>([]);
  const [gastoEnt, setGastoEnt] = useState<GastoEntidade[]>([]);
  const [semMigration0128, setSemMigration0128] = useState(false);
  const [credenciais, setCredenciais] = useState<Credencial[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [visao, setVisao] = useState<"cartoes" | "tabela">("cartoes");
  const [metrica, setMetrica] = useState<MetricaBarra>("leads");
  const [abertos, setAbertos] = useState<Set<string>>(new Set());

  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  useEffect(() => {
    let vivo = true;
    setLinhas(null);
    setErro(null);
    const supabase = createClient();
    const de = dia(new Date(fromIso));
    const ate = dia(new Date(toIso));
    Promise.all([
      supabase.rpc("tracking_origem_detalhada", { p_product_id: productId, p_from: fromIso, p_to: toIso }),
      supabase.from("ad_entity_names").select("entity_id, name").eq("product_id", productId),
      supabase
        .from("ad_campaign_spend")
        .select("campaign_id, campaign_name, platform, spend_cents")
        .eq("product_id", productId)
        .gte("spend_date", de)
        .lte("spend_date", ate),
      supabase
        .from("ad_entity_spend")
        .select("level, entity_id, entity_name, campaign_id, adset_id, spend_cents")
        .eq("product_id", productId)
        .gte("spend_date", de)
        .lte("spend_date", ate),
      supabase
        .from("ad_platform_credentials")
        .select("id, platform, label, ad_account_id, status, is_valid, last_synced_at")
        .eq("product_id", productId),
    ]).then(([rpc, nomesRes, campRes, entRes, credRes]) => {
      if (!vivo) return;
      if (rpc.error) {
        setErro(
          /tracking_origem_detalhada/.test(rpc.error.message)
            ? "Falta rodar a migration 0126 no banco."
            : "Não deu pra carregar os resultados."
        );
        setLinhas([]);
        return;
      }
      setLinhas((rpc.data ?? []) as LinhaDetalhada[]);
      setNomesTab(new Map((nomesRes.data ?? []).map((n) => [n.entity_id, n.name])));
      setGastoCamp((campRes.data ?? []) as GastoCampanha[]);
      // Antes da migration 0128 a tabela não existe: sem gasto por conjunto/anúncio, o resto segue.
      setSemMigration0128(!!entRes.error);
      setGastoEnt(entRes.error ? [] : ((entRes.data ?? []) as GastoEntidade[]));
      setCredenciais((credRes.data ?? []) as Credencial[]);
    });
    return () => {
      vivo = false;
    };
  }, [productId, fromIso, toIso]);

  const dados = useMemo(() => {
    // Nome: o da tabela de nomes manda; o que veio junto com o gasto cobre o resto.
    const nomes = new Map<string, string>();
    for (const g of gastoCamp) if (g.campaign_name) nomes.set(g.campaign_id, g.campaign_name);
    for (const g of gastoEnt) if (g.entity_name) nomes.set(g.entity_id, g.entity_name);
    nomesTab.forEach((nome, id) => nomes.set(id, nome));

    const gCamp = new Map<string, number>();
    for (const g of gastoCamp) gCamp.set(g.campaign_id, (gCamp.get(g.campaign_id) ?? 0) + g.spend_cents);
    const gConj = new Map<string, number>();
    const gAnun = new Map<string, number>();
    for (const g of gastoEnt) {
      const mapa = g.level === "adset" ? gConj : gAnun;
      mapa.set(g.entity_id, (mapa.get(g.entity_id) ?? 0) + g.spend_cents);
    }

    function novo(n: NivelNo, chave: string, idPai: string): No {
      const nome = chave ? nomes.get(chave) : undefined;
      let rotulo = chave;
      let sub: string | undefined;
      let semNome = false;
      if (!chave) rotulo = n === "campanha" ? "(sem campanha)" : n === "conjunto" ? "(sem conjunto)" : "(sem anúncio)";
      else if (nome) {
        rotulo = nome;
        sub = chave;
      } else if (ehId(chave)) {
        rotulo = `${ROTULO[n]} ${curto(chave)}`;
        sub = chave;
        semNome = true;
      }
      const mapa = n === "campanha" ? gCamp : n === "conjunto" ? gConj : gAnun;
      return {
        id: `${idPai}|${n}:${chave}`,
        nivel: n,
        chave,
        rotulo,
        sub,
        semNome,
        m: { ...ZERO },
        gasto: chave && mapa.has(chave) ? (mapa.get(chave) as number) : null,
        fontes: [],
        filhos: [],
      };
    }
    function filho(pai: No, n: NivelNo, chave: string): No {
      let f = pai.filhos.find((x) => x.chave === chave);
      if (!f) {
        f = novo(n, chave, pai.id);
        pai.filhos.push(f);
      }
      return f;
    }

    const campanhas = new Map<string, No>();
    const campanha = (chave: string) => {
      let c = campanhas.get(chave);
      if (!c) {
        c = novo("campanha", chave, "");
        campanhas.set(chave, c);
      }
      return c;
    };

    let total = { ...ZERO };
    for (const l of linhas ?? []) {
      total = somar(total, l);
      const c = campanha(l.utm_campaign);
      const conj = filho(c, "conjunto", l.utm_term);
      const anun = filho(conj, "anuncio", l.utm_content);
      for (const no of [c, conj, anun]) {
        no.m = somar(no.m, l);
        if (!no.fontes.includes(l.utm_source)) no.fontes.push(l.utm_source);
      }
    }

    // Quem gastou mas não trouxe lead também precisa aparecer: é o que mais
    // importa achar. Entra com resultados zerados.
    for (const g of gastoCamp) campanha(g.campaign_id);
    for (const g of gastoEnt) {
      const c = campanha(g.campaign_id ?? "");
      if (g.level === "adset") filho(c, "conjunto", g.entity_id);
      else filho(filho(c, "conjunto", g.adset_id ?? ""), "anuncio", g.entity_id);
    }

    const raizes = Array.from(campanhas.values());

    // Listas planas (conjuntos / anúncios) saem da árvore ANTES de compactar.
    const planos: Record<"conjunto" | "anuncio", No[]> = { conjunto: [], anuncio: [] };
    for (const c of raizes) {
      for (const conj of c.filhos) {
        if (conj.chave) planos.conjunto.push({ ...conj, pai: c.rotulo });
        for (const a of conj.filhos) {
          if (a.chave) planos.anuncio.push({ ...a, pai: conj.chave ? `${c.rotulo} › ${conj.rotulo}` : c.rotulo });
        }
      }
    }

    // Degrau sem informação não vira nível: se o único filho é "(sem …)", o
    // conteúdo dele sobe — senão todo anúncio ficaria atrás de um "(sem conjunto)".
    function compactar(no: No): No {
      no.filhos = no.filhos.map(compactar);
      if (no.filhos.length === 1 && !no.filhos[0].chave) no.filhos = no.filhos[0].filhos;
      return no;
    }
    raizes.forEach(compactar);
    planos.conjunto.forEach(compactar);
    planos.anuncio.forEach(compactar);

    let semNome = 0;
    (function contar(ns: No[]) {
      for (const n of ns) {
        if (n.semNome) semNome++;
        contar(n.filhos);
      }
    })(raizes);

    const gastoTotal = Array.from(gCamp.values()).reduce((s, v) => s + v, 0);
    return { raizes, planos, total, gastoTotal, temGasto: gCamp.size > 0, semNome, temGastoDetalhado: gastoEnt.length > 0 };
  }, [linhas, nomesTab, gastoCamp, gastoEnt]);

  const contas = useMemo(() => {
    const meta: GrupoConta = { chave: "meta", rotulo: "Meta Ads", gasto: null, m: { ...ZERO }, fontes: [], contas: [] };
    const google: GrupoConta = { chave: "google", rotulo: "Google Ads", gasto: null, m: { ...ZERO }, fontes: [], contas: [] };
    const outros: GrupoConta = {
      chave: "outros",
      rotulo: "Sem anúncio pago",
      sub: "direto, orgânico e outras origens",
      gasto: null,
      m: { ...ZERO },
      fontes: [],
      contas: [],
    };
    for (const c of credenciais) (c.platform === "meta" ? meta : google).contas.push(c);
    for (const g of gastoCamp) {
      const alvo = g.platform === "meta" ? meta : google;
      alvo.gasto = (alvo.gasto ?? 0) + g.spend_cents;
    }
    for (const l of linhas ?? []) {
      const f = l.utm_source.toLowerCase();
      const alvo = FONTES_META.includes(f) ? meta : FONTES_GOOGLE.includes(f) ? google : outros;
      alvo.m = somar(alvo.m, l);
      if (!alvo.fontes.includes(l.utm_source)) alvo.fontes.push(l.utm_source);
    }
    // Plataforma sem conta conectada e sem nada dentro some.
    return [meta, google, outros].filter((g) => g.contas.length > 0 || g.m.leads > 0 || (g.gasto ?? 0) > 0);
  }, [credenciais, gastoCamp, linhas]);

  function alternar(id: string) {
    setAbertos((prev) => {
      const prox = new Set(prev);
      if (prox.has(id)) prox.delete(id);
      else prox.add(id);
      return prox;
    });
  }

  function roiCurso(gasto: number | null, m: Metricas): number | null {
    return gasto !== null && gasto > 0 ? (m.receita_cents - gasto) / gasto : null;
  }
  function roiCorretora(gasto: number | null, m: Metricas): number | null {
    if (gasto === null || gasto <= 0 || usdBrlRate === null) return null;
    return (Math.round(m.depositado_cents * usdBrlRate) - gasto) / gasto;
  }

  function porMetrica(a: { gasto: number | null; m: Metricas }, b: { gasto: number | null; m: Metricas }): number {
    return valorDe(b.gasto, b.m, metrica) - valorDe(a.gasto, a.m, metrica) || b.m.leads - a.m.leads;
  }

  // Função de render (não componente): componente declarado aqui dentro seria
  // um tipo novo a cada render e remontaria a lista inteira a cada clique.
  function linha(d: DadosLinha): ReactNode {
    const temFilhos = d.filhos.length > 0;
    const aberto = abertos.has(d.id);
    const raiz = d.profundidade === 0;
    const filhosOrdenados = [...d.filhos].sort(porMetrica);
    const maxFilhos = filhosOrdenados.reduce((mx, n) => Math.max(mx, valorDe(n.gasto, n.m, metrica)), 0);
    const totalFilhos = filhosOrdenados.reduce((s, n) => s + valorDe(n.gasto, n.m, metrica), 0);
    const v = valorDe(d.gasto, d.m, metrica);
    const cpl = d.gasto !== null && d.gasto > 0 && d.m.leads > 0 ? Math.round(d.gasto / d.m.leads) : null;
    const rc = roiCurso(d.gasto, d.m);
    const rb = roiCorretora(d.gasto, d.m);
    const valorTexto = metrica === "gasto" || metrica === "receita_cents" ? (v > 0 ? fmtBRL(v) : "—") : String(v);

    return (
      <li key={d.id} className={cn(raiz ? "rounded-xl border border-border bg-app" : "border-l border-border-strong pl-3")}>
        <button
          type="button"
          onClick={() => temFilhos && alternar(d.id)}
          disabled={!temFilhos}
          aria-expanded={temFilhos ? aberto : undefined}
          className={cn(
            "grid w-full items-center gap-x-3 gap-y-2 text-left",
            "grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto]",
            raiz ? "px-3.5 py-3" : "py-2.5",
            temFilhos ? "cursor-pointer" : "cursor-default"
          )}
        >
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-1.5">
              {temFilhos ? (
                aberto ? (
                  <ChevronDown size={13} className="shrink-0 text-text-tertiary" />
                ) : (
                  <ChevronRight size={13} className="shrink-0 text-text-tertiary" />
                )
              ) : (
                <span className="w-[13px] shrink-0" />
              )}
              {raiz && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.cor }} />}
              <span
                className={cn(
                  "truncate",
                  raiz ? "text-[14px] font-semibold text-text-primary" : "text-[13px] font-medium text-text-primary",
                  d.semNome && "text-text-secondary"
                )}
                title={d.rotulo}
              >
                {d.rotulo}
              </span>
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-1.5 pl-[19px]">
              {d.tag && (
                <span className="rounded-md bg-input px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">{d.tag}</span>
              )}
              {d.fontes.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-md bg-input px-1.5 py-0.5 text-[10px] text-text-tertiary"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: corDaFonte(f) }} />
                  {f}
                </span>
              ))}
              {d.pai && (
                <span className="truncate text-[10px] text-text-muted" title={d.pai}>
                  {d.prefixoPai ?? "em "}
                  {d.pai}
                </span>
              )}
              {d.sub && (
                <span className="truncate font-mono text-[10px] text-text-muted" title={d.sub}>
                  {d.semNome ? "sem nome — sincronize em Anúncios" : `ID ${curto(d.sub)}`}
                </span>
              )}
            </span>
          </span>

          <span className="flex items-center gap-3">
            <BarraProporcional valor={v} max={d.max} cor={d.cor} className="flex-1" />
            <span className="w-24 shrink-0 text-right">
              <span className="text-[14px] font-semibold tabular-nums text-text-primary">{valorTexto}</span>
              <span className="ml-1 text-[11px] tabular-nums text-text-muted">{pct(v, d.totalDaMetrica)}</span>
            </span>
          </span>

          <span className="grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-5 lg:flex">
            <Metrica rotulo="Gasto" valor={d.gasto !== null && d.gasto > 0 ? fmtBRL(d.gasto) : "—"} className="lg:w-20" />
            <Metrica
              rotulo="Leads"
              valor={d.m.leads}
              extra={cpl !== null ? `CPL ${fmtBRL(cpl)}` : undefined}
              className="lg:w-24"
            />
            <Metrica
              rotulo="Compras"
              valor={d.m.compras}
              extra={d.m.receita_cents > 0 ? fmtBRL(d.m.receita_cents) : undefined}
              className="lg:w-24"
            />
            <Metrica
              rotulo="Depósitos"
              valor={d.m.depositos}
              extra={d.m.depositado_cents > 0 ? fmtUSD(d.m.depositado_cents) : undefined}
              destaque={d.m.depositos > 0}
              className="lg:w-24"
            />
            <Metrica
              rotulo="ROI"
              valor={<Roi valor={rc} />}
              extra={
                rb !== null ? (
                  <>
                    corretora <Roi valor={rb} />
                  </>
                ) : undefined
              }
              className="lg:w-24"
            />
          </span>
        </button>

        {temFilhos && aberto && (
          <ul className={cn(raiz ? "border-t border-border px-3.5 pb-2 pl-6" : "ml-2")}>
            {filhosOrdenados.map((f) =>
              linha({
                id: f.id,
                rotulo: f.rotulo,
                sub: f.sub,
                semNome: f.semNome,
                gasto: f.gasto,
                m: f.m,
                fontes: [],
                cor: COR_NIVEL[f.nivel],
                max: maxFilhos,
                totalDaMetrica: totalFilhos,
                filhos: f.filhos,
                profundidade: d.profundidade + 1,
                tag: ROTULO[f.nivel],
              })
            )}
          </ul>
        )}
      </li>
    );
  }

  const titulo =
    nivel === "campanha"
      ? "Resultado por campanha"
      : nivel === "conjunto"
        ? "Resultado por conjunto"
        : nivel === "anuncio"
          ? "Resultado por anúncio"
          : "Resultado por conta";

  const lista: No[] =
    nivel === "campanha" ? dados.raizes : nivel === "conjunto" ? dados.planos.conjunto : nivel === "anuncio" ? dados.planos.anuncio : [];
  const ordenada = [...lista].sort(porMetrica);
  const max = ordenada.reduce((mx, n) => Math.max(mx, valorDe(n.gasto, n.m, metrica)), 0);
  const totalMetrica = ordenada.reduce((s, n) => s + valorDe(n.gasto, n.m, metrica), 0);

  // Resultado que existe mas não está em nenhum item da lista (link sem a UTM do nível).
  const leadsNaLista = ordenada.reduce((s, n) => s + n.m.leads, 0);
  const leadsFora = nivel === "conjunto" || nivel === "anuncio" ? Math.max(0, dados.total.leads - leadsNaLista) : 0;

  const gastoNivelSemDado = (nivel === "conjunto" || nivel === "anuncio") && !dados.temGastoDetalhado && dados.temGasto;

  const roiGeral = roiCurso(dados.temGasto ? dados.gastoTotal : null, dados.total);
  const cplGeral =
    dados.temGasto && dados.gastoTotal > 0 && dados.total.leads > 0 ? Math.round(dados.gastoTotal / dados.total.leads) : null;

  const contasOrdenadas = [...contas].sort(porMetrica);
  const maxConta = contas.reduce((mx, c) => Math.max(mx, valorDe(c.gasto, c.m, metrica)), 0);
  const totalConta = contas.reduce((s, c) => s + valorDe(c.gasto, c.m, metrica), 0);

  const avisoCls = "mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-warning-soft px-3 py-2 text-[12px] text-text-secondary";
  const linkCls = "font-medium text-accent-text hover:underline";

  return (
    <Bloco
      titulo={titulo}
      descricao={
        nivel === "campanha"
          ? "Quem mais traz resultado e quanto custou. Clique numa campanha pra abrir conjuntos e anúncios."
          : nivel === "conjunto"
            ? "Cada público (conjunto) com o resultado que trouxe e o gasto."
            : nivel === "anuncio"
              ? "Cada criativo com o resultado que trouxe e o gasto."
              : "Quanto cada plataforma de anúncio gastou e o que voltou."
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {nivel === "campanha" && tabelaCompleta && (
          <Segmentado
            opcoes={[
              { key: "cartoes", label: "Ranking" },
              { key: "tabela", label: "Tabela completa" },
            ]}
            ativo={visao}
            onChange={setVisao}
          />
        )}
        {(visao === "cartoes" || nivel !== "campanha") && (
          <label className="flex min-w-0 max-w-full flex-wrap items-center gap-2 text-[11px] text-text-tertiary">
            Barra mostra
            <Segmentado opcoes={METRICAS_BARRA} ativo={metrica} onChange={setMetrica} />
          </label>
        )}
      </div>

      {nivel === "campanha" && visao === "tabela" ? (
        tabelaCompleta
      ) : linhas === null ? (
        <LoadingState message="Carregando resultados..." />
      ) : erro ? (
        <Vazio icone={Megaphone}>{erro}</Vazio>
      ) : (
        <>
          {/* Resumo do período — o gasto aqui é o da plataforma, contado uma vez só. */}
          <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-border bg-app px-3.5 py-3 sm:grid-cols-3 lg:grid-cols-6">
            <Metrica rotulo="Gasto no período" valor={dados.temGasto ? fmtBRL(dados.gastoTotal) : "—"} />
            <Metrica
              rotulo="Leads"
              valor={dados.total.leads}
              extra={cplGeral !== null ? `CPL ${fmtBRL(cplGeral)}` : undefined}
            />
            <Metrica rotulo="Checkout" valor={dados.total.checkouts} />
            <Metrica
              rotulo="Compras"
              valor={dados.total.compras}
              extra={dados.total.receita_cents > 0 ? fmtBRL(dados.total.receita_cents) : undefined}
            />
            <Metrica
              rotulo="Depósitos"
              valor={dados.total.depositos}
              extra={dados.total.depositado_cents > 0 ? fmtUSD(dados.total.depositado_cents) : undefined}
              destaque={dados.total.depositos > 0}
            />
            <Metrica rotulo="ROI curso" valor={<Roi valor={roiGeral} />} />
          </div>

          {!dados.temGasto && (
            <div className={avisoCls}>
              <span>Ainda não há gasto sincronizado nesse período, então custo e ROI aparecem como “—”.</span>
              {onIrParaAnuncios && (
                <button type="button" onClick={onIrParaAnuncios} className={linkCls}>
                  {credenciais.length > 0 ? "Sincronizar gasto →" : "Conectar em Anúncios →"}
                </button>
              )}
            </div>
          )}
          {gastoNivelSemDado && (
            <div className={avisoCls}>
              <span>
                {semMigration0128
                  ? "Falta rodar a migration 0128 pra guardar o gasto por conjunto e por anúncio."
                  : `O gasto por ${nivel === "conjunto" ? "conjunto" : "anúncio"} ainda não foi sincronizado.`}
              </span>
              {onIrParaAnuncios && !semMigration0128 && (
                <button type="button" onClick={onIrParaAnuncios} className={linkCls}>
                  Sincronizar em Anúncios →
                </button>
              )}
            </div>
          )}
          {dados.semNome > 0 && nivel !== "conta" && (
            <div className={avisoCls}>
              <span>
                {dados.semNome} {dados.semNome === 1 ? "ID ainda aparece" : "IDs ainda aparecem"} sem o nome da Meta.
              </span>
              {onIrParaAnuncios && (
                <button type="button" onClick={onIrParaAnuncios} className={linkCls}>
                  Sincronizar em Anúncios →
                </button>
              )}
            </div>
          )}

          {nivel === "conta" ? (
            credenciais.length === 0 ? (
              <Vazio
                icone={Megaphone}
                acao={
                  onIrParaAnuncios ? (
                    <Button size="sm" onClick={onIrParaAnuncios}>
                      Conectar em Anúncios
                    </Button>
                  ) : undefined
                }
              >
                Nenhuma conta de anúncio conectada ainda.
              </Vazio>
            ) : (
              <ul className="space-y-2">
                {contasOrdenadas.map((c) =>
                  linha({
                    id: `conta:${c.chave}`,
                    rotulo: c.rotulo,
                    gasto: c.gasto,
                    m: c.m,
                    fontes: c.fontes,
                    pai:
                      c.contas.length > 0
                        ? c.contas.map((x) => x.label || (x.ad_account_id ? `conta ${x.ad_account_id}` : "conta")).join(", ")
                        : c.sub,
                    prefixoPai: "",
                    cor: c.chave === "meta" ? "var(--series-1)" : c.chave === "google" ? "var(--series-2)" : "var(--text-muted)",
                    max: maxConta,
                    totalDaMetrica: totalConta,
                    filhos: [],
                    profundidade: 0,
                  })
                )}
              </ul>
            )
          ) : ordenada.length === 0 ? (
            <Vazio icone={Megaphone}>
              {nivel === "campanha"
                ? "Sem dados suficientes nesse período."
                : `Nenhum ${nivel === "conjunto" ? "conjunto" : "anúncio"} apareceu nesse período. O link do anúncio precisa levar ${nivel === "conjunto" ? "utm_term" : "utm_content"} com o ID.`}
            </Vazio>
          ) : (
            <>
              <ul className="space-y-2">
                {ordenada.map((n) =>
                  linha({
                    id: n.id,
                    rotulo: n.rotulo,
                    sub: n.sub,
                    semNome: n.semNome,
                    gasto: n.gasto,
                    m: n.m,
                    fontes: n.fontes,
                    pai: n.pai,
                    cor: COR_NIVEL[n.nivel],
                    max,
                    totalDaMetrica: totalMetrica,
                    filhos: n.filhos,
                    profundidade: 0,
                  })
                )}
              </ul>
              {leadsFora > 0 && (
                <p className="mt-3 text-[11px] text-text-muted">
                  {leadsFora} {leadsFora === 1 ? "lead" : "leads"} no período não vieram com{" "}
                  {nivel === "conjunto" ? "conjunto" : "anúncio"} na UTM (orgânico, direto ou link sem parâmetros) e não
                  entram nessa lista.
                </p>
              )}
              {nivel === "campanha" && (
                <p className="mt-3 text-[11px] text-text-muted">“—” em gasto = a plataforma não informou.</p>
              )}
            </>
          )}
        </>
      )}
    </Bloco>
  );
}
