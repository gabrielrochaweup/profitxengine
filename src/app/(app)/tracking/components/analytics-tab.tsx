"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Users, ShoppingCart, GraduationCap, Landmark, Wallet, TrendingUp, Percent, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { AlunosPanel } from "./alunos-panel";
import {
  BarraDeFiltros,
  Bloco,
  Cartao,
  CartaoComTopo,
  CartaoDividido,
  Distribuicao,
  FiltroCampo,
  MetadeCartao,
  Ponto,
  Segmentado,
  Tabela,
  TabelaWrap,
  Td,
  Th,
  Tr,
  Vazio,
} from "./ui";
import { isSpecialBucket, SPECIAL_BUCKET_HELP } from "./baldes";
import {
  ETAPAS_FUNIL,
  Funil,
  maiorQueda,
  montarEtapasDoFunil,
  porcentagem,
  type LinhaFunil,
} from "./funil";
import { MatrizDeOrigem } from "./origem";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { SimpleBarChart, ConversionFunnel, HorizontalBarList, colorForLabel } from "../../analytics/components/charts";

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

/**
 * As quatro perguntas que os gráficos de horário respondem.
 *
 * Um seletor em vez de quatro pares de gráficos empilhados: são os mesmos
 * eixos, a mesma janela e o mesmo filtro de fonte — só muda o que se conta.
 */
const METRICAS_DE_TEMPO = [
  { key: "lead", label: "Leads" },
  { key: "purchase", label: "Compras" },
  { key: "broker_signup", label: "Corretora" },
  { key: "broker_deposit", label: "Depósitos" },
] as const;

type MetricaTempo = (typeof METRICAS_DE_TEMPO)[number]["key"];

interface LinhaAtividade {
  utm_source: string;
  etapa: string;
  weekday: number;
  hour: number;
  total: number;
}

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

/**
 * Os quatro recortes de Performance, na hierarquia que o gestor de tráfego já
 * usa: conta → campanha → conjunto → anúncio.
 *
 * Só "campanhas" tem dado hoje — os outros três dependem do gasto vindo do
 * Meta/Google Ads. Continuam clicáveis: a tela explica o que falta, o que é
 * mais útil do que um botão morto com tooltip. Sumir com eles esconderia a
 * hierarquia inteira e faria parecer que o produto só sabe campanha.
 */
export const PERFORMANCE_SUB_TABS = [
  { key: "contas", label: "Contas" },
  { key: "campanhas", label: "Campanhas" },
  { key: "conjuntos", label: "Conjuntos" },
  { key: "anuncios", label: "Anúncios" },
] as const;

export type TableTab = (typeof PERFORMANCE_SUB_TABS)[number]["key"];

export const MOTIVO_SEM_DADO = "Disponível depois de conectar Meta Ads / Google Ads";

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

// A barra de sub-abas mora no TrackingClient (é uma barra só pro módulo
// inteiro); aqui só chega qual delas está ativa.
export function AnalyticsTab({
  productId,
  initialReport,
  initialEvents,
  isAdmin,
  subTab,
  tableTab = "campanhas",
}: {
  productId: string;
  initialReport: CampaignRow[];
  initialEvents: RecentEvent[];
  isAdmin: boolean;
  subTab: AnalyticsSubTab;
  /** Qual recorte de Performance mostrar. Quem manda é a barra do módulo. */
  tableTab?: TableTab;
}) {
  const [period, setPeriod] = useState<Period>("90d");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [hideUnattributed, setHideUnattributed] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [report, setReport] = useState<CampaignRow[]>(initialReport);
  const [events, setEvents] = useState<RecentEvent[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
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
  // Leitura própria do funil (pessoas, não eventos) e atividade por hora de
  // qualquer etapa — as duas vêm das funções criadas na 0108.
  const [funilLinhas, setFunilLinhas] = useState<LinhaFunil[]>([]);
  const [atividade, setAtividade] = useState<LinhaAtividade[]>([]);
  const [etapaSelecionada, setEtapaSelecionada] = useState<string | null>(null);
  const [metricaTempo, setMetricaTempo] = useState<MetricaTempo>("purchase");
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
    const [
      { data: offerData },
      { data: paymentData },
      { data: pageTypeData },
      { data: channelData },
      { data: funilData },
      { data: atividadeData },
    ] = await Promise.all([
      supabase.rpc("tracking_sales_by_offer", params),
      supabase.rpc("tracking_sales_by_payment_method", params),
      supabase.rpc("tracking_sales_by_page_type", params),
      supabase.rpc("tracking_sales_by_channel", params),
      supabase.rpc("tracking_funil_pessoas", params),
      // Substitui tracking_sales_by_time: a mesma leitura, mas de qualquer
      // etapa e com a origem junto, que é o que o seletor de métrica e o
      // filtro de fonte precisam.
      supabase.rpc("tracking_atividade_por_horario", params),
    ]);

    const { data: pepeData } = await supabase.rpc("tracking_ferramenta_por_plano", { ...params, p_source: "pepe" });
    setPepePorPlano(pepeData ?? []);
    setSalesByOffer(offerData ?? []);
    setSalesByPayment(paymentData ?? []);
    setSalesByPageType(pageTypeData ?? []);
    setSalesByChannel(channelData ?? []);
    setFunilLinhas(funilData ?? []);
    setAtividade(atividadeData ?? []);
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
    initiate_checkout: "Iniciou checkout",
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

  /* ── O funil, contado em pessoas ──
     Mesmo recorte de fonte/atribuição do resto da aba: sem isso, o funil e a
     tabela abaixo dele estariam falando de universos diferentes na mesma
     tela. */
  const funilFiltrado = useMemo(() => {
    let rows = sourceFilter === "all" ? funilLinhas : funilLinhas.filter((r) => r.utm_source === sourceFilter);
    if (hideUnattributed) rows = rows.filter((r) => !isSpecialBucket(r.utm_source));
    return rows;
  }, [funilLinhas, sourceFilter, hideUnattributed]);

  const etapasDoFunil = useMemo(() => montarEtapasDoFunil(funilFiltrado), [funilFiltrado]);
  const piorEtapa = useMemo(() => maiorQueda(etapasDoFunil), [etapasDoFunil]);

  /**
   * A linha de apoio de um KPI: quantas PESSOAS e que fatia dos leads elas
   * são. O número grande do cartão continua sendo o do negócio (compras
   * aconteceram, dólares entraram) — aqui embaixo vai quem chegou.
   *
   * Some quando não dá pra saber: evento sem lead ligado não vira pessoa, e
   * inventar uma porcentagem aqui seria pior do que não mostrar nada.
   */
  function apoioDaEtapa(chave: string): string | undefined {
    const e = etapasDoFunil.find((x) => x.chave === chave);
    if (!e || e.pessoas === null || e.fracaoDeLeads === null) return undefined;
    return `${e.pessoas} ${e.pessoas === 1 ? "pessoa" : "pessoas"} · ${porcentagem(e.fracaoDeLeads)} dos leads`;
  }

  // Escolher uma etapa no funil também aponta os gráficos de horário pra
  // ela, quando existe métrica correspondente: "focar a análise nesta etapa"
  // sem precisar repetir a escolha num segundo controle. Trocar a métrica na
  // mão depois continua valendo.
  useEffect(() => {
    if (!etapaSelecionada) return;
    if (METRICAS_DE_TEMPO.some((m) => m.key === etapaSelecionada)) {
      setMetricaTempo(etapaSelecionada as MetricaTempo);
    }
  }, [etapaSelecionada]);

  const atividadeFiltrada = useMemo(() => {
    let rows = sourceFilter === "all" ? atividade : atividade.filter((r) => r.utm_source === sourceFilter);
    if (hideUnattributed) rows = rows.filter((r) => !isSpecialBucket(r.utm_source));
    return rows.filter((r) => r.etapa === metricaTempo);
  }, [atividade, sourceFilter, hideUnattributed, metricaTempo]);

  /*
    Os dois funis detalhados, curso e corretora.

    Eles divergem logo depois de "Leads" — quem compra o curso e quem abre
    conta na corretora são dois caminhos, não duas etapas do mesmo caminho —
    e é isso que o desenho lado a lado mostra e a grade de oito cartões não
    mostra.

    O valor vem do mesmo lugar que o card equivalente lá em cima (pessoa
    quando dá pra contar, evento quando não dá). Alimentar estes daqui com o
    contador de eventos faria a mesma etapa aparecer com dois números
    diferentes na mesma tela, a 200px de distância.
  */
  const valorDaEtapa = useMemo(() => {
    const porChave = new Map(etapasDoFunil.map((e) => [e.chave, e.pessoas ?? e.eventos]));
    return (chave: string) => porChave.get(chave) ?? 0;
  }, [etapasDoFunil]);

  const funilDoCurso = useMemo(
    () => [
      { label: "Leads", value: valorDaEtapa("lead") },
      { label: "Iniciou checkout", value: valorDaEtapa("initiate_checkout") },
      { label: "Compra do curso", value: valorDaEtapa("purchase") },
    ],
    [valorDaEtapa]
  );

  const funilDaCorretora = useMemo(
    () => [
      { label: "Leads", value: valorDaEtapa("lead") },
      { label: "Cadastro na corretora", value: valorDaEtapa("broker_signup") },
      { label: "Depósito", value: valorDaEtapa("broker_deposit") },
    ],
    [valorDaEtapa]
  );

  const distribuicaoPorProduto = useMemo(
    () => salesByOffer.map((r) => ({ label: r.offer_name, valor: r.purchases })),
    [salesByOffer]
  );
  const distribuicaoPorPagamento = useMemo(
    () => salesByPayment.map((r) => ({ label: r.payment_method, valor: r.purchases })),
    [salesByPayment]
  );
  const distribuicaoPorTipoDePagina = useMemo(
    () => salesByPageType.map((r) => ({ label: r.page_type, valor: r.purchases })),
    [salesByPageType]
  );
  const distribuicaoPorCanal = useMemo(
    () => salesByChannel.map((r) => ({ label: r.channel, valor: r.revenue_cents })),
    [salesByChannel]
  );

  const porHoraChart = useMemo(() => {
    const byHour = new Array(24).fill(0);
    atividadeFiltrada.forEach((r) => {
      byHour[r.hour] += Number(r.total) || 0;
    });
    return byHour.map((value, hour) => ({ label: `${String(hour).padStart(2, "0")}h`, value }));
  }, [atividadeFiltrada]);

  const porDiaChart = useMemo(() => {
    const byWeekday = new Array(7).fill(0);
    atividadeFiltrada.forEach((r) => {
      byWeekday[r.weekday] += Number(r.total) || 0;
    });
    return WEEKDAY_DISPLAY_ORDER.map((dow) => ({ label: WEEKDAY_LABELS[dow], value: byWeekday[dow] }));
  }, [atividadeFiltrada]);

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
    <div className="space-y-6">
      {/* ── Barra de filtros ──
          Vale pra todas as sub-abas, inclusive a lista de alunos: o período
          recorta quem entrou naquela janela. Os filtros de tráfego ficam
          desligados lá — a lista é por pessoa, e uma pessoa não tem uma
          origem só (ela pode ter chegado por um anúncio e comprado depois de
          voltar pelo direto). Desligado é melhor do que sumido: some da tela,
          e a impressão é de que a barra inteira parou de valer.

          Era um cartão de 110px de altura pra guardar quatro controles. Virou
          uma faixa: rótulo ao lado do controle, tudo na mesma linha, e o
          "Atualizar" — que é parte do mesmo assunto — na ponta direita dela
          em vez de flutuando sozinho. */}
      <BarraDeFiltros
        direita={
          <>
            <span className="text-[11px] text-text-tertiary">
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
          </>
        }
      >
        <Segmentado opcoes={PERIOD_OPTIONS} ativo={period} onChange={changePeriod} disabled={loading} />

        <FiltroCampo
          label="Fonte"
          dica={
            listaDeAlunos ? (
              <Tooltip text="Vale pros relatórios por campanha. A lista de alunos é por pessoa, e a mesma pessoa costuma passar por mais de uma origem antes de comprar." />
            ) : undefined
          }
        >
          <Select
            value={listaDeAlunos ? "all" : sourceFilter}
            disabled={listaDeAlunos}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-8 w-36 text-xs"
          >
            <option value="all">Qualquer</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </FiltroCampo>

        <FiltroCampo
          label="Plataforma"
          dica={<Tooltip text="Disponível depois de conectar Meta Ads / Google Ads e sincronizar o gasto." />}
        >
          <Select disabled value="all" className="h-8 w-32 text-xs">
            <option value="all">Qualquer</option>
          </Select>
        </FiltroCampo>

        <FiltroCampo
          label="Conta"
          dica={<Tooltip text="Disponível depois de conectar Meta Ads / Google Ads e sincronizar o gasto." />}
        >
          <Select disabled value="all" className="h-8 w-32 text-xs">
            <option value="all">Qualquer</option>
          </Select>
        </FiltroCampo>

        <label className="flex items-center gap-2 text-[11px] text-text-secondary">
          <input
            type="checkbox"
            checked={hideUnattributed && !listaDeAlunos}
            disabled={listaDeAlunos}
            onChange={(e) => setHideUnattributed(e.target.checked)}
            className="h-3.5 w-3.5 accent-accent"
          />
          Ocultar não atribuído
        </label>
      </BarraDeFiltros>

      {listaDeAlunos && isAdmin && (
        <AlunosPanel productId={productId} de={janela.de} ate={janela.ate} recarregar={recarregarAlunos} />
      )}

      {subTab === "visao" && (
        <div className="space-y-8">
          {/* ── A. Resultado financeiro ──
              Abre a página: quanto entrou e o que sobrou. O funil explica
              COMO isso aconteceu, e explicação vem depois do resultado.
              Lucro, ROAS e ROI só aparecem com gasto sincronizado. */}
          <Bloco titulo="Resultado financeiro">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_200px]">
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

              <div className="flex flex-col gap-3">
                <FinanceTile
                  label="Gasto com anúncios"
                  value={hasSpend ? fmtBRL(kpis.spend) : "—"}
                  hint={hasSpend ? "Base dos ROIs ao lado" : "Sincronize em Contas Meta/Google"}
                />
                <FinanceTile
                  label="Cotação USD/BRL"
                  value={usdBrlRate !== null ? `R$ ${usdBrlRate.toFixed(2)}` : "—"}
                  hint={usdBrlRateUpdatedAt ? `Atualizada ${usdBrlRateUpdatedAt}` : "Carregando..."}
                />
              </div>
            </div>
          </Bloco>

          {/* ── B. KPIs principais ──
              A faixa que responde as cinco primeiras perguntas do gestor sem
              rolar a página. Oito células numa superfície só: o contorno vem
              do fio da grade, não de oito cartões.

              O valor é o do NEGÓCIO (compras aconteceram, dólares entraram);
              a linha de apoio é a de PESSOAS, que é o que o funil conta.
              Quando os dois divergem, o texto diz qual é qual em vez de
              escolher um e esconder o outro. */}
          <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-card bg-card shadow-card sm:grid-cols-4 xl:grid-cols-8 xl:divide-y-0">
            <KpiTile
              icon={Users}
              label="Leads"
              value={String(kpis.leads)}
              sub="únicos no período"
              onClick={() => setKpiDetailType("page_view")}
            />
            <KpiTile
              icon={ShoppingCart}
              label="Checkout"
              value={String(kpis.initiateCheckouts)}
              sub={apoioDaEtapa("initiate_checkout")}
              onClick={() => setKpiDetailType("initiate_checkout")}
            />
            <KpiTile
              icon={GraduationCap}
              label="Compras"
              value={String(kpis.purchases)}
              sub={apoioDaEtapa("purchase")}
              onClick={() => setKpiDetailType("purchase")}
            />
            <KpiTile
              icon={TrendingUp}
              label="Receita do curso"
              destaque
              value={fmtBRL(kpis.purchaseRevenue)}
              sub={kpis.purchases > 0 ? `${fmtBRL(Math.round(kpis.purchaseRevenue / kpis.purchases))} por venda` : undefined}
            />
            <KpiTile
              icon={Landmark}
              label="Cadastros corretora"
              value={String(kpis.brokerSignups)}
              sub={apoioDaEtapa("broker_signup")}
              onClick={() => setKpiDetailType("broker_signup")}
            />
            <KpiTile
              icon={Wallet}
              label="Depósitos"
              value={String(kpis.deposits)}
              sub={apoioDaEtapa("broker_deposit")}
              tone="success"
              onClick={() => setKpiDetailType("broker_deposit")}
            />
            <KpiTile
              icon={Wallet}
              label="Total depositado"
              destaque
              value={fmtUSD(kpis.depositsTotal)}
              sub={depositsTotalBRL !== null ? `≈ ${fmtBRL(depositsTotalBRL)}` : undefined}
              tone="success"
            />
            <KpiTile
              icon={Percent}
              label="Ticket médio depósito"
              value={fmtUSD(kpis.deposits > 0 ? Math.round(kpis.depositsTotal / kpis.deposits) : 0)}
              sub="por depósito"
              tone="accent"
            />
          </div>

          {/* ── C. Funil completo ──
              A espinha dorsal da página: as oito etapas na ordem da jornada,
              em duas linhas de quatro. Clicar numa etapa foca a matriz de
              origem e os gráficos de horário nela. */}
          <Bloco
            titulo="Funil"
            dica={
              <Tooltip text="Cada etapa mostra quantas PESSOAS distintas chegaram nela. A contagem de eventos aparece do lado quando os dois diferem — acesso à área de membros, por exemplo, repete a mesma pessoa várias vezes." />
            }
            acoes={
              etapaSelecionada ? (
                <button
                  type="button"
                  onClick={() => setEtapaSelecionada(null)}
                  className="text-[11px] text-accent-text hover:underline"
                >
                  Limpar seleção
                </button>
              ) : (
                <span className="text-[11px] text-text-muted">Clique numa etapa pra focar a análise nela</span>
              )
            }
          >
            <Funil etapas={etapasDoFunil} selecionada={etapaSelecionada} onSelecionar={setEtapaSelecionada} />

            {/* Os dois caminhos que saem de "Leads", um ao lado do outro. */}
            <CartaoDividido className="mt-4">
              <MetadeCartao>
                <p className="mb-1 text-[11px] font-medium text-text-tertiary">Funil do curso</p>
                <ConversionFunnel data={funilDoCurso} color="var(--accent-text)" />
              </MetadeCartao>
              <MetadeCartao>
                <p className="mb-1 text-[11px] font-medium text-text-tertiary">Funil da corretora</p>
                <ConversionFunnel data={funilDaCorretora} color="var(--success)" />
              </MetadeCartao>
            </CartaoDividido>

            {piorEtapa && piorEtapa.fracaoDaAnterior !== null && (
              <p className="mt-2 text-[11px] text-text-tertiary">
                Maior perda entre etapas:{" "}
                <span className="font-medium text-text-secondary">
                  {piorEtapa.rotuloAnterior} → {piorEtapa.rotulo}
                </span>
                , onde passaram {porcentagem(piorEtapa.fracaoDaAnterior)} das pessoas.
              </p>
            )}
          </Bloco>

          {/* ── D. De onde vêm os resultados ──
              Uma matriz no lugar de quatro recortes soltos (leads por fonte,
              depósitos por fonte, depósitos por campanha, vendas por UTM):
              a linha inteira, da entrada ao depósito, e a campanha por baixo
              quando se pede. */}
          <Bloco
            titulo="De onde vêm os resultados"
            dica={
              <Tooltip text="Uma linha por origem, com a progressão até o depósito. Clique na origem pra abrir as campanhas dela." />
            }
            acoes={
              etapaSelecionada ? (
                <span className="text-[11px] text-text-tertiary">
                  Ordenado por{" "}
                  <span className="text-accent-text">
                    {ETAPAS_FUNIL.find((e) => e.chave === etapaSelecionada)?.rotulo}
                  </span>
                </span>
              ) : undefined
            }
          >
            <CartaoComTopo
              titulo={`${filteredReport.length} ${filteredReport.length === 1 ? "campanha" : "campanhas"} · ordenado por ${
                etapaSelecionada
                  ? (ETAPAS_FUNIL.find((e) => e.chave === etapaSelecionada)?.rotulo ?? "").toLowerCase()
                  : "total depositado"
              }`}
            >
              <MatrizDeOrigem
                linhas={filteredReport}
                etapaSelecionada={etapaSelecionada}
                fmtBRL={fmtBRL}
                fmtUSD={fmtUSD}
              />
            </CartaoComTopo>
          </Bloco>

          {/* ── E. Quando os resultados acontecem ──
              Os mesmos dois gráficos respondendo quatro perguntas: a métrica
              é um seletor, não quatro componentes iguais empilhados. */}
          <Bloco
            titulo="Quando os resultados acontecem"
            acoes={
              <Segmentado
                opcoes={METRICAS_DE_TEMPO}
                ativo={metricaTempo}
                onChange={(k) => setMetricaTempo(k)}
              />
            }
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <CartaoComTopo titulo="Por horário">
                <SimpleBarChart
                  data={porHoraChart}
                  valueLabel={METRICAS_DE_TEMPO.find((m) => m.key === metricaTempo)?.label ?? ""}
                  color="var(--accent-text)"
                />
              </CartaoComTopo>
              <CartaoComTopo titulo="Por dia da semana">
                <SimpleBarChart
                  data={porDiaChart}
                  valueLabel={METRICAS_DE_TEMPO.find((m) => m.key === metricaTempo)?.label ?? ""}
                  color="var(--accent-pink)"
                />
              </CartaoComTopo>
            </div>
          </Bloco>

          {/* ── F. Detalhamentos secundários ──
              Importantes, mas não podem competir com o funil: viraram quatro
              distribuições compactas numa superfície só. Eram quatro donuts
              de 260px — um deles pra mostrar uma categoria única. */}
          <Bloco titulo="Detalhes das vendas">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <CartaoComTopo titulo="Por produto">
                <Distribuicao dados={distribuicaoPorProduto} vazio="Nenhuma venda nesse período." />
              </CartaoComTopo>
              <CartaoComTopo
                titulo="Por método de pagamento"
                dica={
                  <Tooltip text="Só a Onprofit manda esse dado por enquanto (Cartão de crédito/Pix) — outras plataformas caem em '(não identificado)' até termos esse campo confirmado com elas também." />
                }
              >
                <Distribuicao dados={distribuicaoPorPagamento} vazio="Nenhuma venda nesse período." />
              </CartaoComTopo>
              <CartaoComTopo
                titulo="Por tipo de página"
                dica={
                  <Tooltip text="Usa o utm_medium do link — preenche isso no Gerador de UTMs com o tipo de página (ex: quiz, remarketing, vsl) pra aparecer aqui. Só conta compra que bateu com um lead." />
                }
              >
                <Distribuicao dados={distribuicaoPorTipoDePagina} vazio="Nenhuma venda com tipo de página no link." />
              </CartaoComTopo>
              <CartaoComTopo
                titulo="Por canal — receita"
                dica={
                  <Tooltip text="Usa o utm_content do link — preenche isso no Gerador de UTMs com o canal onde postou (ex: bio instagram, descrição youtube) pra aparecer aqui. Só conta compra que bateu com um lead." />
                }
              >
                <Distribuicao
                  dados={distribuicaoPorCanal}
                  formatar={(v) => fmtBRL(v)}
                  vazio="Nenhuma venda com canal no link."
                />
              </CartaoComTopo>
            </div>
          </Bloco>

          {/* ── Pepe ──
              Ligado à etapa "Cadastro no Pepe" do funil. Sem cadastro no
              período vira uma linha, não um cartão vazio de 200px. */}
          {pepePorPlano.length === 0 ? (
            <p className="text-[11px] text-text-tertiary">
              <span className="font-medium text-text-secondary">Pepe</span> — nenhum cadastro no período.
            </p>
          ) : (
            <Bloco
              titulo="Pepe — cadastros por plano"
              dica={
                <Tooltip text="Quantos alunos criaram conta na ferramenta e quantos realmente entraram. O plano é o que o próprio Pepe conhece da pessoa; se divergir da compra, é sinal de que os dois sistemas estão fora de sincronia." />
              }
            >
              <Cartao>
                <TabelaWrap>
                  <Tabela>
                    <thead>
                      <tr className="border-b border-border">
                        <Th>Plano</Th>
                        <Th num>Cadastraram</Th>
                        <Th num>Acessaram</Th>
                        <Th num>Nunca entraram</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {pepePorPlano.map((r) => (
                        <Tr key={r.plano}>
                          <Td forte>{r.plano}</Td>
                          <Td num>{r.cadastrados}</Td>
                          <Td num>{r.acessaram}</Td>
                          <Td num>{Math.max(0, r.cadastrados - r.acessaram)}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Tabela>
                </TabelaWrap>
              </Cartao>
            </Bloco>
          )}
        </div>
      )}
      {subTab === "campanhas" && tableTab !== "campanhas" && (
        <Bloco titulo={PERFORMANCE_SUB_TABS.find((t) => t.key === tableTab)?.label ?? ""}>
          <Cartao>
            {/* Nada inventado: esse recorte só existe com o gasto vindo da
                plataforma, e é isso que a tela diz. */}
            <Vazio>
              {MOTIVO_SEM_DADO}. Até lá, o resultado por campanha está em{" "}
              <span className="text-text-secondary">Performance → Campanhas</span>.
            </Vazio>
          </Cartao>
        </Bloco>
      )}

      {subTab === "campanhas" && tableTab === "campanhas" && (
        <div className="space-y-6">
          <Bloco titulo="Vendas por UTM/campanha (top 10)">
            <Cartao>
              <HorizontalBarList data={salesByUtm} valueFormatter={(v) => fmtBRL(v)} colorFor={colorForLabel} />
            </Cartao>
          </Bloco>

          {/* A tabela do recorte escolhido lá em cima, na barra do módulo. */}
          <div className="rounded-card bg-card shadow-card">
            <div className="p-4">
              {filteredReport.length === 0 ? (
                <Vazio>Sem dados suficientes nesse período.</Vazio>
              ) : (
                <TabelaWrap>
                  <Tabela>
                    <thead>
                      {/* Ordem das colunas = ordem da decisão: quem é a
                          campanha, quanto custou, quanto voltou. O resto do
                          funil continua na linha, com menos peso. */}
                      <tr className="border-b border-border">
                        <Th>Campanha</Th>
                        <Th num>Gasto</Th>
                        <Th num>Leads</Th>
                        <Th num>Compras</Th>
                        <Th num>Receita</Th>
                        <Th num>Depósitos</Th>
                        <Th num>Total depositado</Th>
                        <Th num>ROI curso</Th>
                        <Th num>ROI corretora</Th>
                        <Th num fraco>
                          Checkout
                        </Th>
                        <Th num fraco>
                          Membros
                        </Th>
                        <Th num fraco>
                          Corretora
                        </Th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReport.map((r) => {
                        const rowRoiCurso =
                          r.spend_cents > 0 ? (r.purchase_revenue_cents - r.spend_cents) / r.spend_cents : null;
                        const rowDepositsBRL =
                          usdBrlRate !== null ? Math.round(r.deposits_total_cents * usdBrlRate) : null;
                        const rowRoiCorretora =
                          r.spend_cents > 0 && rowDepositsBRL !== null
                            ? (rowDepositsBRL - r.spend_cents) / r.spend_cents
                            : null;
                        return (
                          <Tr key={`${r.utm_source}-${r.utm_campaign}`}>
                            {/* Origem e campanha numa célula só, em duas
                                linhas: era uma coluna inteira repetindo
                                "facebook" trinta vezes e empurrando o
                                dinheiro pra fora da tela. */}
                            <Td className="max-w-[260px]">
                              <span className="block truncate font-medium text-text-primary" title={r.utm_campaign}>
                                {isSpecialBucket(r.utm_campaign) ? (
                                  <span className="inline-flex items-center gap-1 italic text-text-tertiary">
                                    {r.utm_campaign}
                                    <Tooltip text={SPECIAL_BUCKET_HELP[r.utm_campaign]} />
                                  </span>
                                ) : (
                                  r.utm_campaign
                                )}
                              </span>
                              <span className="block truncate text-[11px] text-text-tertiary" title={r.utm_source}>
                                {isSpecialBucket(r.utm_source) ? (
                                  <span className="inline-flex items-center gap-1 italic">
                                    {r.utm_source}
                                    <Tooltip text={SPECIAL_BUCKET_HELP[r.utm_source]} />
                                  </span>
                                ) : (
                                  r.utm_source
                                )}
                              </span>
                            </Td>
                            <Td num>{r.spend_cents > 0 ? fmtBRL(r.spend_cents) : "—"}</Td>
                            <Td num>{r.leads}</Td>
                            <Td num>{r.purchases}</Td>
                            <Td num forte>
                              {fmtBRL(r.purchase_revenue_cents)}
                            </Td>
                            <Td num>{r.deposits}</Td>
                            <Td num forte>
                              {fmtUSD(r.deposits_total_cents)}
                            </Td>
                            <Td num>
                              {rowRoiCurso !== null ? (
                                <span className={rowRoiCurso >= 0 ? "text-success" : "text-danger"}>
                                  {rowRoiCurso >= 0 ? "+" : ""}
                                  {(rowRoiCurso * 100).toFixed(0)}%
                                </span>
                              ) : (
                                "—"
                              )}
                            </Td>
                            <Td num>
                              {rowRoiCorretora !== null ? (
                                <span className={rowRoiCorretora >= 0 ? "text-success" : "text-danger"}>
                                  {rowRoiCorretora >= 0 ? "+" : ""}
                                  {(rowRoiCorretora * 100).toFixed(0)}%
                                </span>
                              ) : (
                                "—"
                              )}
                            </Td>
                            <Td num fraco>
                              {r.initiate_checkouts}
                            </Td>
                            <Td num fraco>
                              {r.members_access}
                            </Td>
                            <Td num fraco>
                              {r.broker_signups}
                            </Td>
                          </Tr>
                        );
                      })}
                    </tbody>
                  </Tabela>
                </TabelaWrap>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === "eventos" && (
        <Bloco
          titulo="Eventos recentes"
          acoes={
            <>
              <span className="text-[11px] text-text-tertiary">
                {filteredEvents.length} evento{filteredEvents.length === 1 ? "" : "s"} ·{" "}
                {PERIOD_OPTIONS.find((o) => o.key === period)?.label}
              </span>
              <Select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="h-8 w-52 text-xs"
              >
                {EVENT_TYPE_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </>
          }
        >
          <Cartao>
            <EventsTable events={filteredEvents} />
          </Cartao>
        </Bloco>
      )}

      {kpiDetailType && (
        <Modal
          open={kpiDetailType !== null}
          onClose={() => setKpiDetailType(null)}
          title={KPI_DETAIL_LABEL[kpiDetailType] ?? kpiDetailType}
          className="max-w-5xl"
        >
          <p className="mb-3 text-xs text-text-tertiary">
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
  destaque,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
  tone?: "accent" | "success";
  /** Fundo levemente distinto: separa o dinheiro das contagens na mesma faixa. */
  destaque?: boolean;
  onClick?: () => void;
}) {
  // Célula de uma faixa, não cartão solto: o contorno vem do fio da grade.
  // A hierarquia dentro dela é rótulo (11) → valor (17) → apoio (11).
  const content = (
    <>
      <div className="mb-1.5 flex items-center gap-1.5 text-text-tertiary">
        <Icon size={12} className="shrink-0" />
        <p className="truncate text-[11px]">{label}</p>
      </div>
      <p
        className={cn(
          "text-[17px] font-semibold leading-none tabular-nums",
          tone === "accent" ? "text-accent-text" : tone === "success" ? "text-success" : "text-text-primary"
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 truncate text-[11px] tabular-nums text-text-tertiary">{sub}</p>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "min-w-0 px-3 py-3 text-left transition-colors duration-150 hover:bg-card-hover",
          destaque && "bg-card-hover/40"
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={cn("min-w-0 px-3 py-3", destaque && "bg-card-hover/40")}>{content}</div>;
}

// Tabela de eventos compartilhada entre "Eventos recentes" e o popup de
// detalhe de um KPI da Visão geral (mesmas colunas nos dois lugares).
function EventsTable({ events }: { events: RecentEvent[] }) {
  if (events.length === 0) {
    return <Vazio>Nenhum evento nesse período/tipo.</Vazio>;
  }
  return (
    <TabelaWrap>
      <Tabela>
        <thead>
          <tr className="border-b border-border">
            <Th>Quando</Th>
            <Th>Tipo</Th>
            <Th>Origem</Th>
            <Th>E-mail</Th>
            <Th>Plano</Th>
            <Th num>Valor</Th>
            <Th>Campanha</Th>
            <Th>Lead</Th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <Tr key={e.id}>
              {/* Carimbo de hora em fonte de largura fixa: numa lista de 200
                  linhas, é o que deixa varrer a coluna sem ler cada uma. */}
              <Td fraco className="font-mono text-[11px]">
                {new Date(e.occurred_at).toLocaleString("pt-BR")}
              </Td>
              <Td forte>{EVENT_TYPE_LABEL[e.event_type] ?? e.event_type}</Td>
              <Td>{e.source}</Td>
              <Td className="max-w-[220px] truncate" title={e.email ?? undefined}>
                {e.email ?? "—"}
              </Td>
              <Td>{e.offer_name ?? "—"}</Td>
              <Td num forte={e.amount_cents != null}>
                {e.amount_cents != null
                  ? e.event_type === "broker_deposit"
                    ? fmtUSD(e.amount_cents)
                    : fmtBRL(e.amount_cents)
                  : "—"}
              </Td>
              <Td className="max-w-[240px] truncate" title={e.utm_source ? `${e.utm_source} · ${e.utm_campaign ?? "(sem campanha)"}` : undefined}>
                {e.utm_source ? `${e.utm_source} · ${e.utm_campaign ?? "(sem campanha)"}` : "—"}
              </Td>
              {/* Ponto em vez de selo: são 200 linhas, e 200 selos coloridos
                  deixam de destacar qualquer coisa. */}
              <Td>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Ponto tom={e.lead_id ? "ok" : "alerta"} />
                  <span className={e.lead_id ? "text-text-tertiary" : "text-warning"}>
                    {e.lead_id ? "Atribuído" : "Não atribuído"}
                  </span>
                </span>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Tabela>
    </TabelaWrap>
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
    // O bloco de lucro era um cartão dentro do cartão. Um fio separa igual e
    // não desenha mais uma caixa em volta de três números.
    <div className="rounded-card bg-card p-4 shadow-card">
      <p className="mb-1.5 text-[11px] font-medium text-text-tertiary">{label}</p>
      <p className="text-[30px] font-bold leading-none tabular-nums text-text-primary">{value}</p>
      {sub && <div className="mt-1.5 text-[11px] text-text-tertiary">{sub}</div>}

      {lucro ? (
        <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2 border-t border-border pt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-tertiary">Lucro</p>
            <p className={cn("text-[15px] font-bold tabular-nums", lucro.positivo ? "text-success" : "text-danger")}>
              {lucro.valor}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-tertiary">ROAS</p>
            <p className="text-[15px] font-semibold tabular-nums text-text-primary">{roas ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-tertiary">ROI</p>
            <p className="text-[15px] font-semibold tabular-nums text-text-primary">{roi ?? "—"}</p>
          </div>
        </div>
      ) : (
        <p className="mt-4 border-t border-border pt-3 text-[11px] text-text-muted">
          Lucro, ROAS e ROI entram aqui quando o gasto com anúncios for sincronizado.
        </p>
      )}
    </div>
  );
}

/** Indicador de apoio: mesma família dos heróis, peso deliberadamente menor. */
function FinanceTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex-1 rounded-card bg-card px-3 py-2.5 shadow-card">
      <div className="mb-1 flex items-center gap-1.5 text-text-tertiary">
        <Percent size={12} className="shrink-0" />
        <p className="truncate text-[11px]">{label}</p>
      </div>
      <p className="text-[15px] font-semibold tabular-nums text-text-secondary">{value}</p>
      <p className="mt-0.5 text-[10px] leading-snug text-text-muted">{hint}</p>
    </div>
  );
}
