import { NextResponse } from "next/server";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Últimos envios do servidor pra Meta (Purchase/Deposit) e o que ela respondeu.
export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tracking_capi_log")
    .select("id, event_name, pixel_id, amount_cents, currency, ok, events_received, fbtrace_id, erro, teste, enviado_em")
    .eq("product_id", productId)
    .order("enviado_em", { ascending: false })
    .limit(30);

  if (error) {
    const semTabela = /tracking_capi_log/.test(error.message);
    return NextResponse.json({ envios: [], semMigration: semTabela });
  }
  return NextResponse.json({ envios: data ?? [], semMigration: false });
}
