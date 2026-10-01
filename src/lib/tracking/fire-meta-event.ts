import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { sendMetaConversionEvent, type DadosDoLead } from "./meta-capi";
import { decryptSecret } from "@/lib/crypto";
import { lerConfigDoScript } from "./script-config";
import { registrarEnvioCapi } from "./capi-log";

type Admin = ReturnType<typeof createAdminClient>;

/** Qual interruptor de Tracking > Rastreamento libera este evento do servidor. */
export type EventoDoServidor = "purchase" | "deposit";

const NOME_NA_META: Record<EventoDoServidor, string> = {
  purchase: "Purchase",
  // Customizado: o algoritmo otimiza pra quem deposita, não só pra quem compra.
  deposit: "Deposit",
};

async function dadosDoLead(admin: Admin, leadId: string | null): Promise<DadosDoLead | null> {
  if (!leadId) return null;
  // select("*") de propósito: antes da migration 0124 as colunas de
  // navegador/IP não existem, e pedir por nome derrubaria a consulta toda.
  const { data } = await admin.from("tracking_leads").select("*").eq("id", leadId).maybeSingle();
  if (!data) return null;
  return {
    leadId: data.id,
    fbp: data.fbp,
    fbc: data.fbc,
    fbclid: data.fbclid,
    landingUrl: data.landing_url,
    userAgent: data.client_user_agent ?? null,
    ip: data.client_ip ?? null,
    firstSeenAt: data.first_seen_at,
  };
}

// Dispara um evento pra todo pixel Meta ativo do produto que já tenha token
// da API de Conversões cadastrado — SE o evento estiver ligado em Tracking
// > Ferramentas > Rastreamento. Best-effort: nunca deve derrubar o webhook
// que originou o evento se a Meta rejeitar ou estiver fora do ar.
export async function fireMetaEventForProduct(
  admin: Admin,
  productId: string,
  evento: EventoDoServidor,
  params: {
    email: string | null;
    phone?: string | null;
    amountCents: number | null;
    currency: string;
    externalId: string | null;
    occurredAt: string;
    leadId?: string | null;
  }
) {
  try {
    const config = await lerConfigDoScript(admin, productId);
    if (!config.eventos[evento]) return;

    const { data: metaPixels } = await admin
      .from("tracking_pixels")
      .select("pixel_id, encrypted_capi_token")
      .eq("product_id", productId)
      .eq("platform", "meta")
      .eq("active", true)
      .not("encrypted_capi_token", "is", null);

    const base = {
      productId,
      eventName: NOME_NA_META[evento],
      leadId: params.leadId ?? null,
      externalId: params.externalId,
      amountCents: params.amountCents,
      currency: params.currency,
    };

    // Evento ligado, mas sem pixel com token: antes sumia sem aviso.
    if (!metaPixels?.length) {
      await registrarEnvioCapi(admin, {
        ...base,
        pixelId: null,
        ok: false,
        erro: "Nenhum pixel da Meta ativo com token da API de Conversões — o evento não foi enviado.",
      });
      return;
    }

    const lead = await dadosDoLead(admin, params.leadId ?? null);

    for (const pixel of metaPixels) {
      if (!pixel.encrypted_capi_token) continue;
      const resultado = await sendMetaConversionEvent({
        pixelId: pixel.pixel_id,
        accessToken: decryptSecret(pixel.encrypted_capi_token),
        eventName: NOME_NA_META[evento],
        email: params.email,
        phone: params.phone ?? null,
        amountCents: params.amountCents,
        currency: params.currency,
        externalId: params.externalId,
        occurredAt: params.occurredAt,
        lead,
      });
      await registrarEnvioCapi(admin, {
        ...base,
        pixelId: pixel.pixel_id,
        ok: resultado.ok,
        eventsReceived: resultado.eventsReceived,
        fbtraceId: resultado.fbtraceId,
        erro: resultado.error,
      });
    }
  } catch {
    // best-effort — não interrompe o webhook que originou o evento
  }
}
