import { NextResponse } from "next/server";

/**
 * Redireciona com Location RELATIVO, de propósito.
 *
 * Atrás de proxy reverso (nginx → localhost:3400, que é como a Engine roda na
 * VPS), o Next monta `request.url` e `request.nextUrl` a partir do header
 * Host — e o nginx repassa "Host: localhost:3400". Qualquer redirect montado
 * com esse endereço manda a pessoa pra https://localhost:3400/..., que não
 * existe no computador dela. Foi o que aconteceu no login com Google e no
 * botão Sair.
 *
 * Location relativo tira a decisão do nosso lado: o navegador resolve contra o
 * endereço que ELE pediu, que é o público. Funciona igual na Vercel, na VPS e
 * em desenvolvimento, sem variável de ambiente pra manter.
 *
 * Também é mais seguro do que confiar em x-forwarded-host: host de header é
 * controlado por quem chama, e montar redirect com ele é o caminho clássico
 * pra open redirect.
 *
 * O 303 é o padrão daqui porque o caso que mais dói é o POST: com 307 o
 * navegador PRESERVA o método e reenvia /login como POST, que cai em 405.
 */
export function redirecionar(caminho: string, status: 303 | 307 = 303) {
  return new NextResponse(null, { status, headers: { Location: caminho } });
}

/**
 * Caminho de destino que veio da URL — ou seja, entrada de terceiro.
 *
 * Só caminho interno passa: "//outro-site.com" é URL protocol-relative e o
 * navegador a trata como OUTRO domínio — seria um open redirect assinado pela
 * nossa própria tela de login.
 */
export function destinoSeguro(valor: string | null, padrao = "/dashboard"): string {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//")) return padrao;
  return valor;
}
