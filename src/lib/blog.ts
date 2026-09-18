export const CAMPOS_DOMINIO =
  "id, dominio, caminho, modo, nome, idioma, publico_alvo, tom, token_verificacao, verificado, verificado_em, ativo, created_at, updated_at";

export const MODOS = ["subdiretorio", "subdominio"] as const;
export type ModoBlog = (typeof MODOS)[number];

export const MODO_LABEL: Record<ModoBlog, string> = {
  subdiretorio: "Subdiretório (seudominio.com/blog)",
  subdominio: "Subdomínio (blog.seudominio.com)",
};

export function ehModo(v: unknown): v is ModoBlog {
  return typeof v === "string" && (MODOS as readonly string[]).includes(v);
}

export const CAMPOS_POST =
  "id, dominio_id, slug, titulo, meta_descricao, palavra_chave, conteudo_md, imagem_url, imagem_alt, status, publicado_em, tema, created_at, updated_at";

export interface BlogDominio {
  id: string;
  dominio: string;
  caminho: string;
  modo: ModoBlog;
  nome: string | null;
  idioma: string;
  publico_alvo: string | null;
  tom: string | null;
  token_verificacao: string;
  verificado: boolean;
  verificado_em: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  dominio_id: string | null;
  slug: string;
  titulo: string;
  meta_descricao: string | null;
  palavra_chave: string | null;
  conteudo_md: string;
  imagem_url: string | null;
  imagem_alt: string | null;
  status: "rascunho" | "publicado";
  publicado_em: string | null;
  tema: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Host puro, do jeito que vai ser comparado com o Host da requisição.
 *
 * Aceita o que a pessoa tiver em mãos — a URL inteira copiada do navegador,
 * com www, com barra no fim — e devolve só "escolaprofitx.com". Sem isso,
 * "https://escolaprofitx.com/" e "escolaprofitx.com" viram dois domínios
 * cadastrados que nunca batem com requisição nenhuma.
 */
export function normalizarDominio(valor: unknown): string {
  if (typeof valor !== "string") return "";
  let v = valor.trim().toLowerCase();
  v = v.replace(/^https?:\/\//, "");
  v = v.split("/")[0];
  v = v.split(":")[0];
  v = v.replace(/^www\./, "");
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(v) ? v : "";
}

/** Caminho do blog dentro do site: sempre com barra na frente, nunca no fim. */
export function normalizarCaminho(valor: unknown): string {
  if (typeof valor !== "string" || !valor.trim()) return "/blog";
  const limpo = valor.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
  return limpo ? `/${limpo}` : "/blog";
}

/**
 * Slug de URL a partir de qualquer texto.
 *
 * Acento fora, espaço vira hífen, o resto cai. É o mesmo tratamento do
 * título e do slug digitado à mão, pra um post criado pelo tema e outro
 * criado pela slug chegarem no mesmo formato.
 */
export function gerarSlug(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * Tema legível a partir de uma slug.
 *
 * Quando a pessoa entrega só "como-declarar-cripto-no-imposto-de-renda", o
 * modelo escreve melhor recebendo a frase do que a slug crua — e é isso que
 * permite os dois caminhos de criação terminarem no mesmo prompt.
 */
export function temaDaSlug(slug: string): string {
  return slug.replace(/-/g, " ").trim();
}

/** Endereço interno que o proxy reverso do cliente deve chamar. */
export function alvoDoProxy(appHost: string, dominio: string): string {
  return `https://${appHost}/blog-publico/${dominio}`;
}

/** Nome do registro TXT que prova a posse do domínio. */
export function nomeRegistroTxt(dominio: string): string {
  return `_profitx-engine.${dominio}`;
}

export function contarPalavras(markdown: string): number {
  return markdown
    .replace(/[#*_>`[\]()!-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}
