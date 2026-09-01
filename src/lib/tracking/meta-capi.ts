import "server-only";
import { createHash } from "crypto";

// Formato segue a documentação pública atual da API de Conversões da Meta —
// confirmar contra o "Test Events" do Events Manager assim que houver um
// pixel + token reais, mesmo cuidado dos outros adapters/clients dessa
// pasta (ver checkout-adapters/hotmart.ts).
const GRAPH_API_VERSION = "v21.0";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export interface MetaConversionEvent {
  pixelId: string;
  accessToken: string;
  /** "Purchase" (padrão da Meta) ou um nome customizado como "Deposit" — a Meta aceita qualquer string aqui. */
  eventName: string;
  email: string | null;
  amountCents: number | null;
  currency: string;
  externalId: string | null;
  occurredAt: string;
}

// Best-effort — chamado depois de já ter gravado o tracking_event, nunca
// deve derrubar o webhook que originou o evento se a Meta rejeitar ou
// estiver fora do ar.
export async function sendMetaConversionEvent(event: MetaConversionEvent): Promise<{ ok: boolean; error?: string }> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${event.pixelId}/events?access_token=${encodeURIComponent(event.accessToken)}`;

  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: Math.floor(new Date(event.occurredAt).getTime() / 1000),
        event_id: event.externalId ?? undefined,
        action_source: "system_generated",
        user_data: event.email ? { em: [sha256(event.email)] } : {},
        custom_data: {
          value: event.amountCents !== null ? event.amountCents / 100 : undefined,
          currency: event.currency,
        },
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      return { ok: false, error: json.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Falha de rede." };
  }
}
