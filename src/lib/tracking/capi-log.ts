import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

export interface EnvioCapi {
  productId: string;
  eventName: string;
  pixelId: string | null;
  leadId: string | null;
  externalId: string | null;
  amountCents: number | null;
  currency: string | null;
  ok: boolean;
  eventsReceived?: number | null;
  fbtraceId?: string | null;
  erro?: string | null;
  teste?: boolean;
}

/**
 * Grava o que a Meta respondeu a um envio do servidor. Best-effort: nunca
 * pode derrubar o webhook que originou o evento, e antes da migration 0127
 * a tabela nem existe (o erro é engolido).
 */
export async function registrarEnvioCapi(admin: Admin, e: EnvioCapi): Promise<void> {
  try {
    await admin.from("tracking_capi_log").insert({
      product_id: e.productId,
      event_name: e.eventName,
      pixel_id: e.pixelId,
      lead_id: e.leadId,
      external_id: e.externalId,
      amount_cents: e.amountCents,
      currency: e.currency,
      ok: e.ok,
      events_received: e.eventsReceived ?? null,
      fbtrace_id: e.fbtraceId ?? null,
      erro: e.erro ? e.erro.slice(0, 500) : null,
      teste: e.teste ?? false,
    });
  } catch {
    // sem registro não é motivo pra falhar o envio
  }
}
