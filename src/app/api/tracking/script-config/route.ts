import { NextResponse } from "next/server";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { lerConfigDoScript } from "@/lib/tracking/script-config";
import { eventosMetaParaBanco, lerEventosMeta, limparPaginasCheckout } from "@/lib/tracking/eventos-meta";

// Config de quais eventos vão pra Meta (Tracking > Ferramentas >
// Rastreamento). Mesma regra das outras rotas do Tracking: equipe aprovada
// lê e grava; a service key fica aqui no servidor.

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const [config, { data: pixels }] = await Promise.all([
    lerConfigDoScript(admin, productId),
    admin
      .from("tracking_pixels")
      .select("pixel_id, encrypted_capi_token")
      .eq("product_id", productId)
      .eq("platform", "meta")
      .eq("active", true),
  ]);

  return NextResponse.json({
    eventos: config.eventos,
    paginasCheckout: config.paginasCheckout,
    // A tela avisa quando um evento de servidor está ligado mas não tem
    // como sair (nenhum pixel com token da API de Conversões).
    pixelsMeta: (pixels ?? []).map((p) => ({ pixelId: p.pixel_id, temToken: !!p.encrypted_capi_token })),
  });
}

export async function PUT(request: Request) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const productId: string | undefined = body?.product_id;
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  // A tela manda camelCase; lerEventosMeta espera o formato do banco.
  const e = body?.eventos ?? {};
  const eventos = lerEventosMeta({
    pageview: e.pageview,
    lead: e.lead,
    initiate_checkout: e.initiateCheckout,
    purchase: e.purchase,
    deposit: e.deposit,
  });
  const paginasCheckout = limparPaginasCheckout(body?.paginasCheckout);

  if (eventos.initiateCheckout === "pagina" && paginasCheckout.length === 0) {
    return NextResponse.json(
      { error: "Pra disparar o InitiateCheckout ao abrir o checkout, informe o endereço da página de checkout." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from("tracking_script_config").upsert(
    {
      product_id: productId,
      eventos_meta: eventosMetaParaBanco(eventos),
      paginas_checkout: paginasCheckout,
      updated_by: profile.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" }
  );

  if (error) {
    const semTabela = /tracking_script_config/.test(error.message);
    return NextResponse.json(
      { error: semTabela ? "Falta rodar a migration 0124 no banco." : "Falha ao salvar." },
      { status: 500 }
    );
  }

  return NextResponse.json({ eventos, paginasCheckout });
}
