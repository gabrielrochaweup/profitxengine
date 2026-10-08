import type { Database } from "@/lib/supabase/types";

/*
  Swipes — produtos concorrentes e inspirações em análise.

  O cadastro chega de dois jeitos: colado como JSON (a estrutura que a
  equipe já preenche à mão, ou que sai de um prompt de análise) ou campo a
  campo. Os dois caem no mesmo formulário: o JSON só PREENCHE os campos, e
  a pessoa revisa antes de salvar. Assim um JSON torto nunca vira um swipe
  torto em silêncio.
*/

export type Swipe = Database["public"]["Tables"]["swipes"]["Row"];
export type StatusSwipe = Swipe["status"];

export const STATUS_SWIPE: { key: StatusSwipe; label: string; tom: "neutral" | "success" | "warning" | "danger" }[] = [
  { key: "em_analise", label: "Em análise", tom: "warning" },
  { key: "modelando", label: "Modelando", tom: "success" },
  { key: "descartado", label: "Descartado", tom: "neutral" },
];

export function rotuloStatus(status: StatusSwipe): string {
  return STATUS_SWIPE.find((s) => s.key === status)?.label ?? status;
}

export const FORMATOS_PAGINA = [
  { key: "vsl", label: "VSL" },
  { key: "carta", label: "Carta" },
  { key: "quiz", label: "Quiz" },
] as const;

export function rotuloFormato(formato: string | null): string | null {
  if (!formato) return null;
  return FORMATOS_PAGINA.find((f) => f.key === formato)?.label ?? formato;
}

/** Sugestões pros tipos de criativo — a lista é livre, isso só agiliza. */
export const TIPOS_CRIATIVO_SUGERIDOS = [
  "UGC",
  "antes/depois",
  "texto na tela",
  "depoimento",
  "notícia",
  "podcast",
  "especialista",
  "unboxing",
  "meme",
  "carrossel",
];

// ── Campos do formulário ────────────────────────────────────────────────
// Tudo texto, como os inputs: a conversão pra número/data acontece uma vez
// só, na hora de salvar (linhaDosCampos).

export interface ItemOfertaCampo {
  nome: string;
  preco: string;
}

export interface CamposSwipe {
  nome: string;
  nicho: string;
  subnicho: string;
  pais_idioma: string;
  plataforma: string;
  preco_front: string;
  order_bumps: ItemOfertaCampo[];
  upsells: ItemOfertaCampo[];
  link_pagina_vendas: string;
  link_checkout: string;
  link_ad_library: string;
  pagina_fb: string;
  anuncios_ativos: string;
  rodando_desde: string;
  formato_pagina: string;
  promessa: string;
  mecanismo: string;
  ganchos: string[];
  tipos_criativo: string[];
  score: number | null;
  por_que_achei_boa: string;
  prints: string[];
  status: StatusSwipe;
}

export function camposVazios(): CamposSwipe {
  return {
    nome: "",
    nicho: "",
    subnicho: "",
    pais_idioma: "",
    plataforma: "",
    preco_front: "",
    order_bumps: [],
    upsells: [],
    link_pagina_vendas: "",
    link_checkout: "",
    link_ad_library: "",
    pagina_fb: "",
    anuncios_ativos: "",
    rodando_desde: "",
    formato_pagina: "",
    promessa: "",
    mecanismo: "",
    ganchos: [],
    tipos_criativo: [],
    score: null,
    por_que_achei_boa: "",
    prints: [],
    status: "em_analise",
  };
}

function precoParaCampo(valor: number | null): string {
  return valor === null || valor === undefined ? "" : valor.toFixed(2).replace(".", ",");
}

export function camposDoSwipe(s: Swipe): CamposSwipe {
  return {
    nome: s.nome,
    nicho: s.nicho ?? "",
    subnicho: s.subnicho ?? "",
    pais_idioma: s.pais_idioma ?? "",
    plataforma: s.plataforma ?? "",
    preco_front: precoParaCampo(s.preco_front),
    order_bumps: (s.order_bumps ?? []).map((i) => ({ nome: i.nome, preco: precoParaCampo(i.preco) })),
    upsells: (s.upsells ?? []).map((i) => ({ nome: i.nome, preco: precoParaCampo(i.preco) })),
    link_pagina_vendas: s.link_pagina_vendas ?? "",
    link_checkout: s.link_checkout ?? "",
    link_ad_library: s.link_ad_library ?? "",
    pagina_fb: s.pagina_fb ?? "",
    anuncios_ativos: s.anuncios_ativos === null ? "" : String(s.anuncios_ativos),
    rodando_desde: s.rodando_desde ?? "",
    formato_pagina: s.formato_pagina ?? "",
    promessa: s.promessa ?? "",
    mecanismo: s.mecanismo ?? "",
    ganchos: s.ganchos ?? [],
    tipos_criativo: s.tipos_criativo ?? [],
    score: s.score,
    por_que_achei_boa: s.por_que_achei_boa ?? "",
    prints: s.prints ?? [],
    status: s.status,
  };
}

/** Texto vazio vira null — coluna sem valor, não string vazia. */
function ouNulo(texto: string): string | null {
  const t = texto.trim();
  return t ? t : null;
}

/**
 * "27,90", "R$ 27,90", "1.234,56", "27.90" ou número → 27.9.
 * Vírgula presente: ela é o decimal e o ponto é milhar. Sem vírgula, o
 * ponto é decimal.
 */
export function lerPreco(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) && valor >= 0 ? valor : null;
  if (typeof valor !== "string") return null;
  let t = valor.replace(/[^\d.,-]/g, "");
  if (!t) return null;
  if (t.includes(",")) t = t.split(".").join("").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

/** 48, "48" ou "48 anúncios" → 48. */
function lerInteiro(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) && valor >= 0 ? Math.round(valor) : null;
  if (typeof valor !== "string") return null;
  const digitos = valor.replace(/\D/g, "");
  return digitos ? Number(digitos) : null;
}

/** "2026-08-20" ou "20/08/2026" → "2026-08-20". Qualquer outra coisa → null. */
export function lerData(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const t = valor.trim();
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
  return null;
}

/** Linha pronta pro insert/update (sem product_id e sem o histórico). */
export function linhaDosCampos(c: CamposSwipe) {
  const itens = (lista: ItemOfertaCampo[]) =>
    lista.filter((i) => i.nome.trim() || i.preco.trim()).map((i) => ({ nome: i.nome.trim(), preco: lerPreco(i.preco) }));
  const limpa = (lista: string[]) => lista.map((x) => x.trim()).filter(Boolean);
  return {
    nome: c.nome.trim(),
    nicho: ouNulo(c.nicho),
    subnicho: ouNulo(c.subnicho),
    pais_idioma: ouNulo(c.pais_idioma),
    plataforma: ouNulo(c.plataforma),
    preco_front: lerPreco(c.preco_front),
    order_bumps: itens(c.order_bumps),
    upsells: itens(c.upsells),
    link_pagina_vendas: ouNulo(c.link_pagina_vendas),
    link_checkout: ouNulo(c.link_checkout),
    link_ad_library: ouNulo(c.link_ad_library),
    pagina_fb: ouNulo(c.pagina_fb),
    anuncios_ativos: lerInteiro(c.anuncios_ativos),
    rodando_desde: lerData(c.rodando_desde),
    formato_pagina: ouNulo(c.formato_pagina)?.toLowerCase() ?? null,
    promessa: ouNulo(c.promessa),
    mecanismo: ouNulo(c.mecanismo),
    ganchos: limpa(c.ganchos),
    tipos_criativo: limpa(c.tipos_criativo),
    score: c.score,
    por_que_achei_boa: ouNulo(c.por_que_achei_boa),
    prints: limpa(c.prints),
    status: c.status,
  };
}

// ── Colar JSON ──────────────────────────────────────────────────────────

/** O modelo que a equipe preenche. "Copiar modelo" entrega exatamente isto. */
export const MODELO_JSON = `{
  "nome": "",
  "nicho": "",
  "subnicho": "",
  "pais_idioma": "BR / pt",
  "plataforma": "",
  "preco_front": 0,
  "order_bumps": [{ "nome": "", "preco": 0 }],
  "upsells": [{ "nome": "", "preco": 0 }],
  "link_pagina_vendas": "",
  "link_checkout": "",
  "link_ad_library": "",
  "pagina_fb": "",
  "anuncios_ativos": 0,
  "rodando_desde": "AAAA-MM-DD",
  "formato_pagina": "VSL | carta | quiz",
  "promessa": "",
  "mecanismo": "",
  "ganchos": [""],
  "tipos_criativo": ["UGC", "antes/depois", "texto na tela"],
  "score": 0,
  "por_que_achei_boa": "",
  "prints": []
}`;

const ROTULO_CAMPO: Record<string, string> = {
  nome: "nome",
  nicho: "nicho",
  subnicho: "subnicho",
  pais_idioma: "país / idioma",
  plataforma: "plataforma",
  preco_front: "preço front",
  order_bumps: "order bumps",
  upsells: "upsells",
  link_pagina_vendas: "página de vendas",
  link_checkout: "checkout",
  link_ad_library: "Ad Library",
  pagina_fb: "página do Facebook",
  anuncios_ativos: "anúncios ativos",
  rodando_desde: "rodando desde",
  formato_pagina: "formato da página",
  promessa: "promessa",
  mecanismo: "mecanismo",
  ganchos: "ganchos",
  tipos_criativo: "tipos de criativo",
  score: "score",
  por_que_achei_boa: "por que achei boa",
  prints: "prints",
  status: "status",
};

/**
 * Valor de exemplo que sobrou do modelo ("https://...", "...", "AAAA-MM-DD",
 * "VSL | carta | quiz") — conta como vazio, não como dado.
 */
function ehPlaceholder(texto: string): boolean {
  const t = texto.trim();
  // Texto de verdade pode terminar em reticências ("Chá X que ativa..."); só
  // conta como exemplo o "..." sozinho ou o link que é só "https://...".
  return !t || t === "..." || /^https?:\/\/\.\.\.$/i.test(t) || t === "AAAA-MM-DD" || /\s\|\s/.test(t);
}

function textoDe(valor: unknown): string | null {
  if (typeof valor === "number") return String(valor);
  if (typeof valor !== "string") return null;
  return ehPlaceholder(valor) ? null : valor.trim();
}

function listaDeTextos(valor: unknown): string[] {
  if (typeof valor === "string") {
    return valor
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => !ehPlaceholder(l));
  }
  if (!Array.isArray(valor)) return [];
  return valor.map((v) => textoDe(v)).filter((v): v is string => !!v);
}

function listaDeItens(valor: unknown): ItemOfertaCampo[] {
  if (!Array.isArray(valor)) return [];
  const itens: ItemOfertaCampo[] = [];
  for (const v of valor) {
    if (typeof v === "string") {
      if (!ehPlaceholder(v)) itens.push({ nome: v.trim(), preco: "" });
      continue;
    }
    if (typeof v !== "object" || v === null) continue;
    const o = v as Record<string, unknown>;
    const nome = textoDe(o.nome ?? o.name) ?? "";
    const preco = lerPreco(o.preco ?? o.price ?? o.valor);
    if (!nome && !preco) continue;
    itens.push({ nome, preco: precoParaCampo(preco) });
  }
  return itens;
}

/**
 * Deixa passar o que as pessoas colam de verdade: só o miolo sem as chaves
 * de fora, cercado de \`\`\`json, ou com vírgula sobrando no fim.
 */
function prepararTexto(bruto: string): string {
  let t = bruto.trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  if (!t.startsWith("{") && !t.startsWith("[")) t = `{${t.replace(/,\s*$/, "")}}`;
  t = t.replace(/,(\s*[}\]])/g, "$1");
  return t;
}

export type ResultadoLeitura =
  | { ok: true; campos: Partial<CamposSwipe>; preenchidos: string[]; avisos: string[] }
  | { ok: false; erro: string };

export function lerJsonDeSwipe(bruto: string): ResultadoLeitura {
  if (!bruto.trim()) return { ok: false, erro: "Cole o JSON do produto primeiro." };

  let dado: unknown;
  try {
    dado = JSON.parse(prepararTexto(bruto));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, erro: `Não deu pra ler o JSON: ${msg}` };
  }
  if (Array.isArray(dado)) dado = dado[0];
  if (typeof dado !== "object" || dado === null) return { ok: false, erro: "O JSON precisa ser um objeto { ... }." };

  // Chaves sem diferença de caixa: "Nome" e "nome" são o mesmo campo.
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(dado as Record<string, unknown>)) o[k.trim().toLowerCase()] = v;

  const campos: Partial<CamposSwipe> = {};
  const avisos: string[] = [];

  const texto = (chave: keyof CamposSwipe) => {
    const v = textoDe(o[chave]);
    if (v) (campos as Record<string, unknown>)[chave] = v;
  };
  texto("nome");
  texto("nicho");
  texto("subnicho");
  texto("pais_idioma");
  texto("plataforma");
  texto("link_pagina_vendas");
  texto("link_checkout");
  texto("link_ad_library");
  texto("pagina_fb");
  texto("promessa");
  texto("mecanismo");
  texto("por_que_achei_boa");

  if (o.preco_front !== undefined) {
    const p = lerPreco(o.preco_front);
    if (p !== null && p > 0) campos.preco_front = precoParaCampo(p);
    else if (p === null) avisos.push("preço front não é um número — ficou em branco.");
  }

  if (o.anuncios_ativos !== undefined) {
    const n = lerInteiro(o.anuncios_ativos);
    if (n !== null && n > 0) campos.anuncios_ativos = String(n);
  }

  if (o.rodando_desde !== undefined) {
    const d = lerData(o.rodando_desde);
    if (d) campos.rodando_desde = d;
    else if (textoDe(o.rodando_desde)) avisos.push("rodando desde não é uma data (use AAAA-MM-DD) — ficou em branco.");
  }

  const formato = textoDe(o.formato_pagina);
  if (formato) {
    const f = formato.toLowerCase();
    campos.formato_pagina = FORMATOS_PAGINA.find((x) => f.includes(x.key))?.key ?? formato;
  } else if (typeof o.formato_pagina === "string" && /\|/.test(o.formato_pagina)) {
    avisos.push("formato da página veio com as três opções do modelo — escolha uma.");
  }

  const bumps = listaDeItens(o.order_bumps);
  if (bumps.length) campos.order_bumps = bumps;
  const upsells = listaDeItens(o.upsells);
  if (upsells.length) campos.upsells = upsells;

  const ganchos = listaDeTextos(o.ganchos);
  if (ganchos.length) campos.ganchos = ganchos;
  const tipos = listaDeTextos(o.tipos_criativo);
  if (tipos.length) campos.tipos_criativo = tipos;

  const prints = listaDeTextos(o.prints).filter((p) => /^https?:\/\//i.test(p));
  if (prints.length) campos.prints = prints;
  const printsIgnorados = listaDeTextos(o.prints).length - prints.length;
  if (printsIgnorados > 0) avisos.push(`${printsIgnorados} print(s) sem endereço http(s) — envie a imagem pelo campo de prints.`);

  if (o.score !== undefined && o.score !== null && o.score !== "") {
    const s = typeof o.score === "number" ? o.score : Number(String(o.score).replace(",", "."));
    if (Number.isFinite(s) && s > 0) campos.score = Math.max(0, Math.min(10, Math.round(s)));
    else if (!Number.isFinite(s)) avisos.push("score não é um número de 0 a 10 — ficou em branco.");
  }

  const desconhecidas = Object.keys(o).filter((k) => !(k in ROTULO_CAMPO));
  if (desconhecidas.length) avisos.push(`Ignorado (não é campo do swipe): ${desconhecidas.join(", ")}.`);

  if (!campos.nome) avisos.push("Faltou o nome do produto — preencha antes de salvar.");

  const preenchidos = Object.keys(campos).map((k) => ROTULO_CAMPO[k] ?? k);
  return { ok: true, campos, preenchidos, avisos };
}

/** O swipe de volta no formato do JSON colado — pra copiar, compartilhar, mandar pra uma IA. */
export function jsonDoSwipe(s: Swipe): string {
  return JSON.stringify(
    {
      nome: s.nome,
      nicho: s.nicho,
      subnicho: s.subnicho,
      pais_idioma: s.pais_idioma,
      plataforma: s.plataforma,
      preco_front: s.preco_front,
      order_bumps: s.order_bumps,
      upsells: s.upsells,
      link_pagina_vendas: s.link_pagina_vendas,
      link_checkout: s.link_checkout,
      link_ad_library: s.link_ad_library,
      pagina_fb: s.pagina_fb,
      anuncios_ativos: s.anuncios_ativos,
      rodando_desde: s.rodando_desde,
      formato_pagina: s.formato_pagina,
      promessa: s.promessa,
      mecanismo: s.mecanismo,
      ganchos: s.ganchos,
      tipos_criativo: s.tipos_criativo,
      score: s.score,
      por_que_achei_boa: s.por_que_achei_boa,
      prints: s.prints,
    },
    null,
    2
  );
}

// ── Leitura pra tela ────────────────────────────────────────────────────

/** Moeda pelo país: BR (ou sem país) em real; US em dólar; o resto só o número. */
export function formatarPreco(valor: number | null | undefined, paisIdioma?: string | null): string {
  if (valor === null || valor === undefined) return "—";
  const pais = (paisIdioma ?? "").trim().slice(0, 2).toUpperCase();
  if (!pais || pais === "BR") return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (pais === "US") return `US$ ${valor.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (["PT", "ES", "DE", "FR", "IT"].includes(pais)) return valor.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Front + todos os bumps + todos os upsells: o máximo que um comprador paga. */
export function ticketMaximo(s: Pick<Swipe, "preco_front" | "order_bumps" | "upsells">): number | null {
  const soma = (lista: { preco: number | null }[]) => lista.reduce((t, i) => t + (i.preco ?? 0), 0);
  if (s.preco_front === null && !s.order_bumps.length && !s.upsells.length) return null;
  return (s.preco_front ?? 0) + soma(s.order_bumps) + soma(s.upsells);
}

/** Hoje no fuso de quem está usando, em AAAA-MM-DD. */
export function hojeIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Dias inteiros entre a data (AAAA-MM-DD) e hoje. */
export function diasDesde(data: string | null): number | null {
  if (!data) return null;
  const [a, m, d] = data.split("-").map(Number);
  const inicio = Date.UTC(a, m - 1, d);
  const [ha, hm, hd] = hojeIso().split("-").map(Number);
  const hoje = Date.UTC(ha, hm - 1, hd);
  const dias = Math.round((hoje - inicio) / 86_400_000);
  return dias >= 0 ? dias : null;
}

export function formatarData(data: string | null): string {
  if (!data) return "—";
  const [a, m, d] = data.split("-");
  return `${d}/${m}/${a}`;
}

/**
 * Da primeira contagem registrada até a última: "de 12 pra 48 em 10 dias".
 * Precisa de pelo menos duas contagens — uma só não é tendência.
 */
export function tendenciaAnuncios(historico: Swipe["historico_anuncios"]): { de: number; para: number; dias: number } | null {
  if (!historico || historico.length < 2) return null;
  const ordenado = [...historico].sort((a, b) => a.data.localeCompare(b.data));
  const primeiro = ordenado[0];
  const ultimo = ordenado[ordenado.length - 1];
  const dias = (diasDesde(primeiro.data) ?? 0) - (diasDesde(ultimo.data) ?? 0);
  return { de: primeiro.valor, para: ultimo.valor, dias };
}

/**
 * Registra uma contagem nova no histórico. Contagem do mesmo dia substitui a
 * anterior daquele dia (corrigir um número digitado errado não vira ponto
 * novo); valor igual ao último não entra (não é informação nova).
 */
export function registrarContagem(historico: Swipe["historico_anuncios"], valor: number | null): Swipe["historico_anuncios"] {
  if (valor === null) return historico ?? [];
  const hoje = hojeIso();
  const semHoje = (historico ?? []).filter((h) => h.data !== hoje);
  const ultimo = [...semHoje].sort((a, b) => a.data.localeCompare(b.data)).at(-1);
  if (ultimo && ultimo.valor === valor) return semHoje;
  return [...semHoje, { data: hoje, valor }];
}
