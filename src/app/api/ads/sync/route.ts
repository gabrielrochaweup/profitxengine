import { NextResponse } from "next/server";
import { getSessionProfile, ehAprovado } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";
import {
  fetchMetaCampaignSpend,
  fetchMetaEntityNames,
  fetchMetaEntitySpend,
  type MetaCredentials,
} from "@/lib/ads/meta-client";
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
  if (!ehAprovado(profile)) {
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

  // Nomes de campanha/conjunto/anúncio (só Meta). Best-effort: o gasto acima
  // já foi salvo e não pode ser desfeito por falha aqui — e antes da
  // migration 0126 a tabela nem existe.
  let nomes = 0;
  let avisoNomes: string | null = null;
  if (cred.platform === "meta") {
    try {
      const entidades = await fetchMetaEntityNames(parsed as MetaCredentials);
      if (entidades.length > 0) {
        const { error } = await admin.from("ad_entity_names").upsert(
          entidades.map((e) => ({
            product_id: cred.product_id,
            platform: "meta" as const,
            entity_id: e.id,
            level: e.level,
            name: e.name,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: "product_id,platform,entity_id" }
        );
        if (error) throw new Error(/ad_entity_names/.test(error.message) ? "Falta rodar a migration 0126." : error.message);
        nomes = entidades.length;
      }
    } catch (err) {
      avisoNomes = err instanceof Error ? err.message : "Falha ao buscar os nomes dos anúncios.";
    }
  }

  // Gasto por conjunto e por anúncio (só Meta). Mesmo cuidado: best-effort, o
  // gasto por campanha já está salvo, e antes da migration 0128 a tabela não existe.
  let avisoGastoDetalhado: string | null = null;
  if (cred.platform === "meta") {
    try {
      for (const level of ["adset", "ad"] as const) {
        const gastos = await fetchMetaEntitySpend(parsed as MetaCredentials, level, isoDate(since), isoDate(until));
        if (gastos.length === 0) continue;
        const { error } = await admin.from("ad_entity_spend").upsert(
          gastos.map((g) => ({
            product_id: cred.product_id,
            platform: "meta" as const,
            level,
            entity_id: g.entityId,
            entity_name: g.entityName,
            campaign_id: g.campaignId,
            adset_id: g.adsetId,
            spend_cents: g.spendCents,
            spend_date: g.date,
            synced_at: new Date().toISOString(),
          })),
          { onConflict: "product_id,platform,level,entity_id,spend_date" }
        );
        if (error) throw new Error(/ad_entity_spend/.test(error.message) ? "Falta rodar a migration 0128." : error.message);
      }
    } catch (err) {
      avisoGastoDetalhado = err instanceof Error ? err.message : "Falha ao buscar o gasto por conjunto/anúncio.";
    }
  }

  const totalSpendCents = rows.reduce((sum, r) => sum + r.spendCents, 0);
  return NextResponse.json({ ok: true, days: rows.length, totalSpendCents, nomes, avisoNomes, avisoGastoDetalhado });
}
