import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";
import { testMetaCredentials, type MetaCredentials } from "@/lib/ads/meta-client";
import { testGoogleCredentials, type GoogleCredentials } from "@/lib/ads/google-ads-client";

// Nunca devolve encrypted_credentials — só status, mesmo cuidado de
// ai_credentials.
export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("ad_platform_credentials")
    .select("platform, ad_account_id, is_valid, last_checked_at, last_synced_at")
    .eq("product_id", productId);

  return NextResponse.json({ credentials: data ?? [] });
}

interface CredentialsBody {
  product_id?: string;
  platform?: "meta" | "google";
  meta?: MetaCredentials;
  google?: GoogleCredentials;
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body: CredentialsBody = await request.json().catch(() => ({}));
  const { product_id: productId, platform } = body;

  if (!productId || (platform !== "meta" && platform !== "google")) {
    return NextResponse.json({ error: "product_id e platform ('meta' ou 'google') são obrigatórios." }, { status: 400 });
  }

  let credentialsPayload: MetaCredentials | GoogleCredentials;
  let adAccountId: string;
  let testResult: { valid: boolean; label?: string; error?: string };

  if (platform === "meta") {
    if (!body.meta?.access_token || !body.meta?.ad_account_id) {
      return NextResponse.json({ error: "access_token e ad_account_id são obrigatórios." }, { status: 400 });
    }
    credentialsPayload = body.meta;
    adAccountId = body.meta.ad_account_id;
    testResult = await testMetaCredentials(body.meta);
  } else {
    const g = body.google;
    if (!g?.developer_token || !g?.client_id || !g?.client_secret || !g?.refresh_token || !g?.customer_id) {
      return NextResponse.json({ error: "Preencha todos os campos do Google Ads." }, { status: 400 });
    }
    credentialsPayload = g;
    adAccountId = g.customer_id;
    testResult = await testGoogleCredentials(g);
  }

  const admin = createAdminClient();
  const { error } = await admin.from("ad_platform_credentials").upsert(
    {
      product_id: productId,
      platform,
      encrypted_credentials: encryptSecret(JSON.stringify(credentialsPayload)),
      ad_account_id: adAccountId,
      is_valid: testResult.valid,
      last_checked_at: new Date().toISOString(),
      created_by: profile.userId,
    },
    { onConflict: "product_id,platform" }
  );

  if (error) {
    return NextResponse.json({ error: "Falha ao salvar credenciais." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, valid: testResult.valid, label: testResult.label, error: testResult.error });
}
