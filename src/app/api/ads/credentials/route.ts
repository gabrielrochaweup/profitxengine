import { NextResponse } from "next/server";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";
import { testMetaCredentials, type MetaCredentials } from "@/lib/ads/meta-client";
import { testGoogleCredentials, type GoogleCredentials } from "@/lib/ads/google-ads-client";

// Nunca devolve encrypted_credentials — só status, mesmo cuidado de
// ai_credentials.
const SELECT_FIELDS = "id, platform, label, ad_account_id, is_valid, status, last_checked_at, last_synced_at";

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("ad_platform_credentials")
    .select(SELECT_FIELDS)
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ accounts: data ?? [] });
}

interface CredentialsBody {
  product_id?: string;
  platform?: "meta" | "google";
  label?: string | null;
  meta?: MetaCredentials;
  google?: GoogleCredentials;
}

async function buildAndTest(body: CredentialsBody) {
  if (body.platform === "meta") {
    if (!body.meta?.access_token || !body.meta?.ad_account_id) {
      throw new Response(JSON.stringify({ error: "access_token e ad_account_id são obrigatórios." }), { status: 400 });
    }
    return {
      credentialsPayload: body.meta as MetaCredentials | GoogleCredentials,
      adAccountId: body.meta.ad_account_id,
      testResult: await testMetaCredentials(body.meta),
    };
  }
  const g = body.google;
  if (!g?.developer_token || !g?.client_id || !g?.client_secret || !g?.refresh_token || !g?.customer_id) {
    throw new Response(JSON.stringify({ error: "Preencha todos os campos do Google Ads." }), { status: 400 });
  }
  return {
    credentialsPayload: g as MetaCredentials | GoogleCredentials,
    adAccountId: g.customer_id,
    testResult: await testGoogleCredentials(g),
  };
}

// Sempre cria uma conta nova (uma plataforma pode ter várias contas). Se a
// mesma ad_account_id já existir pra essa plataforma+produto, o upsert
// atualiza a credencial dela em vez de duplicar.
export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!ehAprovado(profile)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body: CredentialsBody = await request.json().catch(() => ({}));
  const { product_id: productId, platform, label } = body;

  if (!productId || (platform !== "meta" && platform !== "google")) {
    return NextResponse.json({ error: "product_id e platform ('meta' ou 'google') são obrigatórios." }, { status: 400 });
  }

  let built;
  try {
    built = await buildAndTest(body);
  } catch (res) {
    if (res instanceof Response) return res;
    throw res;
  }
  const { credentialsPayload, adAccountId, testResult } = built;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ad_platform_credentials")
    .upsert(
      {
        product_id: productId,
        platform,
        label: label || null,
        encrypted_credentials: encryptSecret(JSON.stringify(credentialsPayload)),
        ad_account_id: adAccountId,
        is_valid: testResult.valid,
        last_checked_at: new Date().toISOString(),
        created_by: profile.userId,
      },
      { onConflict: "product_id,platform,ad_account_id" }
    )
    .select(SELECT_FIELDS)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Falha ao salvar credenciais." }, { status: 500 });
  }

  return NextResponse.json({ account: data, testLabel: testResult.label, testError: testResult.error });
}
