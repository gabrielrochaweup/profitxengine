"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutDashboard, TrendingUp, Users, Activity, Wrench, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AnalyticsTab,
  PERFORMANCE_SUB_TABS,
  type AnalyticsSubTab,
  type TableTab,
} from "./components/analytics-tab";
import { ehFiltroDeAluno, type FiltroDeAluno } from "./components/alunos-panel";
import { FontesDeDadosPanel, type WebhookEndpoint } from "./components/data-sources-panel";
import { SendPulsePanel } from "./components/sendpulse-panel";
import { AdsSettings, type AdAccount } from "./components/ads-settings";
import { TrackingScriptPanel } from "./components/tracking-script-panel";
import { UtmBuilder } from "./components/utm-builder";
import { LinkBuilder } from "./components/link-builder";
import { Bloco } from "./components/ui";

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

/*
  A navegação do módulo é por pergunta, não por tecnologia.

  Antes as abas eram Análises / Webhooks / Contas Meta-Google / UTMs: uma
  finalidade, uma implementação, um par de integrações e um mecanismo, todos no
  mesmo nível. Pra saber onde ficava uma tarefa era preciso saber como o
  sistema funciona por dentro.

  Agora cada aba responde uma pergunta:
    Visão geral    — como está a operação?
    Performance    — de onde vem o resultado?
    Pessoas        — com quem aconteceu?
    Eventos        — o que o sistema recebeu?
    Ferramentas    — quero criar algo pra rastrear
    Configurações  — como isso tudo está conectado?
*/
const TABS = [
  { key: "visao", label: "Visão geral", icon: LayoutDashboard, adminOnly: false },
  { key: "performance", label: "Performance", icon: TrendingUp, adminOnly: false },
  { key: "pessoas", label: "Pessoas", icon: Users, adminOnly: true },
  { key: "eventos", label: "Eventos", icon: Activity, adminOnly: false },
  { key: "ferramentas", label: "Ferramentas", icon: Wrench, adminOnly: false },
  { key: "configuracoes", label: "Configurações", icon: Settings, adminOnly: true },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const FERRAMENTAS_SUB_TABS = [
  { key: "utms", label: "UTMs" },
  { key: "rastreamento", label: "Rastreamento" },
] as const;
type FerramentasSubTab = (typeof FERRAMENTAS_SUB_TABS)[number]["key"];

const CONFIG_SUB_TABS = [
  { key: "fontes", label: "Fontes de dados" },
  { key: "anuncios", label: "Anúncios" },
  { key: "automacoes", label: "Automações" },
] as const;
type ConfigSubTab = (typeof CONFIG_SUB_TABS)[number]["key"];

/**
 * Endereços antigos continuam abrindo o lugar certo.
 *
 * O ?aba=/?sub= de antes está em link salvo, em aba aberta há uma semana e no
 * histórico de quem usa isso todo dia. A tradução acontece na leitura e o
 * endereço é reescrito no formato novo no primeiro clique — ninguém cai numa
 * tela em branco por ter guardado um link.
 */
const ENDERECOS_ANTIGOS: Record<string, { aba: TabKey; sub?: string }> = {
  "analises/visao": { aba: "visao" },
  "analises/campanhas": { aba: "performance", sub: "campanhas" },
  "analises/eventos": { aba: "eventos" },
  "analises/alunos": { aba: "pessoas" },
  "webhooks/guia": { aba: "configuracoes", sub: "fontes" },
  "webhooks/endpoints": { aba: "configuracoes", sub: "fontes" },
  "webhooks/whatsapp": { aba: "configuracoes", sub: "automacoes" },
  "contas/meta": { aba: "configuracoes", sub: "anuncios" },
  "contas/google": { aba: "configuracoes", sub: "anuncios" },
  "utms/utm": { aba: "ferramentas", sub: "utms" },
  "utms/rastreamento": { aba: "ferramentas", sub: "rastreamento" },
};

function traduzirEndereco(aba: string | null, sub: string | null): { aba: TabKey; sub?: string } | null {
  if (!aba) return null;
  if (TABS.some((t) => t.key === aba)) return { aba: aba as TabKey, sub: sub ?? undefined };
  return ENDERECOS_ANTIGOS[`${aba}/${sub ?? ""}`] ?? ENDERECOS_ANTIGOS[`${aba}/`] ?? null;
}

/** Sub-aba inválida (link velho, endereço digitado a mão) cai na primeira. */
function subInicial<T extends string>(tabs: readonly { key: T }[], valor: string | undefined): T {
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
  const destino = traduzirEndereco(searchParams.get("aba"), searchParams.get("sub"));
  const plataformaDaUrl = searchParams.get("plataforma");
  // ?filtro= chega dos cartões do Dashboard: "ver quem falta" abre a lista
  // já na fila certa, em vez de largar a pessoa na tela cheia pra ela
  // reencontrar o recorte na mão.
  const filtroDaUrl = searchParams.get("filtro");
  const filtroAlunos: FiltroDeAluno | undefined = ehFiltroDeAluno(filtroDaUrl) ? filtroDaUrl : undefined;

  // A validação é contra o que ESTA pessoa pode ver: um endereço só de admin,
  // aberto por quem não é, cai na primeira aba — senão a aba fica marcada no
  // estado, some da barra e o conteúdo não renderiza, deixando a tela branca.
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  const [tab, setTab] = useState<TabKey>(
    destino && visibleTabs.some((t) => t.key === destino.aba) ? destino.aba : visibleTabs[0].key
  );

  // Cada aba guarda a própria sub-aba, então ir e voltar não perde o lugar.
  // Só a sub-aba da aba que veio no endereço nasce dele.
  const [performanceSubTab, setPerformanceSubTab] = useState<TableTab>(
    destino?.aba === "performance" ? subInicial(PERFORMANCE_SUB_TABS, destino.sub) : "campanhas"
  );
  const [ferramentasSubTab, setFerramentasSubTab] = useState<FerramentasSubTab>(
    destino?.aba === "ferramentas" ? subInicial(FERRAMENTAS_SUB_TABS, destino.sub) : "utms"
  );
  const [configSubTab, setConfigSubTab] = useState<ConfigSubTab>(
    destino?.aba === "configuracoes" ? subInicial(CONFIG_SUB_TABS, destino.sub) : "fontes"
  );
  // Meta ou Google dentro de Configurações → Anúncios. Fica aqui (e não numa
  // terceira barra de abas) pra tela não virar barra dentro de barra dentro
  // de barra.
  const [plataformaAds, setPlataformaAds] = useState<"meta" | "google">(
    plataformaDaUrl === "google" ? "google" : "meta"
  );

  // Ficam aqui (não dentro de cada painel) porque as abas desmontam o conteúdo
  // ao trocar — um useState dentro do painel reiniciaria a partir das props da
  // carga inicial da página sempre que a pessoa voltasse, fazendo item
  // excluído "voltar" até um refresh.
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(initialEndpoints);
  const [adCredentials, setAdCredentials] = useState<AdAccount[]>(initialAdCredentials);

  /*
    Escrito com history.replaceState, não com router.replace: os dois deixam o
    endereço igual, mas o router trata como navegação e manda o servidor
    renderizar a página de novo, refazendo o relatório de 90 dias a cada clique
    numa aba. Aqui o estado já está todo no cliente — a URL é só o marcador.
  */
  const gravarNaUrl = useCallback((aba: TabKey, sub?: string, extra?: Record<string, string>) => {
    const params = new URLSearchParams({ aba });
    if (sub) params.set("sub", sub);
    for (const [k, v] of Object.entries(extra ?? {})) params.set(k, v);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, []);

  const subAtual = (aba: TabKey): string | undefined =>
    aba === "performance"
      ? performanceSubTab
      : aba === "ferramentas"
        ? ferramentasSubTab
        : aba === "configuracoes"
          ? configSubTab
          : undefined;

  const extraAtual = (aba: TabKey, sub?: string) =>
    aba === "configuracoes" && sub === "anuncios" ? { plataforma: plataformaAds } : undefined;

  function trocarAba(aba: TabKey) {
    setTab(aba);
    const sub = subAtual(aba);
    gravarNaUrl(aba, sub, extraAtual(aba, sub));
  }

  function trocarSub(sub: string) {
    if (tab === "performance") setPerformanceSubTab(sub as TableTab);
    else if (tab === "ferramentas") setFerramentasSubTab(sub as FerramentasSubTab);
    else if (tab === "configuracoes") setConfigSubTab(sub as ConfigSubTab);
    gravarNaUrl(tab, sub, extraAtual(tab, sub));
  }

  function trocarPlataforma(p: "meta" | "google") {
    setPlataformaAds(p);
    gravarNaUrl("configuracoes", "anuncios", { plataforma: p });
  }

  // Só as abas que têm segundo nível mostram a segunda linha da barra. As
  // outras quatro abrem direto no conteúdo.
  const subAbas: readonly { key: string; label: string }[] =
    tab === "performance"
      ? PERFORMANCE_SUB_TABS
      : tab === "ferramentas"
        ? FERRAMENTAS_SUB_TABS
        : tab === "configuracoes"
          ? CONFIG_SUB_TABS
          : [];

  // Visão geral, Performance, Pessoas e Eventos são quatro recortes do MESMO
  // painel: mesma janela de tempo, mesmos filtros, mesma carga de dados. Por
  // isso o AnalyticsTab continua montado entre eles — trocar de aba não
  // refaz o relatório nem perde o filtro escolhido.
  const abaDeAnalise: AnalyticsSubTab | null =
    tab === "visao" ? "visao" : tab === "performance" ? "campanhas" : tab === "pessoas" ? "alunos" : tab === "eventos" ? "eventos" : null;

  return (
    <div>
      <div className="mb-5 rounded-panel bg-sidebar shadow-card">
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

        {subAbas.length > 0 && (
          <div className="flex flex-wrap gap-0.5 border-t border-border px-2 py-1.5">
            {subAbas.map((sub) => (
              <button
                key={sub.key}
                type="button"
                onClick={() => trocarSub(sub.key)}
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
        )}
      </div>

      {abaDeAnalise && (
        <AnalyticsTab
          productId={productId}
          initialReport={initialReport}
          initialEvents={initialEvents}
          isAdmin={isAdmin}
          subTab={abaDeAnalise}
          tableTab={performanceSubTab}
          filtroAlunos={filtroAlunos}
        />
      )}

      {tab === "ferramentas" && (
        <div>
          {ferramentasSubTab === "utms" && <UtmBuilder productId={productId} />}
          {ferramentasSubTab === "rastreamento" && (
            <div className="space-y-6">
              <TrackingScriptPanel productSlug={productSlug} />
              <LinkBuilder productSlug={productSlug} />
            </div>
          )}
        </div>
      )}

      {tab === "configuracoes" && isAdmin && (
        <div>
          {configSubTab === "fontes" && (
            <FontesDeDadosPanel productId={productId} endpoints={endpoints} setEndpoints={setEndpoints} />
          )}

          {configSubTab === "anuncios" && (
            <AdsSettings
              productId={productId}
              plataforma={plataformaAds}
              onTrocarPlataforma={trocarPlataforma}
              accounts={adCredentials}
              setAccounts={setAdCredentials}
            />
          )}

          {configSubTab === "automacoes" && (
            <Bloco titulo="WhatsApp — SendPulse">
              <p className="-mt-1 mb-3 max-w-[80ch] text-[11px] text-text-tertiary">
                Cada compra aprovada e cada contrato assinado dispara o evento correspondente no SendPulse, que
                inicia o fluxo de mensagens do plano daquele aluno.
              </p>
              <SendPulsePanel productId={productId} />
            </Bloco>
          )}
        </div>
      )}
    </div>
  );
}
