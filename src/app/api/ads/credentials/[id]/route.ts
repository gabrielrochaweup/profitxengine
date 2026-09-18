import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";
import { testMetaCredentials, type MetaCredentials } from "@/lib/ads/meta-client";
import { testGoogleCredentials, type GoogleCredentials } from "@/lib/ads/google-ads-client";
import { ehStatusBm } from "@/lib/tracking/bms";

const SELECT_FIELDS = "id, platform, label, ad_account_id, is_valid, status, last_checked_at, last_synced_at";

interface PatchBody {
  label?: string | null;
  status?: string;
  meta?: MetaCredentials;
  google?: GoogleCredentials;
}

// label/status: edição simples, sem tocar na credencial. meta/google:
// reautentica e substitui a credencial salva (mesmo fluxo de "Salvar e
// testar" da criação, aplicado numa conta já existente em vez de criar uma
// nova).
//
// O status é marcação manual de quem administra as contas, não vem do Meta:
// "is_valid" só diz se o token responde, e conta restrita costuma responder
// normalmente enquanto se recusa a entregar anúncio.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body: PatchBody = await request.json().catch(() => ({}));
  const admin = createAdminClient();

  if (!body.meta && !body.google) {
    const update: { label?: string | null; status?: "ativa" | "pronta" | "restrita" | "bloqueada" } = {};
    if (typeof body.label === "string" || body.label === null) update.label = body.label || null;
    if (ehStatusBm(body.status)) update.status = body.status;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nada pra atualizar." }, { status: 400 });
    }
    const { data, error } = await admin
      .from("ad_platform_credentials")
      .update(update)
      .eq("id", params.id)
      .select(SELECT_FIELDS)
      .single();
    if (error || !data) return NextResponse.json({ error: "Falha ao atualizar." }, { status: 500 });
    return NextResponse.json({ account: data });
  }

  let credentialsPayload: MetaCredentials | GoogleCredentials;
  let adAccountId: string;
  let testResult: { valid: boolean; label?: string; error?: string };

  if (body.meta) {
    if (!body.meta.access_token || !body.meta.ad_account_id) {
      return NextResponse.json({ error: "access_token e ad_account_id são obrigatórios." }, { status: 400 });
    }
    credentialsPayload = body.meta;
    adAccountId = body.meta.ad_account_id;
    testResult = await testMetaCredentials(body.meta);
  } else {
    const g = body.google!;
    if (!g.developer_token || !g.client_id || !g.client_secret || !g.refresh_token || !g.customer_id) {
      return NextResponse.json({ error: "Preencha todos os campos do Google Ads." }, { status: 400 });
    }
    credentialsPayload = g;
    adAccountId = g.customer_id;
    testResult = await testGoogleCredentials(g);
  }

  const { data, error } = await admin
    .from("ad_platform_credentials")
    .update({
      ad_account_id: adAccountId,
      encrypted_credentials: encryptSecret(JSON.stringify(credentialsPayload)),
      is_valid: testResult.valid,
      last_checked_at: new Date().toISOString(),
      ...(typeof body.label === "string" ? { label: body.label || null } : {}),
    })
    .eq("id", params.id)
    .select(SELECT_FIELDS)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Falha ao atualizar credenciais." }, { status: 500 });
  }

  return NextResponse.json({ account: data, testLabel: testResult.label, testError: testResult.error });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("ad_platform_credentials").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "Falha ao excluir." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
