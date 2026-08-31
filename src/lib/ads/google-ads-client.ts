import "server-only";

// Formatos seguem a documentação pública atual da Google Ads API REST —
// confirmar contra uma chamada real assim que houver credencial de teste,
// antes de confiar no dado em produção.
const API_VERSION = "v18";

export interface GoogleCredentials {
  developer_token: string;
  client_id: string;
  client_secret: string;
  refresh_token: string;
  customer_id: string;
  login_customer_id?: string;
}

export interface TestResult {
  valid: boolean;
  label?: string;
  error?: string;
}

async function getAccessToken(creds: GoogleCredentials): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      refresh_token: creds.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || "Falha ao trocar refresh_token por access_token.");
  }
  return json.access_token as string;
}

function customerIdDigits(id: string): string {
  return id.replace(/-/g, "");
}

async function searchStream(creds: GoogleCredentials, accessToken: string, query: string) {
  const customerId = customerIdDigits(creds.customer_id);
  const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:searchStream`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "developer-token": creds.developer_token,
  };
  if (creds.login_customer_id) {
    headers["login-customer-id"] = customerIdDigits(creds.login_customer_id);
  }

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ query }) });
  const json = await res.json();
  if (!res.ok) {
    const message = Array.isArray(json) ? json[0]?.error?.message : json.error?.message;
    throw new Error(message || `HTTP ${res.status}`);
  }
  return json as Array<{ results?: Array<Record<string, unknown>> }>;
}

// Confere se as credenciais conseguem autenticar e ler ao menos o nome da
// conta — chamada leve, só pra validar antes de salvar.
export async function testGoogleCredentials(creds: GoogleCredentials): Promise<TestResult> {
  try {
    const accessToken = await getAccessToken(creds);
    const chunks = await searchStream(
      creds,
      accessToken,
      "SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1"
    );
    const first = chunks[0]?.results?.[0] as
      | { customer?: { id?: string; descriptiveName?: string } }
      | undefined;
    if (!first?.customer) {
      return { valid: false, error: "Conta encontrada, mas sem dados retornados." };
    }
    return { valid: true, label: first.customer.descriptiveName || first.customer.id };
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
// ainda não implementado). cost_micros / 10000 = cents (1 unidade
// monetária = 1_000_000 micros).
export async function fetchGoogleCampaignSpend(
  creds: GoogleCredentials,
  since: string,
  until: string
): Promise<CampaignSpend[]> {
  const accessToken = await getAccessToken(creds);
  const query = `
    SELECT campaign.id, campaign.name, metrics.cost_micros, segments.date
    FROM campaign
    WHERE segments.date BETWEEN '${since}' AND '${until}'
  `;
  const chunks = await searchStream(creds, accessToken, query);

  const rows: CampaignSpend[] = [];
  for (const chunk of chunks) {
    for (const result of chunk.results ?? []) {
      const campaign = result.campaign as { id?: string; name?: string } | undefined;
      const metrics = result.metrics as { costMicros?: string } | undefined;
      const segments = result.segments as { date?: string } | undefined;
      if (!campaign?.id || !segments?.date) continue;
      rows.push({
        campaignId: campaign.id,
        campaignName: campaign.name || campaign.id,
        spendCents: Math.round(Number(metrics?.costMicros || 0) / 10000),
        date: segments.date,
      });
    }
  }
  return rows;
}
