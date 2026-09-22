import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Ponto único de retorno pra qualquer fluxo do Supabase Auth baseado em link
 * (OAuth do Google, recuperação de senha, confirmação de e-mail): todos
 * mandam um `code` que precisa ser trocado por sessão no servidor antes de
 * seguir pro destino final (`next`).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = destinoSeguro(url.searchParams.get("next"));

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return irPara(next);
    }
  }

  return irPara("/login?error=auth");
}

/**
 * Redireciona com Location RELATIVO, de propósito.
 *
 * Atrás de proxy reverso (nginx → localhost:3400, que é como a Engine roda
 * na VPS), `request.url` traz o host INTERNO: o nginx repassa
 * "Host: localhost:3400" e o Next monta a URL a partir disso. Um
 * `NextResponse.redirect(new URL(next, url.origin))` mandava a pessoa, logo
 * depois de autenticar no Google, pra https://localhost:3400/dashboard — que
 * não existe no computador dela.
 *
 * Location relativo tira a decisão do nosso lado: o navegador resolve contra
 * o endereço que ELE pediu, que é o público. O middleware já redirecionava
 * assim e por isso nunca quebrou nesse caminho.
 *
 * Também é mais seguro do que confiar em x-forwarded-host: host de header é
 * controlado por quem chama, e montar redirect com ele é o caminho clássico
 * pra open redirect.
 */
function irPara(caminho: string) {
  return new NextResponse(null, { status: 307, headers: { Location: caminho } });
}

/**
 * `next` vem da URL, então é entrada de terceiro.
 *
 * Só caminho interno passa: "//outro-site.com" é URL protocol-relative e o
 * navegador a trata como OUTRO domínio — seria um open redirect assinado
 * pela nossa própria tela de login.
 */
function destinoSeguro(valor: string | null): string {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//")) return "/dashboard";
  return valor;
}
