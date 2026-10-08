"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutDashboard, TrendingUp, Users, Activity, Megaphone, Radar, Plug } from "@/components/ui/icones";
import { SegmentedControl, SideNav, SplitLayout, type SideNavItem, type SideNavTone } from "@/components/ui/panel";
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
import { EventosMetaPanel } from "./components/eventos-meta-panel";
import { EnviosCapiPanel } from "./components/envios-capi-panel";
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
  Navegação do módulo: uma coluna à esquerda (nível 1) e, quando a área tem
  partes, pílulas no topo do conteúdo (nível 2). Os dois níveis nunca dividem
  a mesma barra — antes as seis abas e as sub-abas ficavam empilhadas na
  mesma faixa e pareciam a mesma coisa.

  Cada item responde uma pergunta:
    Visão geral   — como está a operação?
    Performance   — de onde vem o resultado (campanha, página)?
    Pessoas       — com quem aconteceu?
    Eventos       — o que o sistema recebeu?
    Anúncios      — as contas de anúncio estão conectadas e em dia?
    Rastreamento  — o que vai pra Meta e com que link?
    Integrações   — os webhooks e o WhatsApp estão ligados?

  Anúncios era uma sub-aba de Configurações e ninguém achava a conexão da
  Meta: virou item próprio, com selo de atenção quando algo está pendente.
*/
const TABS = [
  { key: "visao", label: "Visão geral", hint: "Resultado e funil", icon: LayoutDashboard, adminOnly: false },
  { key: "performance", label: "Performance", hint: "Campanhas, páginas e ROI", icon: TrendingUp, adminOnly: false },
  { key: "pessoas", label: "Pessoas", hint: "Alunos e contratos", icon: Users, adminOnly: false },
  { key: "eventos", label: "Eventos", hint: "Tudo que entrou", icon: Activity, adminOnly: false },
  { key: "anuncios", label: "Anúncios", hint: "Meta, Google, BMs e pixels", icon: Megaphone, adminOnly: false },
  { key: "rastreamento", label: "Rastreamento", hint: "Script, eventos da Meta e links", icon: Radar, adminOnly: false },
  { key: "integracoes", label: "Integrações", hint: "Webhooks e WhatsApp", icon: Plug, adminOnly: false },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** Frase de abertura de cada área — o que a pessoa resolve ali. */
const DESCRICAO: Record<TabKey, string> = {
  visao: "Quanto entrou, quanto sobrou e onde o funil perde gente.",
  performance: "Resultado por campanha e por página, com o gasto quando a conta de anúncio está sincronizada.",
  pessoas: "Cada aluno, o que já fez e o que falta (contrato, Pepe, corretora, depósito).",
  eventos: "Tudo que os webhooks e o script registraram, na ordem em que chegou.",
  anuncios: "Contas de anúncio, Business Managers e pixels da Meta e do Google.",
  rastreamento: "O script das páginas, os eventos que vão pra Meta e os links rastreados.",
  integracoes: "Webhooks que alimentam o Tracking e as automações de WhatsApp.",
};

const RASTREAMENTO_SUB_TABS = [
  { key: "script", label: "Script e eventos" },
  { key: "links", label: "Links e UTMs" },
] as const;
type RastreamentoSubTab = (typeof RASTREAMENTO_SUB_TABS)[number]["key"];

const INTEGRACOES_SUB_TABS = [
  { key: "fontes", label: "Fontes de dados" },
  { key: "automacoes", label: "Automações" },
] as const;
type IntegracoesSubTab = (typeof INTEGRACOES_SUB_TABS)[number]["key"];

/**
 * Endereços antigos continuam abrindo o lugar certo.
 *
 * O ?aba=/?sub= de antes está em link salvo, no Dashboard e no histórico de
 * quem usa isso todo dia. A tradução acontece na leitura e o endereço é
 * reescrito no formato novo no primeiro clique.
 */
const ENDERECOS_ANTIGOS: Record<string, { aba: TabKey; sub?: string }> = {
  "analises/visao": { aba: "visao" },
  "analises/campanhas": { aba: "performance", sub: "campanhas" },
  "analises/eventos": { aba: "eventos" },
  "analises/alunos": { aba: "pessoas" },
  "webhooks/guia": { aba: "integracoes", sub: "fontes" },
  "webhooks/endpoints": { aba: "integracoes", sub: "fontes" },
  "webhooks/whatsapp": { aba: "integracoes", sub: "automacoes" },
  "contas/meta": { aba: "anuncios" },
  "contas/google": { aba: "anuncios" },
  "utms/utm": { aba: "rastreamento", sub: "links" },
  "utms/rastreamento": { aba: "rastreamento", sub: "script" },
  // Estrutura de antes da coluna lateral (Ferramentas / Configurações).
  "ferramentas/utms": { aba: "rastreamento", sub: "links" },
  "ferramentas/rastreamento": { aba: "rastreamento", sub: "script" },
  "ferramentas/": { aba: "rastreamento" },
  "configuracoes/fontes": { aba: "integracoes", sub: "fontes" },
  "configuracoes/automacoes": { aba: "integracoes", sub: "automacoes" },
  "configuracoes/anuncios": { aba: "anuncios" },
  "configuracoes/": { aba: "integracoes" },
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

const UM_DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Selo de Anúncios: verde quando todas as contas respondem e sincronizaram
 * nas últimas 24h; "!" quando falta conta, alguma não responde, está
 * restrita/bloqueada ou parou de sincronizar.
 */
function seloDeAnuncios(contas: AdAccount[]): { badge: string; tone: SideNavTone; label: string } {
  if (contas.length === 0) return { badge: "!", tone: "warning", label: "Nenhuma conta de anúncio conectada" };
  const agora = Date.now();
  const problema = contas.find(
    (c) =>
      !c.is_valid ||
      c.status === "restrita" ||
      c.status === "bloqueada" ||
      !c.last_synced_at ||
      agora - new Date(c.last_synced_at).getTime() > UM_DIA_MS
  );
  if (problema) return { badge: "!", tone: "warning", label: "Alguma conta precisa de atenção" };
  return { badge: "✓", tone: "success", label: "Contas conectadas e sincronizadas" };
}

/** Selo de Integrações: "!" quando alguma fonte ativa falhou no último teste; senão, quantas estão ativas. */
function seloDeIntegracoes(fontes: WebhookEndpoint[]): { badge: string; tone: SideNavTone; label: string } {
  const ativas = fontes.filter((f) => f.active);
  if (ativas.some((f) => f.last_test_ok === false)) {
    return { badge: "!", tone: "warning", label: "Alguma fonte falhou no último teste" };
  }
  return { badge: String(ativas.length), tone: "neutral", label: `${ativas.length} fontes ativas` };
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
  // já na fila certa.
  const filtroDaUrl = searchParams.get("filtro");
  const filtroAlunos: FiltroDeAluno | undefined = ehFiltroDeAluno(filtroDaUrl) ? filtroDaUrl : undefined;

  // A validação é contra o que ESTA pessoa pode ver: um endereço só de admin,
  // aberto por quem não é, cai na primeira aba em vez de deixar a tela branca.
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  const [tab, setTab] = useState<TabKey>(
    destino && visibleTabs.some((t) => t.key === destino.aba) ? destino.aba : visibleTabs[0].key
  );

  // Cada área guarda a própria sub-aba, então ir e voltar não perde o lugar.
  const [performanceSubTab, setPerformanceSubTab] = useState<TableTab>(
    destino?.aba === "performance" ? subInicial(PERFORMANCE_SUB_TABS, destino.sub) : "campanhas"
  );
  const [rastreamentoSubTab, setRastreamentoSubTab] = useState<RastreamentoSubTab>(
    destino?.aba === "rastreamento" ? subInicial(RASTREAMENTO_SUB_TABS, destino.sub) : "script"
  );
  const [integracoesSubTab, setIntegracoesSubTab] = useState<IntegracoesSubTab>(
    destino?.aba === "integracoes" ? subInicial(INTEGRACOES_SUB_TABS, destino.sub) : "fontes"
  );
  // Meta ou Google dentro de Anúncios: dois cartões de escolha, não uma
  // terceira barra de abas.
  const [plataformaAds, setPlataformaAds] = useState<"meta" | "google">(
    plataformaDaUrl === "google" ? "google" : "meta"
  );

  // Ficam aqui (não dentro de cada painel) porque as áreas desmontam o
  // conteúdo ao trocar — um useState dentro do painel reiniciaria a partir
  // das props da carga inicial sempre que a pessoa voltasse.
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(initialEndpoints);
  const [adCredentials, setAdCredentials] = useState<AdAccount[]>(initialAdCredentials);

  /*
    Escrito com history.replaceState, não com router.replace: o router trata
    como navegação e manda o servidor refazer o relatório de 90 dias a cada
    clique. Aqui o estado já está todo no cliente — a URL é só o marcador.
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
      : aba === "rastreamento"
        ? rastreamentoSubTab
        : aba === "integracoes"
          ? integracoesSubTab
          : undefined;

  const extraAtual = (aba: TabKey) => (aba === "anuncios" ? { plataforma: plataformaAds } : undefined);

  function trocarAba(aba: TabKey) {
    setTab(aba);
    gravarNaUrl(aba, subAtual(aba), extraAtual(aba));
    // Trocar de área volta pro topo: a área nova começa no cabeçalho dela.
    window.scrollTo({ top: 0 });
  }

  function trocarSub(sub: string) {
    if (tab === "performance") setPerformanceSubTab(sub as TableTab);
    else if (tab === "rastreamento") setRastreamentoSubTab(sub as RastreamentoSubTab);
    else if (tab === "integracoes") setIntegracoesSubTab(sub as IntegracoesSubTab);
    gravarNaUrl(tab, sub, extraAtual(tab));
  }

  function trocarPlataforma(p: "meta" | "google") {
    setPlataformaAds(p);
    gravarNaUrl("anuncios", undefined, { plataforma: p });
  }

  const subAbas: readonly { key: string; label: string }[] =
    tab === "performance"
      ? PERFORMANCE_SUB_TABS
      : tab === "rastreamento"
        ? RASTREAMENTO_SUB_TABS
        : tab === "integracoes"
          ? INTEGRACOES_SUB_TABS
          : [];

  const itensDaNavegacao: SideNavItem<TabKey>[] = useMemo(() => {
    const anuncios = seloDeAnuncios(adCredentials);
    const integracoes = seloDeIntegracoes(endpoints);
    return visibleTabs.map((t) => ({
      key: t.key,
      label: t.label,
      hint: t.hint,
      icon: t.icon,
      ...(t.key === "anuncios"
        ? { badge: anuncios.badge, tone: anuncios.tone, badgeLabel: anuncios.label }
        : t.key === "integracoes"
          ? { badge: integracoes.badge, tone: integracoes.tone, badgeLabel: integracoes.label }
          : {}),
    }));
    // visibleTabs é derivado de isAdmin, que não muda na sessão.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adCredentials, endpoints]);

  // Visão geral, Performance, Pessoas e Eventos são quatro recortes do MESMO
  // painel de dados: mesma janela de tempo, mesmos filtros, mesma carga. Por
  // isso o AnalyticsTab continua montado entre eles — trocar de área não
  // refaz o relatório nem perde o filtro escolhido.
  const abaDeAnalise: AnalyticsSubTab | null =
    tab === "visao" ? "visao" : tab === "performance" ? "campanhas" : tab === "pessoas" ? "alunos" : tab === "eventos" ? "eventos" : null;

  const atual = TABS.find((t) => t.key === tab) ?? TABS[0];

  return (
    <SplitLayout nav={<SideNav label="Áreas do Tracking" items={itensDaNavegacao} active={tab} onChange={trocarAba} />}>
      {/* Cabeçalho da área: o que é e, quando ela tem partes, as pílulas do
          nível 2 — no conteúdo, nunca na barra do nível 1. */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[20px] font-semibold leading-tight text-text-primary">{atual.label}</h2>
          <p className="mt-1 text-[13px] text-text-tertiary">{DESCRICAO[tab]}</p>
        </div>
        {subAbas.length > 0 && (
          <SegmentedControl
            label={`Partes de ${atual.label}`}
            options={subAbas}
            value={subAtual(tab) ?? subAbas[0].key}
            onChange={trocarSub}
          />
        )}
      </header>

      {abaDeAnalise && (
        <AnalyticsTab
          productId={productId}
          initialReport={initialReport}
          initialEvents={initialEvents}
          subTab={abaDeAnalise}
          tableTab={performanceSubTab}
          filtroAlunos={filtroAlunos}
          onIrParaAnuncios={() => trocarAba("anuncios")}
        />
      )}

      {tab === "anuncios" && (
        <AdsSettings
          productId={productId}
          plataforma={plataformaAds}
          onTrocarPlataforma={trocarPlataforma}
          accounts={adCredentials}
          setAccounts={setAdCredentials}
        />
      )}

      {tab === "rastreamento" && rastreamentoSubTab === "script" && (
        <>
          <TrackingScriptPanel productSlug={productSlug} />
          <EventosMetaPanel productId={productId} />
          <EnviosCapiPanel productId={productId} />
        </>
      )}

      {tab === "rastreamento" && rastreamentoSubTab === "links" && (
        <>
          <LinkBuilder productSlug={productSlug} />
          <UtmBuilder productId={productId} />
        </>
      )}

      {tab === "integracoes" && integracoesSubTab === "fontes" && (
        <FontesDeDadosPanel productId={productId} endpoints={endpoints} setEndpoints={setEndpoints} />
      )}

      {tab === "integracoes" && integracoesSubTab === "automacoes" && (
        <Bloco
          titulo="WhatsApp — SendPulse"
          descricao="Cada compra aprovada e cada contrato assinado dispara o evento correspondente no SendPulse, que inicia o fluxo de mensagens do plano daquele aluno."
        >
          <SendPulsePanel productId={productId} />
        </Bloco>
      )}
    </SplitLayout>
  );
}
