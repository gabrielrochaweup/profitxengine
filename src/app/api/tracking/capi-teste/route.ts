import { NextResponse } from "next/server";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";
import { sendMetaConversionEvent } from "@/lib/tracking/meta-capi";
import { registrarEnvioCapi } from "@/lib/tracking/capi-log";

// Manda UM evento de teste pra Meta com o test_event_code da aba "Testar
// eventos" do Gerenciador de Eventos. Pelo mesmo caminho do webhook (mesmo
// token, mesmo formato), então prova o envio real. Com o código, a Meta
// mostra o evento só naquela aba e NÃO conta nas campanhas.
export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const productId: string | undefined = body?.product_id;
  const codigo = typeof body?.test_event_code === "string" ? body.test_event_code.trim() : "";
  const evento: "Purchase" | "Deposit" = body?.evento === "Deposit" ? "Deposit" : "Purchase";

  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });
  if (!/^TEST[A-Za-z0-9]+$/.test(codigo)) {
    return NextResponse.json(
      { error: "Cole o código da aba Testar eventos (começa com TEST, ex: TEST12345)." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: pixels } = await admin
    .from("tracking_pixels")
    .select("pixel_id, encrypted_capi_token")
    .eq("product_id", productId)
    .eq("platform", "meta")
    .eq("active", true)
    .not("encrypted_capi_token", "is", null);

  const pixel = pixels?.[0];
  if (!pixel?.encrypted_capi_token) {
    return NextResponse.json(
      { error: "Nenhum pixel da Meta ativo com token da API de Conversões. Cadastre o token em Anúncios." },
      { status: 400 }
    );
  }

  const externalId = `teste-${Date.now()}`;
  const valorCents = evento === "Purchase" ? 7700 : 10000;
  const moeda = evento === "Purchase" ? "BRL" : "USD";
  const resultado = await sendMetaConversionEvent({
    pixelId: pixel.pixel_id,
    accessToken: decryptSecret(pixel.encrypted_capi_token),
    eventName: evento,
    email: "teste@example.com",
    amountCents: valorCents,
    currency: moeda,
    externalId,
    occurredAt: new Date().toISOString(),
    testEventCode: codigo,
  });

  await registrarEnvioCapi(admin, {
    productId,
    eventName: evento,
    pixelId: pixel.pixel_id,
    leadId: null,
    externalId,
    amountCents: valorCents,
    currency: moeda,
    ok: resultado.ok,
    eventsReceived: resultado.eventsReceived,
    fbtraceId: resultado.fbtraceId,
    erro: resultado.error,
    teste: true,
  });

  if (!resultado.ok) {
    return NextResponse.json({ ok: false, error: resultado.error ?? "A Meta recusou o evento.", fbtraceId: resultado.fbtraceId }, { status: 200 });
  }
  return NextResponse.json({ ok: true, eventsReceived: resultado.eventsReceived, fbtraceId: resultado.fbtraceId });
}
