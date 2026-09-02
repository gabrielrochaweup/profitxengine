"use client";

import { useState } from "react";
import { BarChart3, Webhook, Landmark, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubTabs } from "@/components/ui/sub-tabs";
import { AnalyticsTab } from "./components/analytics-tab";
import { WebhookEndpointsPanel, type WebhookEndpoint } from "./components/webhook-endpoints-panel";
import { AdAccountsPanel, type AdAccount } from "./components/ad-accounts-panel";
import { PixelsPanel } from "./components/pixels-panel";
import { TrackingScriptPanel } from "./components/tracking-script-panel";
import { UtmBuilder } from "./components/utm-builder";
import { TrackingFlowGuide } from "./components/tracking-flow-guide";
import { LinkBuilder } from "./components/link-builder";

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

const WEBHOOKS_SUB_TABS = [
  { key: "guia", label: "Guia" },
  { key: "endpoints", label: "Endpoints" },
] as const;
type WebhooksSubTab = (typeof WEBHOOKS_SUB_TABS)[number]["key"];

const CONTAS_SUB_TABS = [
  { key: "contas", label: "Contas de anúncio" },
  { key: "pixels", label: "Pixels" },
] as const;
type ContasSubTab = (typeof CONTAS_SUB_TABS)[number]["key"];

const UTMS_SUB_TABS = [
  { key: "utm", label: "Link com UTM" },
  { key: "checkout", label: "Link de checkout" },
  { key: "script", label: "Instalar script" },
] as const;
type UtmsSubTab = (typeof UTMS_SUB_TABS)[number]["key"];

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
  const [webhooksSubTab, setWebhooksSubTab] = useState<WebhooksSubTab>("guia");
  const [contasSubTab, setContasSubTab] = useState<ContasSubTab>("contas");
  const [utmsSubTab, setUtmsSubTab] = useState<UtmsSubTab>("utm");
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
        <div>
          <SubTabs tabs={WEBHOOKS_SUB_TABS} active={webhooksSubTab} onChange={setWebhooksSubTab} />
          {webhooksSubTab === "guia" && <TrackingFlowGuide endpoints={endpoints} isAdmin={isAdmin} />}
          {webhooksSubTab === "endpoints" && (
            <WebhookEndpointsPanel productId={productId} endpoints={endpoints} setEndpoints={setEndpoints} />
          )}
        </div>
      )}

      {tab === "contas" && isAdmin && (
        <div>
          <SubTabs tabs={CONTAS_SUB_TABS} active={contasSubTab} onChange={setContasSubTab} />
          {contasSubTab === "contas" && (
            <AdAccountsPanel productId={productId} accounts={adCredentials} setAccounts={setAdCredentials} />
          )}
          {contasSubTab === "pixels" && <PixelsPanel productId={productId} />}
        </div>
      )}

      {tab === "utms" && (
        <div>
          <SubTabs tabs={UTMS_SUB_TABS} active={utmsSubTab} onChange={setUtmsSubTab} />
          {utmsSubTab === "utm" && <UtmBuilder />}
          {utmsSubTab === "checkout" && <LinkBuilder productSlug={productSlug} />}
          {utmsSubTab === "script" && <TrackingScriptPanel productSlug={productSlug} />}
        </div>
      )}
    </div>
  );
}
