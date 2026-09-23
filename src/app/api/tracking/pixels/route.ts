import { NextResponse } from "next/server";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";

const SELECT_FIELDS = "id, platform, pixel_id, label, active, created_at";

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("tracking_pixels")
    .select(`${SELECT_FIELDS}, encrypted_capi_token`)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  // has_capi_token calculado aqui em vez de devolver o campo cifrado — o
  // front só precisa saber "tem token salvo ou não".
  const pixels = (data ?? []).map(({ encrypted_capi_token, ...rest }) => ({
    ...rest,
    has_capi_token: !!encrypted_capi_token,
  }));

  return NextResponse.json({ pixels });
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const productId: string | undefined = body?.product_id;
  const platform = body?.platform;
  const pixelId: string | undefined = body?.pixel_id;
  const label: string | null = typeof body?.label === "string" && body.label.trim() ? body.label.trim() : null;
  const capiToken: string | null = typeof body?.capi_token === "string" && body.capi_token.trim() ? body.capi_token.trim() : null;

  if (!productId || (platform !== "meta" && platform !== "google") || !pixelId?.trim()) {
    return NextResponse.json({ error: "product_id, platform ('meta'/'google') e pixel_id são obrigatórios." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tracking_pixels")
    .insert({
      product_id: productId,
      platform,
      pixel_id: pixelId.trim(),
      label,
      encrypted_capi_token: capiToken ? encryptSecret(capiToken) : null,
      created_by: profile.userId,
    })
    .select(SELECT_FIELDS)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Falha ao criar pixel." }, { status: 500 });
  }

  return NextResponse.json({ pixel: { ...data, has_capi_token: !!capiToken } });
}
