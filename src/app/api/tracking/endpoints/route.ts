import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";

function generateSlug() {
  return randomBytes(16).toString("hex");
}

function generateToken() {
  return randomBytes(24).toString("base64url");
}

const VALID_KINDS = ["checkout", "members_area", "broker"] as const;

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("tracking_webhook_endpoints")
    .select("id, product_id, kind, platform, label, endpoint_slug, active, last_test_at, last_test_ok, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ endpoints: data ?? [] });
}

// Devolve o token em texto puro só nessa resposta — depois disso, só o
// segredo cifrado fica salvo, mesmo padrão de ai_credentials.
export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const productId: string | undefined = body?.product_id;
  const kind = body?.kind;
  const platform: string | null = body?.platform ?? null;
  const label: string | null = typeof body?.label === "string" && body.label.trim() ? body.label.trim() : null;

  if (!productId || !VALID_KINDS.includes(kind)) {
    return NextResponse.json({ error: "product_id e kind válidos são obrigatórios." }, { status: 400 });
  }
  if (!platform) {
    return NextResponse.json({ error: "platform é obrigatório." }, { status: 400 });
  }

  const token = generateToken();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tracking_webhook_endpoints")
    .insert({
      product_id: productId,
      kind,
      platform,
      label,
      endpoint_slug: generateSlug(),
      encrypted_secret: encryptSecret(token),
      created_by: profile.userId,
    })
    .select("id, product_id, kind, platform, label, endpoint_slug, active, last_test_at, last_test_ok, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Falha ao criar endpoint." }, { status: 500 });
  }

  return NextResponse.json({ endpoint: data, secret: token });
}
