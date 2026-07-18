import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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
 * design, nunca confia só no cookie local). O layout e a page de cada rota
 * chamavam isso de forma independente, triplicando o round-trip por
 * navegação (middleware + layout + page). `cache()` do React dedupe pelo
 * mesmo request de RSC, então layout+page passam a pagar só 1 chamada.
 */
export const getUser = cache(async () => {
  const supabase = createClient();
  return supabase.auth.getUser();
});

/** Mesma lógica de dedupe do `getUser` acima, para a query de perfil que várias páginas repetiam. */
export const getProfile = cache(async (userId: string) => {
  const supabase = createClient();
  return supabase.from("profiles").select("full_name, role, status").eq("id", userId).single();
});
