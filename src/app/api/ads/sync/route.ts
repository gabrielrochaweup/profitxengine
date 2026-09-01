import { NextResponse } from "next/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";
import { fetchMetaCampaignSpend, type MetaCredentials } from "@/lib/ads/meta-client";
import { fetchGoogleCampaignSpend, type GoogleCredentials } from "@/lib/ads/google-ads-client";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Sob demanda (botão "Sincronizar agora") — sem infraestrutura de job
// agendado hoje, então busca os últimos 30 dias toda vez que chamado, sem
// acumular histórico incremental. Rodar de novo é seguro: o upsert em
// ad_campaign_spend substitui o gasto do mesmo dia/campanha, não duplica.
export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !hasRole(profile.role, "admin")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const credentialId: string | undefined = body?.credential_id;
  if (!credentialId) return NextResponse.json({ error: "credential_id é obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const { data: cred } = await admin
    .from("ad_platform_credentials")
    .select("id, product_id, platform, encrypted_credentials")
    .eq("id", credentialId)
    .maybeSingle();

  if (!cred) return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });

  let parsed: MetaCredentials | GoogleCredentials;
  try {
    parsed = JSON.parse(decryptSecret(cred.encrypted_credentials));
  } catch {
    return NextResponse.json({ error: "Falha ao ler as credenciais salvas." }, { status: 500 });
  }

  const until = new Date();
  const since = new Date(until);
  since.setDate(since.getDate() - 30);

  let rows: { campaignId: string; campaignName: string; spendCents: number; date: string }[];
  try {
    rows =
      cred.platform === "meta"
        ? await fetchMetaCampaignSpend(parsed as MetaCredentials, isoDate(since), isoDate(until))
        : await fetchGoogleCampaignSpend(parsed as GoogleCredentials, isoDate(since), isoDate(until));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Falha ao buscar gasto." }, { status: 500 });
  }

  if (rows.length > 0) {
    const { error } = await admin.from("ad_campaign_spend").upsert(
      rows.map((r) => ({
        product_id: cred.product_id,
        platform: cred.platform,
        campaign_id: r.campaignId,
        campaign_name: r.campaignName,
        spend_cents: r.spendCents,
        spend_date: r.date,
      })),
      { onConflict: "product_id,platform,campaign_id,spend_date" }
    );
    if (error) return NextResponse.json({ error: "Falha ao salvar o gasto sincronizado." }, { status: 500 });
  }

  await admin
    .from("ad_platform_credentials")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", credentialId);

  const totalSpendCents = rows.reduce((sum, r) => sum + r.spendCents, 0);
  return NextResponse.json({ ok: true, days: rows.length, totalSpendCents });
}
