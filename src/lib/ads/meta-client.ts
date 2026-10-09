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

/**
 * Moeda da conta de anúncio (USD, BRL...). O "spend" dos insights vem
 * nela, não em real — quem salva o gasto precisa converter.
 */
export async function fetchMetaAccountCurrency(creds: MetaCredentials): Promise<string> {
  const accountId = creds.ad_account_id.replace(/^act_/, "");
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/act_${accountId}?fields=currency&access_token=${encodeURIComponent(creds.access_token)}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || json.error || typeof json.currency !== "string") {
    throw new Error(json.error?.message || `Falha ao ler a moeda da conta do Meta (HTTP ${res.status}).`);
  }
  return json.currency.toUpperCase();
}

export interface EntidadeComNome {
  id: string;
  name: string;
  level: "campaign" | "adset" | "ad";
}

// Nome de cada campanha, conjunto e anúncio da conta. O link do anúncio só
// carrega os IDs (utm_campaign / utm_term / utm_content); é isto que deixa a
// tela dizer "(CP VD) - PEPE - QUIZ" em vez de 120248833147640634.
// Pagina pelo cursor "after" até acabar (teto de 20 páginas por nível, pra
// uma conta enorme não segurar a requisição).
export async function fetchMetaEntityNames(creds: MetaCredentials): Promise<EntidadeComNome[]> {
  const accountId = creds.ad_account_id.replace(/^act_/, "");
  const niveis: { caminho: string; level: EntidadeComNome["level"] }[] = [
    { caminho: "campaigns", level: "campaign" },
    { caminho: "adsets", level: "adset" },
    { caminho: "ads", level: "ad" },
  ];
  const saida: EntidadeComNome[] = [];

  for (const { caminho, level } of niveis) {
    let url: string | null =
      `https://graph.facebook.com/${GRAPH_API_VERSION}/act_${accountId}/${caminho}` +
      `?fields=id,name&limit=500&access_token=${encodeURIComponent(creds.access_token)}`;
    for (let pagina = 0; url && pagina < 20; pagina++) {
      const res: Response = await fetch(url);
      const json: { data?: { id: string; name: string }[]; paging?: { next?: string }; error?: { message?: string } } =
        await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || `Falha ao buscar nomes (${caminho}, HTTP ${res.status}).`);
      }
      for (const item of json.data ?? []) saida.push({ id: item.id, name: item.name, level });
      url = json.paging?.next ?? null;
    }
  }
  return saida;
}

export interface GastoDeEntidade {
  entityId: string;
  entityName: string;
  campaignId: string | null;
  adsetId: string | null;
  spendCents: number;
  date: string;
}

// Gasto por dia no nível de conjunto ("adset") ou de anúncio ("ad"). Mesma
// janela e mesma conta do gasto por campanha; pagina pelo cursor.
export async function fetchMetaEntitySpend(
  creds: MetaCredentials,
  level: "adset" | "ad",
  since: string,
  until: string
): Promise<GastoDeEntidade[]> {
  const accountId = creds.ad_account_id.replace(/^act_/, "");
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const campos =
    level === "adset"
      ? "adset_id,adset_name,campaign_id,spend,date_start"
      : "ad_id,ad_name,adset_id,campaign_id,spend,date_start";
  let url: string | null =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/act_${accountId}/insights` +
    `?level=${level}&fields=${campos}&time_range=${timeRange}&time_increment=1&limit=500` +
    `&access_token=${encodeURIComponent(creds.access_token)}`;

  const saida: GastoDeEntidade[] = [];
  for (let pagina = 0; url && pagina < 20; pagina++) {
    const res: Response = await fetch(url);
    const json: {
      data?: Record<string, string>[];
      paging?: { next?: string };
      error?: { message?: string };
    } = await res.json();
    if (!res.ok || json.error) {
      throw new Error(json.error?.message || `Falha ao buscar gasto por ${level} (HTTP ${res.status}).`);
    }
    for (const r of json.data ?? []) {
      saida.push({
        entityId: level === "adset" ? r.adset_id : r.ad_id,
        entityName: (level === "adset" ? r.adset_name : r.ad_name) ?? "",
        campaignId: r.campaign_id ?? null,
        adsetId: level === "ad" ? (r.adset_id ?? null) : null,
        spendCents: Math.round(parseFloat(r.spend || "0") * 100),
        date: r.date_start,
      });
    }
    url = json.paging?.next ?? null;
  }
  return saida;
}

export interface CampaignSpend {
  campaignId: string;
  campaignName: string;
  spendCents: number;
  date: string;
}

// Gasto por campanha num intervalo — usado pelo sync (POST /api/ads/sync).
// "spend" vem em unidade monetária DA CONTA (as nossas são em dólar), não em
// cents nem em real: o sync converte (ver lib/ads/cambio.ts).
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
