import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { EVENTOS_META_PADRAO, lerEventosMeta, limparPaginasCheckout, type EventosMeta } from "./eventos-meta";

export interface ConfigDoScript {
  eventos: EventosMeta;
  paginasCheckout: string[];
}

/**
 * Config de eventos do produto. Nunca falha: sem linha, ou com a migration
 * 0124 ainda não rodada (tabela inexistente), devolve o padrão — que é
 * exatamente o comportamento de antes desta tela existir.
 */
export async function lerConfigDoScript(
  admin: ReturnType<typeof createAdminClient>,
  productId: string
): Promise<ConfigDoScript> {
  try {
    const { data, error } = await admin
      .from("tracking_script_config")
      .select("eventos_meta, paginas_checkout")
      .eq("product_id", productId)
      .maybeSingle();
    if (error || !data) return { eventos: { ...EVENTOS_META_PADRAO }, paginasCheckout: [] };
    return { eventos: lerEventosMeta(data.eventos_meta), paginasCheckout: limparPaginasCheckout(data.paginas_checkout) };
  } catch {
    return { eventos: { ...EVENTOS_META_PADRAO }, paginasCheckout: [] };
  }
}
