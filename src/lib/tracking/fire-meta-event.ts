import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { sendMetaConversionEvent } from "./meta-capi";
import { decryptSecret } from "@/lib/crypto";

// Dispara um evento pra todo pixel Meta ativo do produto que já tenha token
// da API de Conversões cadastrado (sem token, o pixel funciona normal pro
// navegador — PageView/Lead/InitiateCheckout — só não tem como mandar esse
// evento do lado do servidor). Best-effort: nunca deve derrubar o webhook
// que originou o evento se a Meta rejeitar ou estiver fora do ar.
export async function fireMetaEventForProduct(
  admin: ReturnType<typeof createAdminClient>,
  productId: string,
  params: {
    eventName: string;
    email: string | null;
    amountCents: number | null;
    currency: string;
    externalId: string | null;
    occurredAt: string;
  }
) {
  const { data: metaPixels } = await admin
    .from("tracking_pixels")
    .select("pixel_id, encrypted_capi_token")
    .eq("product_id", productId)
    .eq("platform", "meta")
    .eq("active", true)
    .not("encrypted_capi_token", "is", null);

  for (const pixel of metaPixels ?? []) {
    if (!pixel.encrypted_capi_token) continue;
    try {
      await sendMetaConversionEvent({
        pixelId: pixel.pixel_id,
        accessToken: decryptSecret(pixel.encrypted_capi_token),
        ...params,
      });
    } catch {
      // best-effort — não interrompe o webhook que originou o evento
    }
  }
}
