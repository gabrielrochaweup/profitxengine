"use client";

import { useMemo, useState } from "react";
import {
  Users,
  ShoppingCart,
  GraduationCap,
  Landmark,
  Wallet,
  TrendingUp,
  Percent,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { SimpleBarChart } from "../analytics/components/charts";
import { WebhookEndpointsPanel, type WebhookEndpoint } from "./components/webhook-endpoints-panel";
import { TrackingScriptPanel } from "./components/tracking-script-panel";

interface CampaignRow {
  utm_source: string;
  utm_campaign: string;
  leads: number;
  purchases: number;
  purchase_revenue_cents: number;
  members_access: number;
  broker_signups: number;
  deposits: number;
  deposits_total_cents: number;
}

interface RecentEvent {
  id: string;
  event_type: string;
  source: string;
  email: string | null;
  amount_cents: number | null;
  currency: string;
  lead_id: string | null;
  occurred_at: string;
}

interface TrackingClientProps {
  productId: string;
  productSlug: string;
  initialReport: CampaignRow[];
  initialEvents: RecentEvent[];
  initialEndpoints: WebhookEndpoint[];
  isAdmin: boolean;
}

type Period = "7d" | "30d" | "90d" | "tudo";

const PERIOD_OPTIONS: { key: Period; label: string; days: number | null }[] = [
  { key: "7d", label: "7 dias", days: 7 },
  { key: "30d", label: "30 dias", days: 30 },
  { key: "90d", label: "90 dias", days: 90 },
  { key: "tudo", label: "Tudo", days: null },
];

const EVENT_TYPE_LABEL: Record<string, string> = {
  page_view: "Clique/landing",
  purchase: "Compra do curso",
  members_access: "Acesso à área de membros",
  broker_signup: "Cadastro na corretora",
  broker_deposit: "Depósito",
};

const TABLE_TABS = [
  { key: "contas", label: "Contas" },
  { key: "campanhas", label: "Campanhas" },
  { key: "conjuntos", label: "Conjuntos" },
  { key: "anuncios", label: "Anúncios" },
] as const;

type TableTab = (typeof TABLE_TABS)[number]["key"];

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function sumBy(rows: CampaignRow[], key: keyof CampaignRow): number {
  return rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
}

export function TrackingClient({
  productId,
  productSlug,
  initialReport,
  initialEvents,
  initialEndpoints,
  isAdmin,
}: TrackingClientProps) {
  const [period, setPeriod] = useState<Period>("90d");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [report, setReport] = useState<CampaignRow[]>(initialReport);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tableTab, setTableTab] = useState<TableTab>("campanhas");

  async function fetchReport(next: Period) {
    setLoading(true);
    const supabase = createClient();
    const now = new Date();
    const from = new Date(now);
    const option = PERIOD_OPTIONS.find((o) => o.key === next);
    from.setDate(from.getDate() - (option?.days ?? 3650));

    const { data } = await supabase.rpc("tracking_campaign_report", {
      p_product_id: productId,
      p_from: from.toISOString(),
      p_to: now.toISOString(),
    });
    setReport(data ?? []);
    setLastUpdated(new Date());
    setLoading(false);
  }

  async function changePeriod(next: Period) {
    setPeriod(next);
    await fetchReport(next);
  }

  const sources = useMemo(() => Array.from(new Set(report.map((r) => r.utm_source))).sort(), [report]);

  const filteredReport = useMemo(
    () => (sourceFilter === "all" ? report : report.filter((r) => r.utm_source === sourceFilter)),
    [report, sourceFilter]
  );

  const kpis = useMemo(
    () => ({
      leads: sumBy(filteredReport, "leads"),
      purchases: sumBy(filteredReport, "purchases"),
      purchaseRevenue: sumBy(filteredReport, "purchase_revenue_cents"),
      membersAccess: sumBy(filteredReport, "members_access"),
      brokerSignups: sumBy(filteredReport, "broker_signups"),
      deposits: sumBy(filteredReport, "deposits"),
      depositsTotal: sumBy(filteredReport, "deposits_total_cents"),
    }),
    [filteredReport]
  );

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
        .slice(0, 10)
        .map((r) => ({ label: `${r.utm_source} · ${r.utm_campaign}`, value: r.deposits_total_cents / 100 })),
    [filteredReport]
  );

  const funnelStages = [
    { label: "Leads", value: kpis.leads },
    { label: "Compra do curso", value: kpis.purchases },
    { label: "Área de membros", value: kpis.membersAccess },
    { label: "Cadastro na corretora", value: kpis.brokerSignups },
    { label: "Depósito", value: kpis.deposits },
  ];
  const maxStage = Math.max(1, ...funnelStages.map((s) => s.value));

  return (
    <div className="mt-4 space-y-4">
      <TrackingScriptPanel productSlug={productSlug} />

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
                        : "border border-border-strong text-text-secondary hover:bg-card-hover"
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
              <label className="mb-1 block text-[11px] font-medium text-text-muted">Plataforma</label>
              <Select disabled value="all" title="Disponível depois de conectar Meta Ads / Google Ads">
                <option value="all">Qualquer</option>
              </Select>
            </div>

            <div className="w-44">
              <label className="mb-1 block text-[11px] font-medium text-text-muted">Conta de anúncio</label>
              <Select disabled value="all" title="Disponível depois de conectar Meta Ads / Google Ads">
                <option value="all">Qualquer</option>
              </Select>
            </div>
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

      {/* ── Funil + KPIs financeiros ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-medium text-text-primary">Funil de conversão</h3>
          <div className="space-y-2">
            {funnelStages.map((stage) => (
              <div key={stage.label} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-xs text-text-secondary">{stage.label}</span>
                <div className="h-6 flex-1 overflow-hidden rounded-button bg-card-hover">
                  <div
                    className="h-full rounded-button bg-accent"
                    style={{ width: `${Math.max(2, (stage.value / maxStage) * 100)}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-medium text-text-primary">{stage.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <FinanceTile label="Gasto com anúncios" value="—" hint="Conecte Meta/Google Ads" />
          <FinanceTile label="ROAS" value="—" hint="Conecte Meta/Google Ads" />
          <FinanceTile label="ROI" value="—" hint="Conecte Meta/Google Ads" />
          <FinanceTile label="Lucro" value="—" hint="Conecte Meta/Google Ads" />
        </div>
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
          sub={fmtBRL(kpis.depositsTotal)}
          tone="success"
        />
        <KpiTile
          icon={TrendingUp}
          label="Ticket médio depósito"
          value={fmtBRL(kpis.deposits > 0 ? Math.round(kpis.depositsTotal / kpis.deposits) : 0)}
          tone="accent"
        />
      </div>

      {/* ── Por fonte ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-medium text-text-primary">Leads por fonte</h3>
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
          <h3 className="mb-3 text-sm font-medium text-text-primary">Depósitos por fonte</h3>
          {bySource.length === 0 ? (
            <p className="text-xs text-text-muted">Sem dados suficientes nesse período.</p>
          ) : (
            <ul className="space-y-2">
              {bySource.map((s) => (
                <li key={s.source} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{s.source}</span>
                  <span className="font-medium text-text-primary">{fmtBRL(s.depositsTotal)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-medium text-text-primary">Depósitos por campanha (top 10)</h3>
        <SimpleBarChart data={depositsByCampaign} valueLabel="Depósitos" isCurrency color="var(--success)" />
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
                    <th className="py-2 pr-3 font-medium">Compras curso</th>
                    <th className="py-2 pr-3 font-medium">Receita curso</th>
                    <th className="py-2 pr-3 font-medium">Área de membros</th>
                    <th className="py-2 pr-3 font-medium">Corretora</th>
                    <th className="py-2 pr-3 font-medium">Depósitos</th>
                    <th className="py-2 font-medium">Total depositado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReport.map((r) => (
                    <tr
                      key={`${r.utm_source}-${r.utm_campaign}`}
                      className="border-b border-border/50 text-text-secondary"
                    >
                      <td className="py-2 pr-3 whitespace-nowrap">{r.utm_source}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{r.utm_campaign}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{r.leads}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{r.purchases}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{fmtBRL(r.purchase_revenue_cents)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{r.members_access}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{r.broker_signups}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{r.deposits}</td>
                      <td className="py-2 whitespace-nowrap font-medium text-text-primary">
                        {fmtBRL(r.deposits_total_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-medium text-text-primary">Eventos recentes</h3>
        {initialEvents.length === 0 ? (
          <p className="text-xs text-text-muted">Nenhum evento recebido ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="py-2 pr-3 font-medium">Quando</th>
                  <th className="py-2 pr-3 font-medium">Tipo</th>
                  <th className="py-2 pr-3 font-medium">Origem</th>
                  <th className="py-2 pr-3 font-medium">E-mail</th>
                  <th className="py-2 pr-3 font-medium">Valor</th>
                  <th className="py-2 font-medium">Lead</th>
                </tr>
              </thead>
              <tbody>
                {initialEvents.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 text-text-secondary">
                    <td className="py-2 pr-3 whitespace-nowrap">{new Date(e.occurred_at).toLocaleString("pt-BR")}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{EVENT_TYPE_LABEL[e.event_type] ?? e.event_type}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{e.source}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{e.email ?? "—"}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {e.amount_cents != null ? fmtBRL(e.amount_cents) : "—"}
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

      {isAdmin && <WebhookEndpointsPanel productId={productId} initialEndpoints={initialEndpoints} />}
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
    <div className="rounded-xl border border-border p-3">
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

function FinanceTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="mb-1 flex items-center gap-1.5 text-text-muted">
        <Percent size={12} />
        <p className="text-[11px]">{label}</p>
      </div>
      <p className="text-sm font-semibold text-text-muted">{value}</p>
      <p className="text-[10px] text-text-muted/70">{hint}</p>
    </div>
  );
}
