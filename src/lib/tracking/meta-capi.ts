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

// Telefone pra Meta: só dígitos, com DDI. Número brasileiro sem DDI (10 ou
// 11 dígitos) ganha o 55 na frente.
function telefoneParaMeta(phone: string): string | null {
  const digitos = phone.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  return digitos.length <= 11 ? `55${digitos}` : digitos;
}

/** O que sabemos do navegador de quem converteu — vem do lead (primeira visita). */
export interface DadosDoLead {
  leadId: string;
  fbp: string | null;
  fbc: string | null;
  fbclid: string | null;
  landingUrl: string | null;
  userAgent: string | null;
  ip: string | null;
  firstSeenAt: string | null;
}

export interface MetaConversionEvent {
  pixelId: string;
  accessToken: string;
  /** "Purchase" (padrão da Meta) ou um nome customizado como "Deposit" — a Meta aceita qualquer string aqui. */
  eventName: string;
  email: string | null;
  phone?: string | null;
  amountCents: number | null;
  currency: string;
  externalId: string | null;
  occurredAt: string;
  lead?: DadosDoLead | null;
  /**
   * Código da aba "Testar eventos" do Gerenciador de Eventos (ex: TEST12345).
   * Com ele a Meta mostra o evento só lá e NÃO conta nas campanhas.
   */
  testEventCode?: string;
}

export interface ResultadoMetaCapi {
  ok: boolean;
  error?: string;
  /** Quantos eventos a Meta diz ter recebido nesta chamada. */
  eventsReceived?: number;
  /** Identificador da chamada na Meta — é o que o suporte pede pra investigar. */
  fbtraceId?: string;
}

// Best-effort — chamado depois de já ter gravado o tracking_event, nunca
// deve derrubar o webhook que originou o evento se a Meta rejeitar ou
// estiver fora do ar.
export async function sendMetaConversionEvent(event: MetaConversionEvent): Promise<ResultadoMetaCapi> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${event.pixelId}/events?access_token=${encodeURIComponent(event.accessToken)}`;

  const lead = event.lead ?? null;
  const telefone = event.phone ? telefoneParaMeta(event.phone) : null;
  // _fbc não existia no navegador mas o anúncio mandou fbclid: monta no
  // formato que a Meta documenta (fb.1.<quando>.<fbclid>).
  const fbc =
    lead?.fbc ||
    (lead?.fbclid ? `fb.1.${lead.firstSeenAt ? new Date(lead.firstSeenAt).getTime() : Date.now()}.${lead.fbclid}` : null);

  const userData: Record<string, unknown> = {};
  if (event.email) userData.em = [sha256(event.email)];
  if (telefone) userData.ph = [sha256(telefone)];
  if (lead) userData.external_id = [sha256(lead.leadId)];
  if (lead?.fbp) userData.fbp = lead.fbp;
  if (fbc) userData.fbc = fbc;
  if (lead?.userAgent) userData.client_user_agent = lead.userAgent;
  if (lead?.ip) userData.client_ip_address = lead.ip;

  // "website" é o tipo que a Meta liga ao anúncio — mas ela exige o
  // navegador (client_user_agent) e o endereço da página. Sem os dois
  // (lead não identificado, ou lead de antes da 0124), vai como
  // "system_generated", que era o comportamento de sempre.
  const ehWebsite = !!(lead?.userAgent && lead?.landingUrl);

  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: Math.floor(new Date(event.occurredAt).getTime() / 1000),
        event_id: event.externalId ? `${event.eventName}:${event.externalId}` : undefined,
        action_source: ehWebsite ? "website" : "system_generated",
        ...(ehWebsite ? { event_source_url: lead!.landingUrl } : {}),
        user_data: userData,
        custom_data: {
          value: event.amountCents !== null ? event.amountCents / 100 : undefined,
          currency: event.currency,
        },
      },
    ],
    ...(event.testEventCode ? { test_event_code: event.testEventCode } : {}),
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      return { ok: false, error: json.error?.message || `HTTP ${res.status}`, fbtraceId: json.error?.fbtrace_id };
    }
    return { ok: true, eventsReceived: json.events_received, fbtraceId: json.fbtrace_id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Falha de rede." };
  }
}
