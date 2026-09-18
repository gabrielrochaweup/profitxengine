/**
 * Markdown -> HTML para a página pública do blog.
 *
 * Escrito à mão, e não com uma biblioteca, por um motivo: aqui TUDO é
 * escapado primeiro e só depois as marcações conhecidas viram tags. As
 * bibliotecas de markdown deixam HTML cru passar por padrão — e o texto
 * chega de um modelo e de um editor livre, direto pra uma página pública.
 * Um "<script>" colado sem querer viraria script de verdade.
 *
 * Cobre o que o gerador produz: títulos, parágrafos, negrito, itálico,
 * listas, citação e link. O que não estiver aqui sai como texto.
 */
export function markdownParaHtml(md: string): string {
  const blocos = md.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const saida: string[] = [];

  for (const bruto of blocos) {
    const bloco = bruto.trim();
    if (!bloco) continue;

    const titulo = bloco.match(/^(#{1,6})\s+(.*)$/);
    if (titulo) {
      // O h1 é do título do post, então o corpo nunca passa de h2 — mas
      // também não pula: "##" vira h2, e não h3. Hierarquia com buraco
      // (h1 direto pra h3) é o tipo de coisa que auditoria de SEO aponta e
      // que leitor de tela atrapalha de verdade.
      const nivel = Math.min(6, Math.max(2, titulo[1].length));
      saida.push(`<h${nivel}>${inline(titulo[2])}</h${nivel}>`);
      continue;
    }

    const linhas = bloco.split("\n");

    if (linhas.every((l) => /^\s*[-*]\s+/.test(l))) {
      const itens = linhas.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("");
      saida.push(`<ul>${itens}</ul>`);
      continue;
    }

    if (linhas.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
      const itens = linhas.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>`).join("");
      saida.push(`<ol>${itens}</ol>`);
      continue;
    }

    if (linhas.every((l) => /^\s*>/.test(l))) {
      const texto = linhas.map((l) => l.replace(/^\s*>\s?/, "")).join(" ");
      saida.push(`<blockquote>${inline(texto)}</blockquote>`);
      continue;
    }

    saida.push(`<p>${inline(linhas.join(" "))}</p>`);
  }

  return saida.join("\n");
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(texto: string): string {
  let t = escapar(texto);
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  // Só http(s): sem isso um "javascript:" no href viraria clique executável.
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
  return t;
}

/** Endereço final do post, no domínio do cliente — é o que vira canonical. */
export function urlPublica(dominio: string, caminho: string, slug?: string): string {
  const base = caminho === "/" ? "" : caminho.replace(/\/$/, "");
  return `https://${dominio}${base}${slug ? `/${slug}` : ""}` || `https://${dominio}/`;
}
