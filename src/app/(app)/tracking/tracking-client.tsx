"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { SimpleBarChart } from "../analytics/components/charts";
import { WebhookEndpointsPanel, type WebhookEndpoint } from "./components/webhook-endpoints-panel";

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

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function sumBy(rows: CampaignRow[], key: keyof CampaignRow): number {
  return rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
}

export function TrackingClient({ productId, initialReport, initialEvents, initialEndpoints, isAdmin }: TrackingClientProps) {
  const [period, setPeriod] = useState<Period>("90d");
  const [report, setReport] = useState<CampaignRow[]>(initialReport);
  const [loading, setLoading] = useState(false);

  async function changePeriod(next: Period) {
    setPeriod(next);
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
    setLoading(false);
  }

  const kpis = useMemo(
    () => ({
      leads: sumBy(report, "leads"),
      purchases: sumBy(report, "purchases"),
      purchaseRevenue: sumBy(report, "purchase_revenue_cents"),
      membersAccess: sumBy(report, "members_access"),
      brokerSignups: sumBy(report, "broker_signups"),
      deposits: sumBy(report, "deposits"),
      depositsTotal: sumBy(report, "deposits_total_cents"),
    }),
    [report]
  );

  const depositsByCampaign = useMemo(
    () =>
      report
        .filter((r) => r.deposits_total_cents > 0)
        .slice(0, 10)
        .map((r) => ({ label: `${r.utm_source} · ${r.utm_campaign}`, value: r.deposits_total_cents / 100 })),
    [report]
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiTile label="Leads" value={String(kpis.leads)} />
        <KpiTile label="Compras do curso" value={String(kpis.purchases)} sub={fmtBRL(kpis.purchaseRevenue)} />
        <KpiTile label="Área de membros" value={String(kpis.membersAccess)} />
        <KpiTile label="Cadastros corretora" value={String(kpis.brokerSignups)} />
        <KpiTile label="Depósitos" value={String(kpis.deposits)} sub={fmtBRL(kpis.depositsTotal)} tone="success" />
        <KpiTile
          label="Ticket médio depósito"
          value={fmtBRL(kpis.deposits > 0 ? Math.round(kpis.depositsTotal / kpis.deposits) : 0)}
          tone="accent"
        />
      </div>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-medium text-text-primary">Funil</h3>
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

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-medium text-text-primary">Depósitos por campanha (top 10)</h3>
        <SimpleBarChart data={depositsByCampaign} valueLabel="Depósitos" isCurrency color="var(--success)" />
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-medium text-text-primary">Campanhas — curso × depósito</h3>
        {report.length === 0 ? (
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
                {report.map((r) => (
                  <tr key={`${r.utm_source}-${r.utm_campaign}`} className="border-b border-border/50 text-text-secondary">
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
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "accent" | "success";
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-[11px] text-text-muted">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold ${
          tone === "accent" ? "text-accent" : tone === "success" ? "text-success" : "text-text-primary"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-text-muted">{sub}</p>}
    </div>
  );
}
