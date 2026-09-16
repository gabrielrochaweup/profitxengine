"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, Webhook, Landmark, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubTabs } from "@/components/ui/sub-tabs";
import { AnalyticsTab, analyticsSubTabsVisiveis, type AnalyticsSubTab } from "./components/analytics-tab";
import { WebhookEndpointsPanel, type WebhookEndpoint } from "./components/webhook-endpoints-panel";
import { SendPulsePanel } from "./components/sendpulse-panel";
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
  { key: "whatsapp", label: "WhatsApp (SendPulse)" },
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

// Uma sub-aba que não existe naquela aba (link velho, endereço digitado a
// mão) cai na primeira em vez de deixar a aba sem conteúdo nenhum.
function subInicial<T extends string>(tabs: readonly { key: T }[], valor: string | null): T {
  return tabs.some((t) => t.key === valor) ? (valor as T) : tabs[0].key;
}

export function TrackingClient({
  productId,
  productSlug,
  initialReport,
  initialEvents,
  initialEndpoints,
  initialAdCredentials,
  isAdmin,
}: TrackingClientProps) {
  const searchParams = useSearchParams();
  const abaDaUrl = searchParams.get("aba");
  const subDaUrl = searchParams.get("sub");

  // A validação é contra o que ESTA pessoa pode ver, não contra a lista
  // inteira: um endereço de aba só de admin, aberto por quem não é, tem que
  // cair na primeira aba — senão a aba fica marcada no estado, some da barra
  // de cima e o conteúdo não renderiza, deixando a tela em branco.
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);
  const analisesSubTabs = analyticsSubTabsVisiveis(isAdmin);

  const [tab, setTab] = useState<TabKey>(
    visibleTabs.some((t) => t.key === abaDaUrl) ? (abaDaUrl as TabKey) : visibleTabs[0].key
  );
  // Cada aba guarda a sua própria sub-aba, então trocar de aba e voltar não
  // perde onde a pessoa estava. Só a sub-aba da aba que veio na URL nasce do
  // endereço; as outras começam na primeira.
  const [analisesSubTab, setAnalisesSubTab] = useState<AnalyticsSubTab>(
    abaDaUrl === "analises" ? subInicial(analisesSubTabs, subDaUrl) : "visao"
  );
  const [webhooksSubTab, setWebhooksSubTab] = useState<WebhooksSubTab>(
    abaDaUrl === "webhooks" ? subInicial(WEBHOOKS_SUB_TABS, subDaUrl) : "guia"
  );
  const [contasSubTab, setContasSubTab] = useState<ContasSubTab>(
    abaDaUrl === "contas" ? subInicial(CONTAS_SUB_TABS, subDaUrl) : "contas"
  );
  const [utmsSubTab, setUtmsSubTab] = useState<UtmsSubTab>(
    abaDaUrl === "utms" ? subInicial(UTMS_SUB_TABS, subDaUrl) : "utm"
  );
  // Ficam aqui (não dentro de cada painel) porque as abas desmontam o
  // conteúdo ao trocar — um useState dentro do painel reiniciaria a partir
  // do initialEndpoints/initialAdCredentials (props da carga inicial da
  // página) sempre que o usuário voltasse pra essa aba, fazendo item
  // excluído "voltar" até um refresh de página.
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(initialEndpoints);
  const [adCredentials, setAdCredentials] = useState<AdAccount[]>(initialAdCredentials);

  // Cada aba e sub-aba vira um endereço próprio (?aba=analises&sub=alunos),
  // pra que atualizar a página — ou salvar o link — caia de volta exatamente
  // onde a pessoa estava, em vez de voltar pra "Análises > Visão geral".
  //
  // Escrito com history.replaceState, não com router.replace: os dois deixam
  // o endereço igual, mas o router trata como navegação e manda o servidor
  // renderizar a página de novo, refazendo o relatório de 90 dias a cada
  // clique numa aba. Aqui o estado já está todo no cliente — a URL é só o
  // marcador.
  const gravarNaUrl = useCallback((aba: TabKey, sub: string) => {
    window.history.replaceState(null, "", `${window.location.pathname}?aba=${aba}&sub=${sub}`);
  }, []);

  const subAtual = (aba: TabKey): string =>
    aba === "analises"
      ? analisesSubTab
      : aba === "webhooks"
        ? webhooksSubTab
        : aba === "contas"
          ? contasSubTab
          : utmsSubTab;

  const trocarAba = (aba: TabKey) => {
    setTab(aba);
    gravarNaUrl(aba, subAtual(aba));
  };

  function trocarSub<T extends string>(aba: TabKey, set: Dispatch<SetStateAction<T>>) {
    return (sub: T) => {
      set(sub);
      gravarNaUrl(aba, sub);
    };
  }

  return (
    <div className="mt-4">
      <div className="mb-4 flex flex-wrap gap-1.5 rounded-panel bg-sidebar shadow-card p-1.5">
        {visibleTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => trocarAba(t.key)}
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

      {tab === "analises" && (
        <AnalyticsTab
          productId={productId}
          initialReport={initialReport}
          initialEvents={initialEvents}
          isAdmin={isAdmin}
          subTab={analisesSubTab}
          onSubTabChange={trocarSub("analises", setAnalisesSubTab)}
        />
      )}

      {tab === "webhooks" && isAdmin && (
        <div>
          <SubTabs tabs={WEBHOOKS_SUB_TABS} active={webhooksSubTab} onChange={trocarSub("webhooks", setWebhooksSubTab)} />
          {webhooksSubTab === "guia" && <TrackingFlowGuide endpoints={endpoints} isAdmin={isAdmin} />}
          {webhooksSubTab === "endpoints" && (
            <WebhookEndpointsPanel productId={productId} endpoints={endpoints} setEndpoints={setEndpoints} />
          )}
          {webhooksSubTab === "whatsapp" && <SendPulsePanel productId={productId} />}
        </div>
      )}

      {tab === "contas" && isAdmin && (
        <div>
          <SubTabs tabs={CONTAS_SUB_TABS} active={contasSubTab} onChange={trocarSub("contas", setContasSubTab)} />
          {contasSubTab === "contas" && (
            <AdAccountsPanel productId={productId} accounts={adCredentials} setAccounts={setAdCredentials} />
          )}
          {contasSubTab === "pixels" && <PixelsPanel productId={productId} />}
        </div>
      )}

      {tab === "utms" && (
        <div>
          <SubTabs tabs={UTMS_SUB_TABS} active={utmsSubTab} onChange={trocarSub("utms", setUtmsSubTab)} />
          {utmsSubTab === "utm" && <UtmBuilder />}
          {utmsSubTab === "checkout" && <LinkBuilder productSlug={productSlug} />}
          {utmsSubTab === "script" && <TrackingScriptPanel productSlug={productSlug} />}
        </div>
      )}
    </div>
  );
}
