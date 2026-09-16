"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Users,
  ShoppingCart,
  GraduationCap,
  Landmark,
  Wallet,
  TrendingUp,
  Percent,
  RefreshCw,
  Sparkles,
  FileSignature,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { SubTabs } from "@/components/ui/sub-tabs";
import { AlunosPanel } from "./alunos-panel";
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
  contracts_signed: number;
  members_access: number;
  tool_signups: number;
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
  contract_signed: "Contrato assinado",
  members_access: "Acesso à área de membros",
  tool_signup: "Cadastro no Pepe",
  tool_access: "Primeiro acesso no Pepe",
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
  { value: "contract_signed", label: "Contrato assinado" },
  { value: "members_access", label: "Acesso à área de membros" },
  { value: "tool_signup", label: "Cadastro no Pepe" },
  { value: "tool_access", label: "Primeiro acesso no Pepe" },
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

// Exportado porque quem manda na sub-aba ativa é o TrackingClient (ele
// guarda a escolha na URL) — a lista precisa ser a mesma nos dois lugares,
// senão um ?sub= válido aqui vira inválido lá.
export const ANALYTICS_SUB_TABS = [
  { key: "visao", label: "Visão geral", adminOnly: false },
  { key: "campanhas", label: "Campanhas", adminOnly: false },
  { key: "eventos", label: "Eventos", adminOnly: false },
  { key: "alunos", label: "Alunos e contratos", adminOnly: true },
] as const;

export type AnalyticsSubTab = (typeof ANALYTICS_SUB_TABS)[number]["key"];

// A regra de quem enxerga o quê fica num lugar só: o TrackingClient usa pra
// validar o ?sub= que veio na URL e esta aba usa pra desenhar a barra. Em
// dois lugares, uma sub-aba nova entraria válida num e invisível no outro.
export function analyticsSubTabsVisiveis(isAdmin: boolean) {
  return ANALYTICS_SUB_TABS.filter((t) => !t.adminOnly || isAdmin);
}

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
  isAdmin,
  subTab,
  onSubTabChange,
}: {
  productId: string;
  initialReport: CampaignRow[];
  initialEvents: RecentEvent[];
  isAdmin: boolean;
  subTab: AnalyticsSubTab;
  onSubTabChange: (key: AnalyticsSubTab) => void;
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
  const [kpiDetailType, setKpiDetailType] = useState<string | null>(null);
  // Só o botão "Atualizar" remonta a busca da lista de alunos; trocar de
  // período não precisa, porque o recorte por data é feito aqui no cliente.
  const [recarregarAlunos, setRecarregarAlunos] = useState(0);
  const [usdBrlRate, setUsdBrlRate] = useState<number | null>(null);
  const [usdBrlRateUpdatedAt, setUsdBrlRateUpdatedAt] = useState<string | null>(null);
  const [salesByOffer, setSalesByOffer] = useState<{ offer_name: string; purchases: number; revenue_cents: number }[]>(
    []
  );
  const [salesByPayment, setSalesByPayment] = useState<
    { payment_method: string; purchases: number; revenue_cents: number }[]
  >([]);
  const [salesByTime, setSalesByTime] = useState<{ weekday: number; hour: number; purchases: number }[]>([]);
  const [salesByPageType, setSalesByPageType] = useState<{ page_type: string; purchases: number; revenue_cents: number }[]>(
    []
  );
  // Adoção do Pepe (a IA): quantos alunos criaram conta lá e quantos
  // efetivamente entraram, separados pelo plano que a ferramenta conhece.
  const [pepePorPlano, setPepePorPlano] = useState<{ plano: string; cadastrados: number; acessaram: number }[]>([]);
  const [salesByChannel, setSalesByChannel] = useState<{ channel: string; purchases: number; revenue_cents: number }[]>(
    []
  );

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
    const [{ data: offerData }, { data: paymentData }, { data: timeData }, { data: pageTypeData }, { data: channelData }] =
      await Promise.all([
        supabase.rpc("tracking_sales_by_offer", params),
        supabase.rpc("tracking_sales_by_payment_method", params),
        supabase.rpc("tracking_sales_by_time", params),
        supabase.rpc("tracking_sales_by_page_type", params),
        supabase.rpc("tracking_sales_by_channel", params),
      ]);

    const { data: pepeData } = await supabase.rpc("tracking_ferramenta_por_plano", { ...params, p_source: "pepe" });
    setPepePorPlano(pepeData ?? []);
    setSalesByOffer(offerData ?? []);
    setSalesByPayment(paymentData ?? []);
    setSalesByTime(timeData ?? []);
    setSalesByPageType(pageTypeData ?? []);
    setSalesByChannel(channelData ?? []);
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
      // Meia-noite em Brasília (UTC-3, sem horário de verão desde 2019) —
      // não pode usar o fuso do navegador de quem está olhando o painel,
      // senão "Hoje" fica errado pra quem acessa de fora do Brasil.
      const brasiliaDateStr = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      from.setTime(new Date(`${brasiliaDateStr}T00:00:00-03:00`).getTime());
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

  // Detalhe por trás de um KPI da Visão geral (clique no card) — mesmo tipo
  // de evento do card, com os mesmos filtros de fonte/atribuição já
  // aplicados nela, pra bater com o número mostrado no card.
  const kpiDetailEvents = useMemo(() => {
    if (!kpiDetailType) return [];
    let rows = events.filter((e) => e.event_type === kpiDetailType);
    if (sourceFilter !== "all") rows = rows.filter((e) => e.utm_source === sourceFilter);
    if (hideUnattributed) rows = rows.filter((e) => e.lead_id !== null);
    return rows;
  }, [events, kpiDetailType, sourceFilter, hideUnattributed]);

  const KPI_DETAIL_LABEL: Record<string, string> = {
    page_view: "Leads",
    purchase: "Compras do curso",
    contract_signed: "Contratos assinados",
    members_access: "Área de membros",
    tool_signup: "Cadastros no Pepe",
    broker_signup: "Cadastros na corretora",
    broker_deposit: "Depósitos",
  };

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
      contractsSigned: sumBy(filteredReport, "contracts_signed"),
      membersAccess: sumBy(filteredReport, "members_access"),
      toolSignups: sumBy(filteredReport, "tool_signups"),
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
    { label: "Contrato assinado", value: kpis.contractsSigned },
    { label: "Área de membros", value: kpis.membersAccess },
    { label: "Cadastro no Pepe", value: kpis.toolSignups },
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
  const salesByPageTypeChart = useMemo(
    () => salesByPageType.map((r) => ({ name: r.page_type, value: r.purchases })),
    [salesByPageType]
  );
  const salesByChannelChart = useMemo(
    () => salesByChannel.map((r) => ({ label: r.channel, value: r.revenue_cents })),
    [salesByChannel]
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

  const subTabs = analyticsSubTabsVisiveis(isAdmin);
  const listaDeAlunos = subTab === "alunos";

  // Mesma janela que o resto da aba usa, só que aplicada por pessoa em vez
  // de por evento — a conta fica no cliente porque a lista de alunos vem
  // inteira de uma vez e trocar de período não precisa de ida ao servidor.
  const janela = useMemo(() => {
    const { from, now } = periodRange(period);
    return { de: from.toISOString(), ate: now.toISOString() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  return (
    <div className="space-y-4">
      {/* ── Barra de filtros ──
          Vale pra todas as sub-abas, inclusive a lista de alunos: o período
          recorta quem entrou naquela janela. Os filtros de tráfego ficam
          desligados lá — a lista é por pessoa, e uma pessoa não tem uma
          origem só (ela pode ter chegado por um anúncio e comprado depois de
          voltar pelo direto). Desligado é melhor do que sumido: some da tela,
          e a impressão é de que a barra inteira parou de valer.  */}
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
              <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-text-muted">
                Fonte de tráfego
                {listaDeAlunos && (
                  <Tooltip text="Vale pros relatórios por campanha. A lista de alunos é por pessoa, e a mesma pessoa costuma passar por mais de uma origem antes de comprar." />
                )}
              </label>
              <Select
                value={listaDeAlunos ? "all" : sourceFilter}
                disabled={listaDeAlunos}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
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
                checked={hideUnattributed && !listaDeAlunos}
                disabled={listaDeAlunos}
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
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setRecarregarAlunos((n) => n + 1);
                fetchReport(period);
              }}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Atualizar
            </Button>
          </div>
        </div>
      </Card>

      <SubTabs tabs={subTabs} active={subTab} onChange={onSubTabChange} />

      {listaDeAlunos && isAdmin && (
        <AlunosPanel productId={productId} de={janela.de} ate={janela.ate} recarregar={recarregarAlunos} />
      )}

      {subTab === "visao" && (
        <div className="space-y-4">
          {/* ── Lucro em destaque ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <HeroStat
              label="Curso — faturamento (R$)"
              value={fmtBRL(kpis.purchaseRevenue)}
              sub={`${kpis.purchases} ${kpis.purchases === 1 ? "compra" : "compras"}`}
              lucro={profitCurso !== null ? { valor: fmtBRL(profitCurso), positivo: profitCurso >= 0 } : null}
              roas={roasCurso !== null ? `${roasCurso.toFixed(1)}x` : null}
              roi={roiCurso !== null ? `${roiCurso >= 0 ? "+" : ""}${(roiCurso * 100).toFixed(0)}%` : null}
            />
            <HeroStat
              label="Corretora — depósitos (US$)"
              value={fmtUSD(kpis.depositsTotal)}
              sub={
                <span className="inline-flex flex-wrap items-center gap-1">
                  {kpis.deposits} {kpis.deposits === 1 ? "depósito" : "depósitos"}
                  {depositsTotalBRL !== null && <span>· ≈ {fmtBRL(depositsTotalBRL)}</span>}
                  <Tooltip text="Depósito é sempre em dólar — convertido pra real na cotação atual só pra comparar com o gasto em anúncios, que é cobrado em real." />
                </span>
              }
              lucro={
                profitCorretora !== null ? { valor: fmtBRL(profitCorretora), positivo: profitCorretora >= 0 } : null
              }
              roas={roasCorretora !== null ? `${roasCorretora.toFixed(1)}x` : null}
              roi={roiCorretora !== null ? `${roiCorretora >= 0 ? "+" : ""}${(roiCorretora * 100).toFixed(0)}%` : null}
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

          {/* ── KPIs do funil (dado real, já capturado) ──
              São 8 cards: em 6 colunas sobrava uma segunda fileira com dois
              cards soltos. 4 e 8 dividem certo. */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
            <KpiTile
              icon={Users}
              label="Leads"
              value={String(kpis.leads)}
              onClick={() => setKpiDetailType("page_view")}
            />
            <KpiTile
              icon={ShoppingCart}
              label="Compras do curso"
              value={String(kpis.purchases)}
              sub={fmtBRL(kpis.purchaseRevenue)}
              onClick={() => setKpiDetailType("purchase")}
            />
            <KpiTile
              icon={FileSignature}
              label="Contratos assinados"
              value={String(kpis.contractsSigned)}
              onClick={() => setKpiDetailType("contract_signed")}
            />
            <KpiTile
              icon={GraduationCap}
              label="Área de membros"
              value={String(kpis.membersAccess)}
              onClick={() => setKpiDetailType("members_access")}
            />
            <KpiTile
              icon={Sparkles}
              label="Cadastros no Pepe"
              value={String(kpis.toolSignups)}
              onClick={() => setKpiDetailType("tool_signup")}
            />
            <KpiTile
              icon={Landmark}
              label="Cadastros corretora"
              value={String(kpis.brokerSignups)}
              onClick={() => setKpiDetailType("broker_signup")}
            />
            <KpiTile
              icon={Wallet}
              label="Depósitos"
              value={String(kpis.deposits)}
              sub={fmtUSD(kpis.depositsTotal)}
              tone="success"
              onClick={() => setKpiDetailType("broker_deposit")}
            />
            <KpiTile
              icon={TrendingUp}
              label="Ticket médio depósito"
              value={fmtUSD(kpis.deposits > 0 ? Math.round(kpis.depositsTotal / kpis.deposits) : 0)}
              tone="accent"
              onClick={() => setKpiDetailType("broker_deposit")}
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

          {/* ── Vendas por tipo de página e por canal ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-1 flex items-center gap-1.5 text-base font-semibold text-text-primary">
                Vendas por tipo de página
                <Tooltip text="Usa o utm_medium do link — preenche isso no Gerador de UTMs com o tipo de página (ex: quiz, remarketing, vsl) pra aparecer aqui. Só conta compra que bateu com um lead." />
              </h3>
              <DynamicPieChart data={salesByPageTypeChart} innerRadius={55} unit="count" />
            </Card>
            <Card className="p-5">
              <h3 className="mb-1 flex items-center gap-1.5 text-base font-semibold text-text-primary">
                Vendas por canal
                <Tooltip text="Usa o utm_content do link — preenche isso no Gerador de UTMs com o canal onde postou (ex: bio instagram, descrição youtube) pra aparecer aqui. Só conta compra que bateu com um lead." />
              </h3>
              <HorizontalBarList data={salesByChannelChart} valueFormatter={(v) => fmtBRL(v)} colorFor={colorForLabel} />
            </Card>
          </div>

          {/* ── Adoção do Pepe ── */}
          <Card className="p-5">
            <h3 className="mb-1 flex items-center gap-1.5 text-base font-semibold text-text-primary">
              Pepe — cadastros por plano
              <Tooltip text="Quantos alunos criaram conta na ferramenta e quantos realmente entraram. O plano é o que o próprio Pepe conhece da pessoa; se divergir da compra, é sinal de que os dois sistemas estão fora de sincronia." />
            </h3>
            {pepePorPlano.length === 0 ? (
              <p className="mt-3 text-sm text-text-muted">
                Nenhum cadastro no Pepe ainda neste período.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-text-muted">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Plano</th>
                      <th className="py-2 pr-3 font-medium">Cadastraram</th>
                      <th className="py-2 pr-3 font-medium">Acessaram</th>
                      <th className="py-2 font-medium">Nunca entraram</th>
                    </tr>
                  </thead>
                  <tbody className="text-text-secondary">
                    {pepePorPlano.map((r) => (
                      <tr key={r.plano}>
                        <td className="py-2 pr-3 text-text-primary">{r.plano}</td>
                        <td className="py-2 pr-3">{r.cadastrados}</td>
                        <td className="py-2 pr-3">{r.acessaram}</td>
                        <td className="py-2">{Math.max(0, r.cadastrados - r.acessaram)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

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
          <EventsTable events={filteredEvents} />
        </Card>
      )}

      {kpiDetailType && (
        <Modal
          open={kpiDetailType !== null}
          onClose={() => setKpiDetailType(null)}
          title={KPI_DETAIL_LABEL[kpiDetailType] ?? kpiDetailType}
          className="max-w-5xl"
        >
          <p className="mb-3 text-xs text-text-muted">
            {kpiDetailEvents.length} evento{kpiDetailEvents.length === 1 ? "" : "s"} — mesmo filtro de fonte/atribuição
            da Visão geral, período {PERIOD_OPTIONS.find((o) => o.key === period)?.label}.
          </p>
          <EventsTable events={kpiDetailEvents} />
        </Modal>
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
  onClick,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
  tone?: "accent" | "success";
  onClick?: () => void;
}) {
  const content = (
    <>
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
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-xl bg-card-hover p-3 text-left shadow-card-sm transition-shadow hover:shadow-[0_0_0_1px_var(--accent)]"
      >
        {content}
      </button>
    );
  }

  return <div className="rounded-xl bg-card-hover p-3">{content}</div>;
}

// Tabela de eventos compartilhada entre "Eventos recentes" e o popup de
// detalhe de um KPI da Visão geral (mesmas colunas nos dois lugares).
function EventsTable({ events }: { events: RecentEvent[] }) {
  if (events.length === 0) {
    return <p className="text-xs text-text-muted">Nenhum evento nesse período/tipo.</p>;
  }
  return (
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
          {events.map((e) => (
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
  );
}

/**
 * Valor que entrou, e — só quando dá pra calcular — o que sobrou dele.
 *
 * O número grande é sempre o total faturado/depositado, que existe desde a
 * primeira venda. Lucro, ROAS e ROI dependem do gasto com anúncios estar
 * sincronizado em Contas Meta/Google, e por isso moram num bloco separado
 * que simplesmente não aparece enquanto não houver gasto. Antes o card
 * inteiro era o lucro: sem gasto sincronizado ele mostrava "—" e escondia
 * junto o faturamento, que já era conhecido.
 *
 * A cor verde/vermelha fica no lucro, não no total: faturamento não tem
 * sinal, só tamanho.
 */
function HeroStat({
  label,
  value,
  sub,
  lucro,
  roas,
  roi,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  /** null enquanto não houver gasto sincronizado pra descontar. */
  lucro: { valor: string; positivo: boolean } | null;
  roas: string | null;
  roi: string | null;
}) {
  return (
    <div className="rounded-xl bg-card-hover p-5 shadow-card-sm">
      <p className="mb-1 text-xs font-medium text-text-muted">{label}</p>
      <p className="text-3xl font-bold text-text-primary">{value}</p>
      {sub && <div className="mt-1 text-[11px] text-text-muted">{sub}</div>}

      {lucro ? (
        <div className="mt-4 rounded-lg bg-card p-3">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-muted">Lucro</p>
              <p className={cn("text-base font-bold", lucro.positivo ? "text-success" : "text-danger")}>
                {lucro.valor}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-muted">ROAS</p>
              <p className="text-base font-semibold text-text-primary">{roas ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-muted">ROI</p>
              <p className="text-base font-semibold text-text-primary">{roi ?? "—"}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-[10px] text-text-muted/70">
          Lucro, ROAS e ROI entram aqui quando o gasto com anúncios for sincronizado.
        </p>
      )}
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
