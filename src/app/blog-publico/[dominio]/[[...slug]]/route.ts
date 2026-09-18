import { createAdminClient } from "@/lib/supabase/admin";
import { markdownParaHtml, urlPublica } from "@/lib/blog-render";

/**
 * A página pública do blog, servida no domínio do cliente.
 *
 * É route handler devolvendo HTML, e não uma página React, de propósito: o
 * layout raiz do app força tema escuro, lang="pt-BR" e um script de tema que
 * lê localStorage — nada disso pertence a um artigo que vai ser lido por um
 * visitante anônimo e rastejado pelo Google. Aqui o documento é inteiro
 * nosso, sem bundle de app junto.
 *
 * Chega por dois caminhos, e os dois terminam neste mesmo endereço:
 *   subdiretório -> proxy reverso do servidor do cliente aponta pra cá
 *   subdomínio   -> o middleware reescreve pelo Host quando o CNAME aponta
 *                   pra cá
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { dominio: string; slug?: string[] } }) {
  const admin = createAdminClient({ semCache: true });
  const partes = params.slug ?? [];

  const { data: dominio } = await admin
    .from("blog_dominios")
    .select("id, dominio, caminho, nome, idioma, verificado, ativo")
    .eq("dominio", params.dominio.toLowerCase())
    .maybeSingle();

  // Domínio não verificado não publica. É o que impede alguém de cadastrar
  // um domínio que não é dele e pendurar conteúdo no nome do vizinho.
  if (!dominio || !dominio.ativo || !dominio.verificado) {
    return html(paginaSimples("Blog não encontrado", "Esse endereço não está publicando nada."), 404);
  }

  if (partes[0] === "sitemap.xml") return sitemap(admin, dominio);

  if (partes.length === 0) return indice(admin, dominio);

  return post(admin, dominio, partes.join("/"));
}

type Dominio = {
  id: string;
  dominio: string;
  caminho: string;
  nome: string | null;
  idioma: string;
};

async function post(admin: ReturnType<typeof createAdminClient>, dominio: Dominio, slug: string) {
  const { data } = await admin
    .from("blog_posts")
    .select("titulo, meta_descricao, conteudo_md, imagem_url, imagem_alt, publicado_em, updated_at, palavra_chave")
    .eq("dominio_id", dominio.id)
    .eq("slug", slug)
    .eq("status", "publicado")
    .maybeSingle();

  if (!data) {
    return html(paginaSimples("Post não encontrado", "Esse endereço não existe ou ainda não foi publicado."), 404);
  }

  const canonica = urlPublica(dominio.dominio, dominio.caminho, slug);
  const corpo = markdownParaHtml(data.conteudo_md);
  const dataTexto = data.publicado_em
    ? new Date(data.publicado_em).toLocaleDateString(dominio.idioma, { day: "2-digit", month: "long", year: "numeric" })
    : "";

  // JSON-LD: é como o Google entende que isto é um artigo com data e autor,
  // em vez de uma página qualquer com texto.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.titulo,
    description: data.meta_descricao ?? undefined,
    image: data.imagem_url ?? undefined,
    datePublished: data.publicado_em ?? undefined,
    dateModified: data.updated_at,
    mainEntityOfPage: canonica,
    publisher: { "@type": "Organization", name: dominio.nome ?? dominio.dominio },
  };

  return html(
    documento({
      idioma: dominio.idioma,
      titulo: data.titulo,
      descricao: data.meta_descricao,
      canonica,
      imagem: data.imagem_url,
      tipoOg: "article",
      jsonLd,
      conteudo: `
        <header class="capa">
          <a class="voltar" href="${escAttr(urlPublica(dominio.dominio, dominio.caminho))}">${esc(dominio.nome ?? dominio.dominio)}</a>
          <h1>${esc(data.titulo)}</h1>
          ${dataTexto ? `<p class="data"><time datetime="${escAttr(data.publicado_em ?? "")}">${esc(dataTexto)}</time></p>` : ""}
        </header>
        ${
          data.imagem_url
            ? `<img class="hero" src="${escAttr(data.imagem_url)}" alt="${escAttr(data.imagem_alt ?? data.titulo)}" />`
            : ""
        }
        <article>${corpo}</article>
      `,
    })
  );
}

async function indice(admin: ReturnType<typeof createAdminClient>, dominio: Dominio) {
  const { data } = await admin
    .from("blog_posts")
    .select("slug, titulo, meta_descricao, imagem_url, imagem_alt, publicado_em")
    .eq("dominio_id", dominio.id)
    .eq("status", "publicado")
    .order("publicado_em", { ascending: false })
    .limit(100);

  const posts = data ?? [];
  const nome = dominio.nome ?? dominio.dominio;

  const lista = posts.length
    ? posts
        .map((p) => {
          const url = urlPublica(dominio.dominio, dominio.caminho, p.slug);
          const quando = p.publicado_em
            ? new Date(p.publicado_em).toLocaleDateString(dominio.idioma, { day: "2-digit", month: "short", year: "numeric" })
            : "";
          return `
            <li>
              <a href="${escAttr(url)}">
                ${p.imagem_url ? `<img src="${escAttr(p.imagem_url)}" alt="${escAttr(p.imagem_alt ?? "")}" />` : `<span class="sem-capa"></span>`}
                <span class="texto">
                  <strong>${esc(p.titulo)}</strong>
                  ${p.meta_descricao ? `<span class="resumo">${esc(p.meta_descricao)}</span>` : ""}
                  ${quando ? `<span class="data">${esc(quando)}</span>` : ""}
                </span>
              </a>
            </li>`;
        })
        .join("")
    : `<li class="vazio">Nada publicado ainda.</li>`;

  return html(
    documento({
      idioma: dominio.idioma,
      titulo: `Blog — ${nome}`,
      descricao: `Artigos de ${nome}.`,
      canonica: urlPublica(dominio.dominio, dominio.caminho),
      imagem: null,
      tipoOg: "website",
      jsonLd: null,
      conteudo: `
        <header class="capa">
          <h1>Blog</h1>
          <p class="data">${esc(nome)}</p>
        </header>
        <ul class="indice">${lista}</ul>
      `,
    })
  );
}

async function sitemap(admin: ReturnType<typeof createAdminClient>, dominio: Dominio) {
  const { data } = await admin
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("dominio_id", dominio.id)
    .eq("status", "publicado")
    .order("updated_at", { ascending: false })
    .limit(5000);

  const urls = [
    `<url><loc>${escAttr(urlPublica(dominio.dominio, dominio.caminho))}</loc></url>`,
    ...(data ?? []).map(
      (p) =>
        `<url><loc>${escAttr(urlPublica(dominio.dominio, dominio.caminho, p.slug))}</loc><lastmod>${p.updated_at.slice(0, 10)}</lastmod></url>`
    ),
  ].join("");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=600" },
  });
}

/* ------------------------------ html ------------------------------ */

function html(corpo: string, status = 200): Response {
  return new Response(corpo, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Cache curto na borda: o visitante pega a versão pronta, mas
      // desligar um domínio ou despublicar um post faz efeito em ~1 minuto.
      // Janela maior daria mais desempenho e deixaria conteúdo revogado no
      // ar por tempo demais — e "revogado" aqui inclui domínio que perdeu a
      // verificação.
      "cache-control": status === 200 ? "public, max-age=0, s-maxage=60, stale-while-revalidate=300" : "no-store",
    },
  });
}

function documento({
  idioma,
  titulo,
  descricao,
  canonica,
  imagem,
  tipoOg,
  jsonLd,
  conteudo,
}: {
  idioma: string;
  titulo: string;
  descricao: string | null;
  canonica: string;
  imagem: string | null;
  tipoOg: string;
  jsonLd: unknown;
  conteudo: string;
}): string {
  return `<!doctype html>
<html lang="${escAttr(idioma)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
${descricao ? `<meta name="description" content="${escAttr(descricao)}">` : ""}
<link rel="canonical" href="${escAttr(canonica)}">
<meta property="og:type" content="${escAttr(tipoOg)}">
<meta property="og:title" content="${escAttr(titulo)}">
${descricao ? `<meta property="og:description" content="${escAttr(descricao)}">` : ""}
<meta property="og:url" content="${escAttr(canonica)}">
${imagem ? `<meta property="og:image" content="${escAttr(imagem)}">` : ""}
<meta name="twitter:card" content="${imagem ? "summary_large_image" : "summary"}">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : ""}
<style>
:root{color-scheme:light dark;--fg:#16181d;--fg2:#5b6270;--bg:#fff;--linha:#e7e9ee;--link:#0b6b3a}
@media (prefers-color-scheme:dark){:root{--fg:#e8eaee;--fg2:#9aa1ae;--bg:#0f1115;--linha:#252932;--link:#4ade80}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
main{max-width:720px;margin:0 auto;padding:48px 20px 96px}
.capa{margin-bottom:28px}
.voltar{display:inline-block;margin-bottom:20px;color:var(--fg2);font-size:14px;text-decoration:none}
.voltar:hover{color:var(--fg)}
h1{margin:0 0 12px;font-size:36px;line-height:1.2;letter-spacing:-.02em}
h2{margin:40px 0 12px;font-size:25px;line-height:1.3;letter-spacing:-.01em}
h3{margin:32px 0 10px;font-size:20px}
p{margin:0 0 20px}
.data{color:var(--fg2);font-size:14px;margin:0}
.hero{width:100%;height:auto;border-radius:12px;margin:0 0 36px;display:block}
article a{color:var(--link)}
ul,ol{margin:0 0 20px;padding-left:22px}
li{margin-bottom:8px}
blockquote{margin:0 0 20px;padding:4px 0 4px 18px;border-left:3px solid var(--linha);color:var(--fg2)}
code{background:var(--linha);border-radius:4px;padding:1px 5px;font-size:.9em}
.indice{list-style:none;margin:0;padding:0}
.indice li{margin:0;border-top:1px solid var(--linha)}
.indice li:last-child{border-bottom:1px solid var(--linha)}
.indice a{display:flex;gap:16px;align-items:center;padding:18px 0;text-decoration:none;color:inherit}
.indice img,.sem-capa{width:104px;height:66px;border-radius:8px;object-fit:cover;flex-shrink:0;background:var(--linha)}
.indice .texto{display:flex;flex-direction:column;gap:4px;min-width:0}
.indice strong{font-size:18px;line-height:1.35}
.indice .resumo{color:var(--fg2);font-size:14px}
.indice a:hover strong{color:var(--link)}
.vazio{color:var(--fg2);padding:18px 0}
@media (max-width:600px){main{padding:32px 18px 64px}h1{font-size:28px}h2{font-size:22px}.indice img,.sem-capa{width:76px;height:52px}}
</style>
</head>
<body><main>${conteudo}</main></body>
</html>`;
}

function paginaSimples(titulo: string, texto: string): string {
  return documento({
    idioma: "pt-BR",
    titulo,
    descricao: null,
    canonica: "",
    imagem: null,
    tipoOg: "website",
    jsonLd: null,
    conteudo: `<header class="capa"><h1>${esc(titulo)}</h1><p class="data">${esc(texto)}</p></header>`,
  });
}

function esc(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escAttr(t: string): string {
  return esc(t).replace(/"/g, "&quot;");
}
