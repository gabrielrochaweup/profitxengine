"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Users, ShoppingCart, GraduationCap, Landmark, Wallet, TrendingUp, Percent, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { SubTabs } from "@/components/ui/sub-tabs";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { SimpleBarChart, ConversionFunnel, DynamicPieChart, HorizontalBarList, colorForLabel } from "../../analytics/components/charts";

interface CampaignRow {
  utm_source: string;
  utm_campaign: string;
  leads: number;
  initiate_checkouts: number;
  purchases: number;
  purchase_revenue_cents: number;
  members_access: number;
  broker_signups: number;
  deposits: number;
  deposits_total_cents: number;
  spend_cents: number;
}

interface RecentEvent {
  id: string;
  event_type: string;
  source: string;
  email: string | null;
  amount_cents: number | null;
  currency: string;
  offer_name: string | null;
  lead_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  occurred_at: string;
}

type Period = "hoje" | "7d" | "30d" | "90d" | "tudo";

const PERIOD_OPTIONS: { key: Period; label: string; days: number | null }[] = [
  { key: "hoje", label: "Hoje", days: 0 },
  { key: "7d", label: "7 dias", days: 7 },
  { key: "30d", label: "30 dias", days: 30 },
  { key: "90d", label: "90 dias", days: 90 },
  { key: "tudo", label: "Tudo", days: null },
];

const EVENT_TYPE_LABEL: Record<string, string> = {
  page_view: "Clique/landing",
  initiate_checkout: "Iniciou checkout",
  purchase: "Compra do curso",
  members_access: "Acesso à área de membros",
  broker_signup: "Cadastro na corretora",
  broker_deposit: "Depósito",
};

// dow do Postgres: 0 = domingo. Reordenado pra exibir Seg→Dom.
const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAY_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const EVENT_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "Todos os tipos" },
  { value: "page_view", label: "Clique/landing" },
  { value: "initiate_checkout", label: "Iniciou checkout" },
  { value: "purchase", label: "Compra do curso" },
  { value: "members_access", label: "Acesso à área de membros" },
  { value: "broker_signup", label: "Cadastro na corretora" },
  { value: "broker_deposit", label: "Depósito" },
];

// Categorias "de fallback" que aparecem na coluna Origem/Campanha em vez
// de um nome de campanha real — sem essa explicação, parecem só mais uma
// campanha e confundem quem está lendo o relatório pela primeira vez.
const SPECIAL_BUCKET_HELP: Record<string, string> = {
  "(direto)": "Visitante chegou sem nenhuma UTM no link (sem utm_source).",
  "(sem campanha)": "Tem utm_source, mas o link não veio com utm_campaign preenchido.",
  "(não atribuído)": "Evento (compra, depósito...) chegou mas não deu pra ligar a nenhum lead nosso — sem campanha possível de atribuir.",
};

function isSpecialBucket(value: string): boolean {
  return value in SPECIAL_BUCKET_HELP;
}

const TABLE_TABS = [
  { key: "contas", label: "Contas" },
  { key: "campanhas", label: "Campanhas" },
  { key: "conjuntos", label: "Conjuntos" },
  { key: "anuncios", label: "Anúncios" },
] as const;

type TableTab = (typeof TABLE_TABS)[number]["key"];

const ANALYTICS_SUB_TABS = [
  { key: "visao", label: "Visão geral" },
  { key: "campanhas", label: "Campanhas" },
  { key: "eventos", label: "Eventos" },
] as const;

type AnalyticsSubTab = (typeof ANALYTICS_SUB_TABS)[number]["key"];

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

// Depósito na corretora é sempre em dólar — só a venda do curso é em real.
function fmtUSD(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function sumBy(rows: CampaignRow[], key: keyof CampaignRow): number {
  return rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
}

export function AnalyticsTab({
  productId,
  initialReport,
  initialEvents,
}: {
  productId: string;
  initialReport: CampaignRow[];
  initialEvents: RecentEvent[];
}) {
  const [period, setPeriod] = useState<Period>("90d");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [hideUnattributed, setHideUnattributed] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [report, setReport] = useState<CampaignRow[]>(initialReport);
  const [events, setEvents] = useState<RecentEvent[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tableTab, setTableTab] = useState<TableTab>("campanhas");
  const [subTab, setSubTab] = useState<AnalyticsSubTab>("visao");
  const [usdBrlRate, setUsdBrlRate] = useState<number | null>(null);
  const [usdBrlRateUpdatedAt, setUsdBrlRateUpdatedAt] = useState<string | null>(null);
  const [salesByOffer, setSalesByOffer] = useState<{ offer_name: string; purchases: number; revenue_cents: number }[]>(
    []
  );
  const [salesByPayment, setSalesByPayment] = useState<
    { payment_method: string; purchases: number; revenue_cents: number }[]
  >([]);
  const [salesByTime, setSalesByTime] = useState<{ weekday: number; hour: number; purchases: number }[]>([]);

  async function fetchRate() {
    try {
      const res = await fetch("/api/tracking/usd-brl-rate");
      const body = await res.json();
      setUsdBrlRate(typeof body.rate === "number" ? body.rate : null);
      setUsdBrlRateUpdatedAt(typeof body.updatedAt === "string" ? body.updatedAt : null);
    } catch {
      setUsdBrlRate(null);
    }
  }

  async function fetchSalesBreakdowns(supabase: ReturnType<typeof createClient>, from: Date, now: Date) {
    const params = { p_product_id: productId, p_from: from.toISOString(), p_to: now.toISOString() };
    const [{ data: offerData }, { data: paymentData }, { data: timeData }] = await Promise.all([
      supabase.rpc("tracking_sales_by_offer", params),
      supabase.rpc("tracking_sales_by_payment_method", params),
      supabase.rpc("tracking_sales_by_time", params),
    ]);
    setSalesByOffer(offerData ?? []);
    setSalesByPayment(paymentData ?? []);
    setSalesByTime(timeData ?? []);
  }

  useEffect(() => {
    fetchRate();
    const { from, now } = periodRange(period);
    fetchSalesBreakdowns(createClient(), from, now);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function periodRange(next: Period) {
    const now = new Date();
    const from = new Date(now);
    if (next === "hoje") {
      from.setHours(0, 0, 0, 0);
    } else {
      const option = PERIOD_OPTIONS.find((o) => o.key === next);
      from.setDate(from.getDate() - (option?.days ?? 3650));
    }
    return { from, now };
  }

  // Eventos recentes usa o mesmo período selecionado acima (não fica preso
  // aos últimos 50 eventos sem filtro de data nenhum como antes) — junta a
  // UTM/campanha do lead do mesmo jeito que a carga inicial da página faz.
  async function fetchEvents(supabase: ReturnType<typeof createClient>, from: Date, now: Date) {
    const { data: rawEvents } = await supabase
      .from("tracking_events")
      .select("id, event_type, source, email, amount_cents, currency, offer_name, lead_id, occurred_at")
      .eq("product_id", productId)
      .gte("occurred_at", from.toISOString())
      .lte("occurred_at", now.toISOString())
      .order("occurred_at", { ascending: false })
      .limit(200);

    const leadIds = Array.from(new Set((rawEvents ?? []).map((e) => e.lead_id).filter((id): id is string => !!id)));
    const { data: eventLeads } =
      leadIds.length > 0
        ? await supabase.from("tracking_leads").select("id, utm_source, utm_medium, utm_campaign").in("id", leadIds)
        : { data: [] };
    const leadById = new Map((eventLeads ?? []).map((l) => [l.id, l]));

    setEvents(
      (rawEvents ?? []).map((e) => ({
        ...e,
        utm_source: e.lead_id ? (leadById.get(e.lead_id)?.utm_source ?? null) : null,
        utm_medium: e.lead_id ? (leadById.get(e.lead_id)?.utm_medium ?? null) : null,
        utm_campaign: e.lead_id ? (leadById.get(e.lead_id)?.utm_campaign ?? null) : null,
      }))
    );
  }

  async function fetchReport(next: Period) {
    setLoading(true);
    const supabase = createClient();
    const { from, now } = periodRange(next);

    const { data } = await supabase.rpc("tracking_campaign_report", {
      p_product_id: productId,
      p_from: from.toISOString(),
      p_to: now.toISOString(),
    });
    setReport(data ?? []);
    await fetchEvents(supabase, from, now);
    await fetchSalesBreakdowns(supabase, from, now);
    await fetchRate();
    setLastUpdated(new Date());
    setLoading(false);
  }

  async function changePeriod(next: Period) {
    setPeriod(next);
    await fetchReport(next);
  }

  const filteredEvents = useMemo(
    () => (eventTypeFilter === "all" ? events : events.filter((e) => e.event_type === eventTypeFilter)),
    [events, eventTypeFilter]
  );

  const sources = useMemo(() => Array.from(new Set(report.map((r) => r.utm_source))).sort(), [report]);

  const filteredReport = useMemo(() => {
    let rows = sourceFilter === "all" ? report : report.filter((r) => r.utm_source === sourceFilter);
    if (hideUnattributed) rows = rows.filter((r) => !isSpecialBucket(r.utm_source));
    return rows;
  }, [report, sourceFilter, hideUnattributed]);

  const kpis = useMemo(
    () => ({
      leads: sumBy(filteredReport, "leads"),
      initiateCheckouts: sumBy(filteredReport, "initiate_checkouts"),
      purchases: sumBy(filteredReport, "purchases"),
      purchaseRevenue: sumBy(filteredReport, "purchase_revenue_cents"),
      membersAccess: sumBy(filteredReport, "members_access"),
      brokerSignups: sumBy(filteredReport, "broker_signups"),
      deposits: sumBy(filteredReport, "deposits"),
      depositsTotal: sumBy(filteredReport, "deposits_total_cents"),
      spend: sumBy(filteredReport, "spend_cents"),
    }),
    [filteredReport]
  );

  // Curso é sempre em real e depósito de corretora sempre em dólar — juntar
  // os dois numa métrica só significava somar centavo de real com centavo
  // de dólar como se fossem a mesma coisa. Mantidos separados, cada um
  // comparado com o mesmo gasto total (não dá pra saber quanto do gasto foi
  // "pro curso" e quanto foi "pra corretora" — os dois usam a base inteira).
  const hasSpend = kpis.spend > 0;

  const roasCurso = hasSpend ? kpis.purchaseRevenue / kpis.spend : null;
  const profitCurso = hasSpend ? kpis.purchaseRevenue - kpis.spend : null;
  const roiCurso = hasSpend ? (kpis.purchaseRevenue - kpis.spend) / kpis.spend : null;

  const depositsTotalBRL = usdBrlRate !== null ? Math.round(kpis.depositsTotal * usdBrlRate) : null;
  const roasCorretora = hasSpend && depositsTotalBRL !== null ? depositsTotalBRL / kpis.spend : null;
  const profitCorretora = hasSpend && depositsTotalBRL !== null ? depositsTotalBRL - kpis.spend : null;
  const roiCorretora =
    hasSpend && depositsTotalBRL !== null ? (depositsTotalBRL - kpis.spend) / kpis.spend : null;

  const bySource = useMemo(() => {
    const map = new Map<string, { leads: number; depositsTotal: number }>();
    report.forEach((r) => {
      const entry = map.get(r.utm_source) ?? { leads: 0, depositsTotal: 0 };
      entry.leads += r.leads;
      entry.depositsTotal += r.deposits_total_cents;
      map.set(r.utm_source, entry);
    });
    return Array.from(map.entries())
      .map(([source, v]) => ({ source, ...v }))
      .sort((a, b) => b.depositsTotal - a.depositsTotal);
  }, [report]);

  const depositsByCampaign = useMemo(
    () =>
      filteredReport
        .filter((r) => r.deposits_total_cents > 0)
        .slice()
        .sort((a, b) => b.deposits_total_cents - a.deposits_total_cents)
        .slice(0, 10)
        .map((r) => ({ label: `${r.utm_source} · ${r.utm_campaign}`, value: r.deposits_total_cents })),
    [filteredReport]
  );

  // Visão rápida com as 6 etapas juntas — complementa os 2 funis
  // detalhados abaixo (curso/corretora), que divergem logo após "Leads".
  const combinedFunnelStages = [
    { label: "Leads", value: kpis.leads },
    { label: "Iniciou checkout", value: kpis.initiateCheckouts },
    { label: "Compra do curso", value: kpis.purchases },
    { label: "Área de membros", value: kpis.membersAccess },
    { label: "Cadastro na corretora", value: kpis.brokerSignups },
    { label: "Depósito", value: kpis.deposits },
  ];
  const maxCombinedStage = Math.max(1, ...combinedFunnelStages.map((s) => s.value));

  // Curso e corretora divergem logo depois de "Leads" — dois funis
  // separados em vez de misturar as duas jornadas numa lista só.
  const courseFunnelData = [
    { label: "Leads", value: kpis.leads },
    { label: "Iniciou checkout", value: kpis.initiateCheckouts },
    { label: "Compra do curso", value: kpis.purchases },
  ];
  const brokerFunnelData = [
    { label: "Leads", value: kpis.leads },
    { label: "Cadastro na corretora", value: kpis.brokerSignups },
    { label: "Depósito", value: kpis.deposits },
  ];

  const salesByOfferChart = useMemo(
    () => salesByOffer.map((r) => ({ name: r.offer_name, value: r.purchases })),
    [salesByOffer]
  );
  const salesByPaymentChart = useMemo(
    () => salesByPayment.map((r) => ({ name: r.payment_method, value: r.purchases })),
    [salesByPayment]
  );

  const salesByHourChart = useMemo(() => {
    const byHour = new Array(24).fill(0);
    salesByTime.forEach((r) => {
      byHour[r.hour] += r.purchases;
    });
    return byHour.map((value, hour) => ({ label: `${String(hour).padStart(2, "0")}h`, value }));
  }, [salesByTime]);

  const salesByWeekdayChart = useMemo(() => {
    const byWeekday = new Array(7).fill(0);
    salesByTime.forEach((r) => {
      byWeekday[r.weekday] += r.purchases;
    });
    return WEEKDAY_DISPLAY_ORDER.map((dow) => ({ label: WEEKDAY_LABELS[dow], value: byWeekday[dow] }));
  }, [salesByTime]);

  const salesByUtm = useMemo(
    () =>
      filteredReport
        .filter((r) => r.purchases > 0)
        .slice()
        .sort((a, b) => b.purchase_revenue_cents - a.purchase_revenue_cents)
        .slice(0, 10)
        .map((r) => ({ label: `${r.utm_source} · ${r.utm_campaign}`, value: r.purchase_revenue_cents })),
    [filteredReport]
  );

  return (
    <div className="space-y-4">
      {/* ── Barra de filtros ── */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-muted">Período</label>
              <div className="flex flex-wrap gap-1.5">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => changePeriod(opt.key)}
                    disabled={loading}
                    className={`rounded-button px-3 py-1.5 text-xs font-medium transition-colors ${
                      period === opt.key
                        ? "bg-accent text-white"
                        : "text-text-secondary hover:bg-card-hover"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-40">
              <label className="mb-1 block text-[11px] font-medium text-text-muted">Fonte de tráfego</label>
              <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                <option value="all">Qualquer</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-40">
              <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-text-muted">
                Plataforma
                <Tooltip text="Disponível depois de conectar Meta Ads / Google Ads e sincronizar o gasto." />
              </label>
              <Select disabled value="all">
                <option value="all">Qualquer</option>
              </Select>
            </div>

            <div className="w-44">
              <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-text-muted">
                Conta de anúncio
                <Tooltip text="Disponível depois de conectar Meta Ads / Google Ads e sincronizar o gasto." />
              </label>
              <Select disabled value="all">
                <option value="all">Qualquer</option>
              </Select>
            </div>

            <label className="flex items-center gap-2 pb-2.5 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={hideUnattributed}
                onChange={(e) => setHideUnattributed(e.target.checked)}
                className="h-3.5 w-3.5 accent-accent"
              />
              Ocultar não atribuído
            </label>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-text-muted">
              {lastUpdated ? `Atualizado às ${lastUpdated.toLocaleTimeString("pt-BR")}` : "—"}
            </span>
            <Button size="sm" variant="secondary" onClick={() => fetchReport(period)} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Atualizar
            </Button>
          </div>
        </div>
      </Card>

      <SubTabs tabs={ANALYTICS_SUB_TABS} active={subTab} onChange={setSubTab} />

      {subTab === "visao" && (
        <div className="space-y-4">
          {/* ── Lucro em destaque ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <HeroStat
              label="Lucro — Curso (R$)"
              value={profitCurso !== null ? fmtBRL(profitCurso) : "—"}
              positive={profitCurso !== null ? profitCurso >= 0 : null}
              roas={roasCurso !== null ? `${roasCurso.toFixed(1)}x` : "—"}
              roi={roiCurso !== null ? `${roiCurso >= 0 ? "+" : ""}${(roiCurso * 100).toFixed(0)}%` : "—"}
            />
            <HeroStat
              label="Lucro — Corretora (US$ convertido p/ R$)"
              value={profitCorretora !== null ? fmtBRL(profitCorretora) : "—"}
              positive={profitCorretora !== null ? profitCorretora >= 0 : null}
              roas={roasCorretora !== null ? `${roasCorretora.toFixed(1)}x` : "—"}
              roi={roiCorretora !== null ? `${roiCorretora >= 0 ? "+" : ""}${(roiCorretora * 100).toFixed(0)}%` : "—"}
              hint={
                <span className="inline-flex items-center gap-1">
                  Depósito é sempre em dólar, convertido pra comparar com o gasto
                  <Tooltip text="Depósito é sempre em dólar — convertido pra real na cotação atual só pra comparar com o gasto em anúncios, que é cobrado em real." />
                </span>
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <FinanceTile
              label="Gasto com anúncios"
              value={hasSpend ? fmtBRL(kpis.spend) : "—"}
              hint={hasSpend ? "Base dos ROIs acima" : "Sincronize o gasto em Contas Meta/Google"}
            />
            <FinanceTile
              label="Cotação USD/BRL"
              value={usdBrlRate !== null ? `R$ ${usdBrlRate.toFixed(2)}` : "—"}
              hint={usdBrlRateUpdatedAt ? `Atualizada ${usdBrlRateUpdatedAt}` : "Carregando..."}
            />
          </div>

          {/* ── Funil de conversão (visão rápida, todas as etapas juntas) ── */}
          <Card className="p-5">
            <h3 className="mb-3 text-base font-semibold text-text-primary">Funil de conversão</h3>
            <div className="space-y-2">
              {combinedFunnelStages.map((stage) => (
                <div key={stage.label} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 text-xs text-text-secondary">{stage.label}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-button bg-card-hover">
                    <div
                      className="h-full rounded-button bg-accent"
                      style={{ width: `${Math.max(2, (stage.value / maxCombinedStage) * 100)}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs font-medium text-text-primary">
                    {stage.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Funil do curso + funil da corretora (detalhado, estilo Meta Ads) ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-1 text-base font-semibold text-text-primary">Funil do curso</h3>
              <ConversionFunnel data={courseFunnelData} color="var(--accent)" />
            </Card>
            <Card className="p-5">
              <h3 className="mb-1 text-base font-semibold text-text-primary">Funil da corretora</h3>
              <ConversionFunnel data={brokerFunnelData} color="var(--success)" />
            </Card>
          </div>

          {/* ── KPIs do funil (dado real, já capturado) ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <KpiTile icon={Users} label="Leads" value={String(kpis.leads)} />
            <KpiTile
              icon={ShoppingCart}
              label="Compras do curso"
              value={String(kpis.purchases)}
              sub={fmtBRL(kpis.purchaseRevenue)}
            />
            <KpiTile icon={GraduationCap} label="Área de membros" value={String(kpis.membersAccess)} />
            <KpiTile icon={Landmark} label="Cadastros corretora" value={String(kpis.brokerSignups)} />
            <KpiTile
              icon={Wallet}
              label="Depósitos"
              value={String(kpis.deposits)}
              sub={fmtUSD(kpis.depositsTotal)}
              tone="success"
            />
            <KpiTile
              icon={TrendingUp}
              label="Ticket médio depósito"
              value={fmtUSD(kpis.deposits > 0 ? Math.round(kpis.depositsTotal / kpis.deposits) : 0)}
              tone="accent"
            />
          </div>

          {/* ── Vendas por produto e por método de pagamento ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-3 text-base font-semibold text-text-primary">Vendas por produto</h3>
              <DynamicPieChart data={salesByOfferChart} innerRadius={55} unit="count" />
            </Card>
            <Card className="p-5">
              <h3 className="mb-1 flex items-center gap-1.5 text-base font-semibold text-text-primary">
                Vendas por método de pagamento
                <Tooltip text="Só a Onprofit manda esse dado por enquanto (Cartão de crédito/Pix) — outras plataformas caem em '(não identificado)' até termos esse campo confirmado com elas também." />
              </h3>
              <DynamicPieChart data={salesByPaymentChart} innerRadius={55} unit="count" />
            </Card>
          </div>

          {/* ── Vendas por horário e por dia da semana ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-3 text-base font-semibold text-text-primary">Vendas por horário</h3>
              <SimpleBarChart data={salesByHourChart} valueLabel="Compras" color="var(--accent)" />
            </Card>
            <Card className="p-5">
              <h3 className="mb-3 text-base font-semibold text-text-primary">Vendas por dia da semana</h3>
              <SimpleBarChart data={salesByWeekdayChart} valueLabel="Compras" color="var(--accent-pink)" />
            </Card>
          </div>

          {/* ── Por fonte ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-3 text-base font-semibold text-text-primary">Leads por fonte</h3>
              {bySource.length === 0 ? (
                <p className="text-xs text-text-muted">Sem dados suficientes nesse período.</p>
              ) : (
                <ul className="space-y-2">
                  {bySource.map((s) => (
                    <li key={s.source} className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">{s.source}</span>
                      <span className="font-medium text-text-primary">{s.leads}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="mb-3 text-base font-semibold text-text-primary">Depósitos por fonte</h3>
              {bySource.length === 0 ? (
                <p className="text-xs text-text-muted">Sem dados suficientes nesse período.</p>
              ) : (
                <ul className="space-y-2">
                  {bySource.map((s) => (
                    <li key={s.source} className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">{s.source}</span>
                      <span className="font-medium text-text-primary">{fmtUSD(s.depositsTotal)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="mb-3 text-base font-semibold text-text-primary">Depósitos por campanha (top 10)</h3>
            <HorizontalBarList data={depositsByCampaign} valueFormatter={(v) => fmtUSD(v)} colorFor={colorForLabel} />
          </Card>
        </div>
      )}

      {subTab === "campanhas" && (
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 text-base font-semibold text-text-primary">Vendas por UTM/campanha (top 10)</h3>
            <HorizontalBarList data={salesByUtm} valueFormatter={(v) => fmtBRL(v)} colorFor={colorForLabel} />
          </Card>

          {/* ── Tabela com abas (Contas/Campanhas/Conjuntos/Anúncios) ── */}
          <Card className="p-0">
          <div className="flex gap-1 border-b border-border px-3 pt-2">
            {TABLE_TABS.map((tab) => {
              const enabled = tab.key === "campanhas";
              return (
                <button
                  key={tab.key}
                  type="button"
                  disabled={!enabled}
                  onClick={() => enabled && setTableTab(tab.key)}
                  title={enabled ? undefined : "Disponível depois de conectar Meta Ads / Google Ads"}
                  className={`rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${
                    tableTab === tab.key
                      ? "border-b-2 border-accent text-text-primary"
                      : enabled
                        ? "text-text-secondary hover:text-text-primary"
                        : "cursor-not-allowed text-text-muted/50"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-5">
            {filteredReport.length === 0 ? (
              <p className="text-xs text-text-muted">Sem dados suficientes nesse período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-text-muted">
                      <th className="py-2 pr-3 font-medium">Origem</th>
                      <th className="py-2 pr-3 font-medium">Campanha</th>
                      <th className="py-2 pr-3 font-medium">Leads</th>
                      <th className="py-2 pr-3 font-medium">Iniciou checkout</th>
                      <th className="py-2 pr-3 font-medium">Compras curso</th>
                      <th className="py-2 pr-3 font-medium">Receita curso</th>
                      <th className="py-2 pr-3 font-medium">Área de membros</th>
                      <th className="py-2 pr-3 font-medium">Corretora</th>
                      <th className="py-2 pr-3 font-medium">Depósitos</th>
                      <th className="py-2 pr-3 font-medium">Total depositado</th>
                      <th className="py-2 pr-3 font-medium">Gasto</th>
                      <th className="py-2 pr-3 font-medium">ROI curso</th>
                      <th className="py-2 font-medium">ROI corretora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReport.map((r) => {
                      const rowRoiCurso =
                        r.spend_cents > 0 ? (r.purchase_revenue_cents - r.spend_cents) / r.spend_cents : null;
                      const rowDepositsBRL = usdBrlRate !== null ? Math.round(r.deposits_total_cents * usdBrlRate) : null;
                      const rowRoiCorretora =
                        r.spend_cents > 0 && rowDepositsBRL !== null
                          ? (rowDepositsBRL - r.spend_cents) / r.spend_cents
                          : null;
                      return (
                        <tr
                          key={`${r.utm_source}-${r.utm_campaign}`}
                          className="border-b border-border/50 text-text-secondary"
                        >
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {isSpecialBucket(r.utm_source) ? (
                              <span className="inline-flex items-center gap-1 italic text-text-muted">
                                {r.utm_source}
                                <Tooltip text={SPECIAL_BUCKET_HELP[r.utm_source]} />
                              </span>
                            ) : (
                              r.utm_source
                            )}
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {isSpecialBucket(r.utm_campaign) ? (
                              <span className="inline-flex items-center gap-1 italic text-text-muted">
                                {r.utm_campaign}
                                <Tooltip text={SPECIAL_BUCKET_HELP[r.utm_campaign]} />
                              </span>
                            ) : (
                              r.utm_campaign
                            )}
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap">{r.leads}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{r.initiate_checkouts}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{r.purchases}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{fmtBRL(r.purchase_revenue_cents)}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{r.members_access}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{r.broker_signups}</td>
                          <td className="py-2 pr-3 whitespace-nowrap">{r.deposits}</td>
                          <td className="py-2 pr-3 whitespace-nowrap font-medium text-text-primary">
                            {fmtUSD(r.deposits_total_cents)}
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {r.spend_cents > 0 ? fmtBRL(r.spend_cents) : "—"}
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {rowRoiCurso !== null ? (
                              <span className={rowRoiCurso >= 0 ? "text-success" : "text-danger"}>
                                {rowRoiCurso >= 0 ? "+" : ""}
                                {(rowRoiCurso * 100).toFixed(0)}%
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-2 whitespace-nowrap">
                            {rowRoiCorretora !== null ? (
                              <span className={rowRoiCorretora >= 0 ? "text-success" : "text-danger"}>
                                {rowRoiCorretora >= 0 ? "+" : ""}
                                {(rowRoiCorretora * 100).toFixed(0)}%
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </Card>
        </div>
      )}

      {subTab === "eventos" && (
        <Card className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-text-primary">Eventos recentes</h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted">
                Período: {PERIOD_OPTIONS.find((o) => o.key === period)?.label}
              </span>
              <Select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)} className="w-56">
                {EVENT_TYPE_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {filteredEvents.length === 0 ? (
            <p className="text-xs text-text-muted">Nenhum evento nesse período/tipo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="py-2 pr-3 font-medium">Quando</th>
                    <th className="py-2 pr-3 font-medium">Tipo</th>
                    <th className="py-2 pr-3 font-medium">Origem</th>
                    <th className="py-2 pr-3 font-medium">E-mail</th>
                    <th className="py-2 pr-3 font-medium">Plano</th>
                    <th className="py-2 pr-3 font-medium">Valor</th>
                    <th className="py-2 pr-3 font-medium">Campanha</th>
                    <th className="py-2 font-medium">Lead</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((e) => (
                    <tr key={e.id} className="border-b border-border/50 text-text-secondary">
                      <td className="py-2 pr-3 whitespace-nowrap">{new Date(e.occurred_at).toLocaleString("pt-BR")}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{EVENT_TYPE_LABEL[e.event_type] ?? e.event_type}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{e.source}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{e.email ?? "—"}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{e.offer_name ?? "—"}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {e.amount_cents != null
                          ? e.event_type === "broker_deposit"
                            ? fmtUSD(e.amount_cents)
                            : fmtBRL(e.amount_cents)
                          : "—"}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {e.utm_source ? `${e.utm_source} · ${e.utm_campaign ?? "(sem campanha)"}` : "—"}
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        {e.lead_id ? "Atribuído" : <span className="text-warning">Não atribuído</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
  tone?: "accent" | "success";
}) {
  return (
    <div className="rounded-xl bg-card-hover p-3">
      <div className="mb-1 flex items-center gap-1.5 text-text-muted">
        <Icon size={12} />
        <p className="text-[11px]">{label}</p>
      </div>
      <p
        className={`text-sm font-semibold ${
          tone === "accent" ? "text-accent" : tone === "success" ? "text-success" : "text-text-primary"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-text-muted">{sub}</p>}
    </div>
  );
}

function HeroStat({
  label,
  value,
  positive,
  roas,
  roi,
  hint,
}: {
  label: string;
  value: string;
  /** null quando ainda não dá pra calcular (sem gasto sincronizado ainda). */
  positive: boolean | null;
  roas: string;
  roi: string;
  hint?: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-card-hover p-5 shadow-card-sm">
      <p className="mb-1 text-xs font-medium text-text-muted">{label}</p>
      <p
        className={cn(
          "text-3xl font-bold",
          positive === null ? "text-text-muted" : positive ? "text-success" : "text-danger"
        )}
      >
        {value}
      </p>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-text-muted">
        <span>ROAS {roas}</span>
        <span>ROI {roi}</span>
      </div>
      {hint && <div className="mt-1 text-[10px] text-text-muted/70">{hint}</div>}
    </div>
  );
}

function FinanceTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-card-hover p-3">
      <div className="mb-1 flex items-center gap-1.5 text-text-muted">
        <Percent size={12} />
        <p className="text-[11px]">{label}</p>
      </div>
      <p className="text-sm font-semibold text-text-muted">{value}</p>
      <p className="text-[10px] text-text-muted/70">{hint}</p>
    </div>
  );
}
