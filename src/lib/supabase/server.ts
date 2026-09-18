import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import type { Database } from "./types";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chamado a partir de um Server Component; ignorado pois o middleware
            // já cuida de refrescar a sessão nas requisições.
          }
        },
      },
    }
  );
}

/**
 * `auth.getUser()` sempre valida o JWT em rede contra o Supabase Auth (por
 * design, nunca confia só no cookie local). `cache()` dedupe layout+page
 * dentro do mesmo render; o header cobre o pedaço que o cache não alcança.
 *
 * O middleware já validou a sessão nesta mesma requisição e escreveu o
 * resultado em x-user-id. Reaproveitar isso evita uma segunda viagem ao
 * Supabase por navegação. O header é sempre escrito pelo middleware (vazio
 * quando não há sessão), então não dá pra forjar de fora; e se ele não
 * existir — rota que não passou pelo middleware — cai na chamada real.
 */
export const getUser = cache(async () => {
  const cabecalhos = headers();
  const id = cabecalhos.get("x-user-id");

  if (id) {
    const email = cabecalhos.get("x-user-email") || null;
    return { data: { user: { id, email } as User }, error: null };
  }

  const supabase = createClient();
  return supabase.auth.getUser();
});

/** Mesma lógica de dedupe do `getUser` acima, para a query de perfil que várias páginas repetiam. */
export const getProfile = cache(async (userId: string) => {
  const supabase = createClient();
  return supabase.from("profiles").select("full_name, role, status").eq("id", userId).single();
});
