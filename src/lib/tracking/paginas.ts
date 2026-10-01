// "dominio/caminho" de uma URL: domínio em minúsculas, sem protocolo, sem
// ?query, sem #, sem barra no fim. O caminho mantém maiúsculas (o checkout
// da Onprofit usa "/0c1LryyT"). Mesma regra de tracking_normalizar_pagina()
// na migration 0125 — as duas precisam dar o mesmo texto.
export function normalizarPagina(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/([^/?#]+)([^?#]*)/.exec(url.trim());
  if (!m) return null;
  return m[1].toLowerCase() + m[2].replace(/\/+$/, "");
}

/** Página de desenvolvimento (localhost, 127.0.0.1, *.local) — fica escondida na tela por padrão. */
export function ehPaginaDeTeste(pagina: string): boolean {
  return /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:\d+)?(\/|$)|\.local(:\d+)?(\/|$)/i.test(pagina);
}
