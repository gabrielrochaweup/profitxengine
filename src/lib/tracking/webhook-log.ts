import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

// Nunca deixa o log derrubar o webhook de verdade — se a gravação falhar,
// só ignora (a chamada real já foi processada normalmente).
export async function logWebhookCall(
  admin: ReturnType<typeof createAdminClient>,
  endpointId: string,
  rawPayload: unknown,
  accepted: boolean,
  error?: string | null
) {
  try {
    await admin.from("tracking_webhook_log").insert({
      endpoint_id: endpointId,
      raw_payload: rawPayload as Record<string, unknown>,
      accepted,
      error: error ?? null,
    });
  } catch {
    // best-effort
  }
}
