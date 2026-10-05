import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type EndpointRow = Database["public"]["Tables"]["tracking_webhook_endpoints"]["Row"];

/** Os campos que a tela usa. Nunca inclui o segredo cifrado. */
export type EndpointLinha = Omit<EndpointRow, "encrypted_secret" | "created_by">;

const CAMPOS_BASE = "id, product_id, kind, platform, label, endpoint_slug, active, last_test_at, last_test_ok, created_at";

/**
 * Lista as conexões de um produto.
 *
 * Pede a coluna "modo" (migration 0130) e, se o banco ainda não a tem, repete
 * a consulta sem ela e deduz o estado de "active". Sem isso, o deploy antes do
 * SQL deixaria a lista de conexões inteira vazia.
 */
export async function listarEndpoints(client: SupabaseClient<Database>, productId: string): Promise<EndpointLinha[]> {
  const consulta = (campos: string) =>
    client
      .from("tracking_webhook_endpoints")
      .select(campos as "*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

  let { data } = await consulta(CAMPOS_BASE.replace("active,", "active, modo,")).then((r) =>
    r.error ? consulta(CAMPOS_BASE) : r
  );
  data = data ?? [];

  return (data as unknown as Partial<EndpointLinha>[]).map((e) => ({
    ...e,
    modo: e.modo ?? (e.active === false ? "pausado" : "ativo"),
  })) as EndpointLinha[];
}
