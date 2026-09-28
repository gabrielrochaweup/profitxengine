import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveWebhookEndpoint } from "@/lib/tracking/webhook-auth";
import { logWebhookCall } from "@/lib/tracking/webhook-log";
import { webhookCorsHeaders } from "@/lib/tracking/cors";
import { lerResultadoVortex, processarResultado } from "@/lib/resultados/vortex";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: webhookCorsHeaders() });
}

/**
 * A Vortex chama esta rota uns 6 segundos depois do último "Salvar" do
 * placar do dia lá (Authorization: Bearer <token>). O mesmo dia pode chegar
 * de novo quando alguém corrige — processarResultado() trata isso como
 * atualização (upsert por data), nunca como um segundo resultado.
 */
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const headers = webhookCorsHeaders();

  const resolved = await resolveWebhookEndpoint(params.slug, "daily_results", request);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers });
  }
  const { endpoint } = resolved;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400, headers });
  }

  const admin = createAdminClient();

  // Botão "Testar" (aba Fontes de dados): confirma URL + token + leitura do
  // formato sem gravar resultado nenhum.
  if (request.headers.get("x-profitx-test") === "1") {
    const lido = lerResultadoVortex(raw);
    if ("erro" in lido) return NextResponse.json({ ok: true, ignored: true, error: lido.erro }, { headers });
    return NextResponse.json({ ok: true, tested: true, parsed: lido }, { headers });
  }

  const resultado = await processarResultado(admin, endpoint.product_id, raw, "webhook");

  if ("erro" in resultado) {
    await logWebhookCall(admin, endpoint.id, raw, false, resultado.erro);
    // 200 e não 4xx: a chamada chegou e foi registrada; reenviar o mesmo
    // payload não ia mudar a leitura.
    return NextResponse.json({ ok: true, ignored: true, error: resultado.erro }, { headers });
  }

  // accepted = a chamada foi válida e processada. Dia antigo corrigido ou
  // ainda não lançado NÃO é recusa — o painel do dia trata accepted=false
  // como "webhook recusado", e isso seria alarme falso. O porquê de não ter
  // aplicado vai no texto, só informativo.
  await logWebhookCall(admin, endpoint.id, raw, true, resultado.motivo);
  return NextResponse.json(
    { ok: true, data: resultado.data, aplicado: resultado.aplicado, motivo: resultado.motivo },
    { headers }
  );
}
