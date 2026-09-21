import { NextResponse } from "next/server";
import { clienteDeServico } from "@/tracking-kit/lib/supabase";
import { ehEtapaConhecida, trackingConfig } from "@/tracking-kit/tracking.config";

/*
  A porta pública do script do site.

  Duas coisas entram por aqui, e as duas sem token:

  - POST /api/tracking/collect      → nasce o lead (primeira visita)
  - POST /api/tracking/client-event → uma etapa que o próprio site dispara

  Sem token é de propósito: o script roda em QUALQUER site que gere tráfego
  pro produto — landing em outro domínio, página de um parceiro — e um
  segredo no código do navegador não é segredo. Mesmo modelo do pixel da
  Meta e do Google Analytics.

  O que limita o estrago: a rota só grava lead e só aceita as etapas que o
  config listou em `eventosDoPixel`. Alguém pode inflar seu número de leads
  com um script; ninguém consegue inventar uma compra por aqui — compra vem
  por webhook assinado.

  Instale copiando pra src/app/api/tracking/collect/route.ts (e o handler de
  client-event pra .../client-event/route.ts — os dois estão neste arquivo
  pra você ver o par junto; separe ao copiar).
*/

function cors(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors() });
}

interface CorpoDoCollect {
  lead_id?: string;
  workspace_id?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  meta_campaign_id?: string | null;
  google_campaign_id?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  landing_url?: string | null;
  referrer?: string | null;
  /** Uma etapa do config, quando o site quer marcar algo junto da visita. */
  event_type?: string | null;
}

export async function POST(request: Request) {
  const headers = cors();

  let corpo: CorpoDoCollect;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400, headers });
  }

  const leadId = corpo.lead_id?.trim();
  if (!leadId) {
    return NextResponse.json({ error: "lead_id é obrigatório." }, { status: 400, headers });
  }

  // Projeto de produto único manda o workspace no config e nem precisa do
  // campo; multi-produto manda o id do produto ativo no corpo.
  const workspaceId = corpo.workspace_id?.trim() || trackingConfig.workspaceIdPadrao;

  const db = clienteDeServico();

  /*
    ignoreDuplicates: o PRIMEIRO clique é quem vale.

    Se este lead_id já existe, a origem original fica — sem isso, a pessoa
    que chega por um anúncio e volta uma semana depois pelo Google teria a
    campanha reescrita, e o anúncio perderia a venda que ele gerou.
  */
  const { error: erroDoLead } = await db.from("tracking_leads").upsert(
    {
      id: leadId,
      workspace_id: workspaceId,
      utm_source: corpo.utm_source || null,
      utm_medium: corpo.utm_medium || null,
      utm_campaign: corpo.utm_campaign || null,
      utm_content: corpo.utm_content || null,
      utm_term: corpo.utm_term || null,
      fbclid: corpo.fbclid || null,
      gclid: corpo.gclid || null,
      meta_campaign_id: corpo.meta_campaign_id || null,
      google_campaign_id: corpo.google_campaign_id || null,
      fbp: corpo.fbp || null,
      fbc: corpo.fbc || null,
      landing_url: corpo.landing_url || null,
      referrer: corpo.referrer || null,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (erroDoLead) {
    console.error("[tracking/collect] falha ao gravar lead:", erroDoLead.message);
    return NextResponse.json({ error: "Falha ao gravar lead." }, { status: 500, headers });
  }

  // A etapa de entrada do funil. external_id fixo por lead reaproveita o
  // índice único: se o beacon reenviar, não vira um segundo lead.
  const etapaDeEntrada = trackingConfig.etapas.find((e) => e.papel === "entrada")?.chave;
  const etapa = corpo.event_type && ehEtapaConhecida(corpo.event_type) ? corpo.event_type : etapaDeEntrada;

  if (etapa) {
    const { error: erroDoEvento } = await db.from("tracking_events").upsert(
      {
        workspace_id: workspaceId,
        lead_id: leadId,
        event_type: etapa,
        source: "landing",
        external_id: `${etapa}:${leadId}`,
        raw_payload: corpo as unknown as Record<string, unknown>,
      },
      { onConflict: "source,external_id", ignoreDuplicates: true }
    );

    if (erroDoEvento) {
      console.error("[tracking/collect] falha ao gravar evento:", erroDoEvento.message);
      return NextResponse.json({ error: "Falha ao gravar evento." }, { status: 500, headers });
    }
  }

  return NextResponse.json({ ok: true }, { headers });
}
