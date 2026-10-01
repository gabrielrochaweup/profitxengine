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

export type TipoDePagina = "checkout" | "quiz" | "plataforma" | "site";

export const TIPO_DE_PAGINA_ROTULO: Record<TipoDePagina, string> = {
  checkout: "Checkout",
  quiz: "Quiz / Landing",
  plataforma: "Plataforma",
  site: "Site",
};

/**
 * Tipo da página, pelo endereço. Heurística: não existe um cadastro de
 * páginas, então o tipo sai de pistas no domínio/caminho. Página que não
 * bate com nenhuma pista cai em "Quiz / Landing", que é onde o tráfego
 * pago entra.
 */
export function tipoDaPagina(pagina: string): TipoDePagina {
  const p = pagina.toLowerCase();
  // Domínios inteiros (com o ponto): "onprofit" solto casava com
  // "robsonprofitx.com" e jogava a landing no grupo Checkout.
  if (/(^|\.)(pay|checkout|secure)\.|(^|\.)(onprofit\.com|hotmart\.com|kiwify\.com|eduzz\.com|monetizze\.com|pagar\.me|mercadopago\.com)/.test(p)) {
    return "checkout";
  }
  if (/digvortex|vortex|\/login|\/entrar|\/cadastro|\/pendente|magic-confirm|forgot-password/.test(p)) {
    return "plataforma";
  }
  if (/^(www\.)?escolaprofitx\.com/.test(p)) return "site";
  return "quiz";
}
