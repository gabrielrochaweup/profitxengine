"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, Webhook, Landmark, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnalyticsTab, analyticsSubTabsVisiveis, type AnalyticsSubTab } from "./components/analytics-tab";
import { WebhookEndpointsPanel, type WebhookEndpoint } from "./components/webhook-endpoints-panel";
import { SendPulsePanel } from "./components/sendpulse-panel";
import { AdAccountsPanel, type AdAccount } from "./components/ad-accounts-panel";
import { BmsPanel } from "./components/bms-panel";
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

// Separado por plataforma, e não por tipo de cadastro: quem abre essa aba
// está resolvendo um problema de UM lado (a BM da Meta caiu, a conta do
// Google foi suspensa) e quer ver tudo daquele lado junto — inventário,
// contas conectadas e pixel, sem pular de aba no meio.
const CONTAS_SUB_TABS = [
  { key: "meta", label: "Meta" },
  { key: "google", label: "Google" },
] as const;
type ContasSubTab = (typeof CONTAS_SUB_TABS)[number]["key"];

// "Link de checkout" e "Instalar script" viraram uma aba só: os dois são a
// mesma tarefa vista de dois ângulos — fazer o site reconhecer o visitante e
// levar esse reconhecimento até o checkout. Separados, quem instalava o
// script não descobria que precisava do link, e vice-versa.
const UTMS_SUB_TABS = [
  { key: "utm", label: "Link com UTM" },
  { key: "rastreamento", label: "Rastreamento" },
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
    abaDaUrl === "contas" ? subInicial(CONTAS_SUB_TABS, subDaUrl) : "meta"
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

  // As sub-abas de cada aba moram aqui, e não dentro de cada painel: assim a
  // barra do módulo é UMA barra com dois níveis, em vez de uma caixa de pílulas
  // seguida de outra caixa de pílulas logo abaixo dela.
  const subAbas: { key: string; label: string }[] =
    tab === "analises"
      ? [...analisesSubTabs]
      : tab === "webhooks"
        ? [...WEBHOOKS_SUB_TABS]
        : tab === "contas"
          ? [...CONTAS_SUB_TABS]
          : [...UTMS_SUB_TABS];

  const trocarSubDaAbaAtual = (sub: string) => {
    if (tab === "analises") setAnalisesSubTab(sub as AnalyticsSubTab);
    else if (tab === "webhooks") setWebhooksSubTab(sub as WebhooksSubTab);
    else if (tab === "contas") setContasSubTab(sub as ContasSubTab);
    else setUtmsSubTab(sub as UtmsSubTab);
    gravarNaUrl(tab, sub);
  };

  return (
    <div>
      <div className="mb-5 overflow-hidden rounded-panel bg-sidebar shadow-card">
        <div className="flex flex-wrap gap-1 p-1.5">
          {visibleTabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => trocarAba(t.key)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-button px-3 text-[13px] font-medium transition-colors duration-150",
                  tab === t.key
                    ? "bg-accent text-accent-contrast"
                    : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
                )}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Segundo nível dentro da mesma barra: o fio diz "ainda é a mesma
            ferramenta", coisa que duas caixas empilhadas não diziam. */}
        <div className="flex flex-wrap gap-0.5 border-t border-border px-2 py-1.5">
          {subAbas.map((sub) => (
            <button
              key={sub.key}
              type="button"
              onClick={() => trocarSubDaAbaAtual(sub.key)}
              className={cn(
                "rounded-button px-2.5 py-1 text-[12px] font-medium transition-colors duration-150",
                subAtual(tab) === sub.key
                  ? "bg-card-hover text-accent-text"
                  : "text-text-tertiary hover:bg-card-hover hover:text-text-primary"
              )}
            >
              {sub.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "analises" && (
        <AnalyticsTab
          productId={productId}
          initialReport={initialReport}
          initialEvents={initialEvents}
          isAdmin={isAdmin}
          subTab={analisesSubTab}
        />
      )}

      {tab === "webhooks" && isAdmin && (
        <div>
          {webhooksSubTab === "guia" && <TrackingFlowGuide endpoints={endpoints} isAdmin={isAdmin} />}
          {webhooksSubTab === "endpoints" && (
            <WebhookEndpointsPanel productId={productId} endpoints={endpoints} setEndpoints={setEndpoints} />
          )}
          {webhooksSubTab === "whatsapp" && <SendPulsePanel productId={productId} />}
        </div>
      )}

      {tab === "contas" && isAdmin && (
        <div>
          <div className="space-y-6">
            <BmsPanel productId={productId} platform={contasSubTab} />
            <AdAccountsPanel
              productId={productId}
              platform={contasSubTab}
              accounts={adCredentials}
              setAccounts={setAdCredentials}
            />
            <PixelsPanel productId={productId} platform={contasSubTab} />
          </div>
        </div>
      )}

      {tab === "utms" && (
        <div>
          {utmsSubTab === "utm" && <UtmBuilder productId={productId} />}
          {utmsSubTab === "rastreamento" && (
            <div className="space-y-6">
              <TrackingScriptPanel productSlug={productSlug} />
              <LinkBuilder productSlug={productSlug} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
