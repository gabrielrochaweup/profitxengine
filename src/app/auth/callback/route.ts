import { createClient } from "@/lib/supabase/server";
import { destinoSeguro, redirecionar } from "@/lib/redirecionar";

/**
 * Ponto único de retorno pra qualquer fluxo do Supabase Auth baseado em link
 * (OAuth do Google, recuperação de senha, confirmação de e-mail): todos
 * mandam um `code` que precisa ser trocado por sessão no servidor antes de
 * seguir pro destino final (`next`).
 *
 * Os redirects daqui são relativos — o porquê está em redirecionar.ts.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = destinoSeguro(url.searchParams.get("next"));

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirecionar(next, 307);
    }
  }

  return redirecionar("/login?error=auth", 307);
}
