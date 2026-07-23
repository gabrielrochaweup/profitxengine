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
  const next = url.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
