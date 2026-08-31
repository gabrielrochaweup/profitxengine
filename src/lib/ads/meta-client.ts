import "server-only";

// Formatos seguem a documentação pública atual da Graph API (Marketing API
// / Insights) — confirmar contra uma chamada real assim que houver token de
// teste, antes de confiar no dado em produção (mesmo cuidado do adapter
// Hotmart em src/lib/tracking/checkout-adapters/hotmart.ts).
const GRAPH_API_VERSION = "v21.0";

export interface MetaCredentials {
  access_token: string;
  ad_account_id: string;
}

export interface TestResult {
  valid: boolean;
  label?: string;
  error?: string;
}

// Confere se o token + conta de anúncio são válidos e pertencem a quem
// gerou o token — chamada leve, só pra validar antes de salvar.
export async function testMetaCredentials(creds: MetaCredentials): Promise<TestResult> {
  const accountId = creds.ad_account_id.replace(/^act_/, "");
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/act_${accountId}?fields=name,account_status&access_token=${encodeURIComponent(creds.access_token)}`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok || json.error) {
      return { valid: false, error: json.error?.message || `HTTP ${res.status}` };
    }
    return { valid: true, label: json.name };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : "Falha de rede." };
  }
}

export interface CampaignSpend {
  campaignId: string;
  campaignName: string;
  spendCents: number;
  date: string;
}

// Gasto por campanha num intervalo — usado pelo sync (POST /api/ads/sync,
// ainda não implementado). "spend" vem em unidade monetária da conta, não
// em cents.
export async function fetchMetaCampaignSpend(
  creds: MetaCredentials,
  since: string,
  until: string
): Promise<CampaignSpend[]> {
  const accountId = creds.ad_account_id.replace(/^act_/, "");
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const url =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/act_${accountId}/insights` +
    `?level=campaign&fields=campaign_id,campaign_name,spend,date_start` +
    `&time_range=${timeRange}&time_increment=1&limit=500&access_token=${encodeURIComponent(creds.access_token)}`;

  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Falha ao buscar insights do Meta (HTTP ${res.status}).`);
  }

  const rows: Array<{ campaign_id: string; campaign_name: string; spend: string; date_start: string }> =
    json.data ?? [];

  return rows.map((r) => ({
    campaignId: r.campaign_id,
    campaignName: r.campaign_name,
    spendCents: Math.round(parseFloat(r.spend || "0") * 100),
    date: r.date_start,
  }));
}
