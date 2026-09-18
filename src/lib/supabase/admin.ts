import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Client com service_role — ignora RLS. Só pode ser usado em código server-side
 * (route handlers, server actions), nunca importado por componentes client.
 *
 * `semCache` é obrigatório em rota GET pública. O Next embrulha o fetch global
 * e guarda a resposta; como o supabase-js usa esse fetch, a CONSULTA fica em
 * cache. Numa rota autenticada isso não aparece (ler o cookie já torna a rota
 * dinâmica), mas numa página pública significa continuar servindo o que o
 * banco já não diz mais — foi assim que um domínio marcado como não
 * verificado seguiu publicando.
 */
export function createAdminClient(opcoes?: { semCache?: boolean }) {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      ...(opcoes?.semCache
        ? { global: { fetch: (url: RequestInfo | URL, init?: RequestInit) => fetch(url, { ...init, cache: "no-store" }) } }
        : {}),
    }
  );
}
