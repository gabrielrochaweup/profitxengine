import { NextResponse } from "next/server";
import { clienteDeServico } from "@/tracking-kit/lib/supabase";
import { trackingConfig } from "@/tracking-kit/tracking.config";

/*
  A etapa que o próprio site dispara — tipicamente "iniciou checkout", no
  clique do botão que leva pro pagamento.

  SÓ aceita o que está em `eventosDoPixel` no config. A lista é a fronteira
  entre "o site avisa de uma etapa" e "endpoint aberto que grava qualquer
  coisa": sem ela, bastaria um curl pra encher o funil de compras que nunca
  aconteceram.

  DETALHE DE CORS QUE CUSTA UMA TARDE: o script usa navigator.sendBeacon(),
  que manda cookies em chamada entre origens. A spec de Fetch proíbe
  "Access-Control-Allow-Origin: *" quando há credenciais — o navegador
  bloqueia a resposta inteira, sem erro legível. Por isso aqui o header ecoa
  a origem exata e soma Allow-Credentials, em vez do "*" do /collect. Não
  reduz segurança: esta rota não lê cookie nem sessão.
*/

function cors(request: Request): HeadersInit {
  return {
    "Access-Control-Allow-Origin": request.headers.get("origin") ?? "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: cors(request) });
}

export async function POST(request: Request) {
  const headers = cors(request);

  let corpo: { lead_id?: string; workspace_id?: string; event_type?: string };
  try {
    // sendBeacon manda o corpo como Blob "application/json": é o mesmo POST
    // de sempre, só chega sem alguns headers que um fetch normal teria.
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400, headers });
  }

  const leadId = corpo.lead_id?.trim();
  const etapa = corpo.event_type?.trim();

  if (!leadId || !etapa || !trackingConfig.eventosDoPixel.includes(etapa)) {
    return NextResponse.json(
      { error: `lead_id e um event_type entre [${trackingConfig.eventosDoPixel.join(", ")}] são obrigatórios.` },
      { status: 400, headers }
    );
  }

  const workspaceId = corpo.workspace_id?.trim() || trackingConfig.workspaceIdPadrao;

  // Um por lead: quem clica três vezes no botão do checkout iniciou um
  // checkout, não três.
  const { error } = await clienteDeServico()
    .from("tracking_events")
    .upsert(
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

  if (error) {
    console.error("[tracking/client-event] falha ao gravar evento:", error.message);
    return NextResponse.json({ error: "Falha ao gravar evento." }, { status: 500, headers });
  }

  return NextResponse.json({ ok: true }, { headers });
}
