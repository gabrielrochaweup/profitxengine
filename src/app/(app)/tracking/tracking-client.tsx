"use client";

import { useState } from "react";
import { BarChart3, Webhook, Landmark, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnalyticsTab } from "./components/analytics-tab";
import { WebhookEndpointsPanel, type WebhookEndpoint } from "./components/webhook-endpoints-panel";
import { AdAccountsPanel, type AdAccount } from "./components/ad-accounts-panel";
import { PixelsPanel } from "./components/pixels-panel";
import { TrackingScriptPanel } from "./components/tracking-script-panel";
import { UtmGuide } from "./components/utm-guide";
import { UtmBuilder } from "./components/utm-builder";
import { TrackingFlowGuide } from "./components/tracking-flow-guide";
import { LinkBuilder } from "./components/link-builder";

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
  initialAdCredentials: AdAccount[];
  isAdmin: boolean;
}

const TABS = [
  { key: "analises", label: "Análises", icon: BarChart3, adminOnly: false },
  { key: "webhooks", label: "Webhooks", icon: Webhook, adminOnly: true },
  { key: "contas", label: "Contas Meta/Google", icon: Landmark, adminOnly: true },
  { key: "utms", label: "UTMs", icon: Link2, adminOnly: false },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function TrackingClient({
  productId,
  productSlug,
  initialReport,
  initialEvents,
  initialEndpoints,
  initialAdCredentials,
  isAdmin,
}: TrackingClientProps) {
  const [tab, setTab] = useState<TabKey>("analises");
  // Ficam aqui (não dentro de cada painel) porque as abas desmontam o
  // conteúdo ao trocar — um useState dentro do painel reiniciaria a partir
  // do initialEndpoints/initialAdCredentials (props da carga inicial da
  // página) sempre que o usuário voltasse pra essa aba, fazendo item
  // excluído "voltar" até um refresh de página.
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(initialEndpoints);
  const [adCredentials, setAdCredentials] = useState<AdAccount[]>(initialAdCredentials);
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="mt-4">
      <div className="mb-4 flex flex-wrap gap-1.5 rounded-panel bg-sidebar shadow-card p-1.5">
        {visibleTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-button px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
              )}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "analises" && <AnalyticsTab productId={productId} initialReport={initialReport} initialEvents={initialEvents} />}

      {tab === "webhooks" && isAdmin && (
        <div className="space-y-4">
          <TrackingFlowGuide endpoints={endpoints} isAdmin={isAdmin} />
          <WebhookEndpointsPanel productId={productId} endpoints={endpoints} setEndpoints={setEndpoints} />
        </div>
      )}

      {tab === "contas" && isAdmin && (
        <div className="space-y-4">
          <AdAccountsPanel productId={productId} accounts={adCredentials} setAccounts={setAdCredentials} />
          <PixelsPanel productId={productId} productSlug={productSlug} />
        </div>
      )}

      {tab === "utms" && (
        <div className="space-y-4">
          <UtmBuilder />
          <LinkBuilder productSlug={productSlug} />
          <TrackingScriptPanel productSlug={productSlug} />
          <UtmGuide />
        </div>
      )}
    </div>
  );
}
