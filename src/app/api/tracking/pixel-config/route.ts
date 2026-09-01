import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Pública (sem sessão) — o pixel.js chama isso no navegador do visitante pra
// saber quais Pixel IDs disparar. Nunca devolve o token da API de
// Conversões (esse fica só no servidor, usado no webhook de compra).
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("product");
  if (!slug) return NextResponse.json({ meta: [], google: [] });

  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("id").eq("slug", slug).maybeSingle();
  if (!product) return NextResponse.json({ meta: [], google: [] });

  const { data: pixels } = await admin
    .from("tracking_pixels")
    .select("platform, pixel_id")
    .eq("product_id", product.id)
    .eq("active", true);

  return NextResponse.json({
    meta: (pixels ?? []).filter((p) => p.platform === "meta").map((p) => p.pixel_id),
    google: (pixels ?? []).filter((p) => p.platform === "google").map((p) => p.pixel_id),
  });
}
