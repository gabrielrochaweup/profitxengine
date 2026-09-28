"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { ChevronDown, Pencil, Plus, RefreshCw, Power, Trash2, FileJson, Replace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { CHECKOUT_PLATFORMS } from "@/lib/tracking/checkout-adapters";
import { MEMBERS_AREA_PLATFORMS } from "@/lib/tracking/members-area-adapters";
import { BROKER_PLATFORMS } from "@/lib/tracking/broker-adapters";
import { CONTRACT_PLATFORMS } from "@/lib/tracking/contract-adapters";
import { TOOL_PLATFORMS } from "@/lib/tracking/tool-adapters";
import { Bloco, ItemMenu, MenuMais, Ponto } from "./ui";
import { cn } from "@/lib/utils";

export interface WebhookEndpoint {
  id: string;
  product_id: string;
  kind: "checkout" | "members_area" | "broker" | "contract" | "tool" | "daily_results";
  platform: string | null;
  label: string | null;
  endpoint_slug: string;
  active: boolean;
  last_test_at: string | null;
  last_test_ok: boolean | null;
  created_at: string;
}

const KIND_LABEL: Record<WebhookEndpoint["kind"], string> = {
  checkout: "Checkout",
  members_area: "Área de membros",
  broker: "Corretora",
  contract: "Contrato assinado",
  tool: "Ferramenta",
  daily_results: "Resultados do dia",
};

const KIND_PATH: Record<WebhookEndpoint["kind"], string> = {
  checkout: "checkout",
  members_area: "members-area",
  broker: "broker",
  contract: "contract-signed",
  tool: "tool",
  // A Vortex espera exatamente este caminho (tela dela: ".../resultados-do-dia/...").
  daily_results: "resultados-do-dia",
};

function endpointUrl(endpoint: WebhookEndpoint): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/api/tracking/webhooks/${KIND_PATH[endpoint.kind]}/${endpoint.endpoint_slug}`;
}

function endpointSubtitle(endpoint: WebhookEndpoint): string {
  return `${KIND_LABEL[endpoint.kind]}${endpoint.platform ? ` · ${endpoint.platform}` : ""}`;
}

function platformsFor(kind: WebhookEndpoint["kind"]): string[] {
  if (kind === "checkout") return CHECKOUT_PLATFORMS;
  if (kind === "members_area") return MEMBERS_AREA_PLATFORMS;
  if (kind === "contract") return CONTRACT_PLATFORMS;
  if (kind === "tool") return TOOL_PLATFORMS;
  if (kind === "daily_results") return ["vortex"];
  return BROKER_PLATFORMS;
}

/*
  As fontes de dados, na linguagem de quem configura.

  "Webhook" é a implementação; o que a pessoa quer é conectar o checkout, a
  área de membros, a corretora. Cada fonte abaixo é uma dessas conexões — a
  descrição e o formato do payload vieram do guia que existia numa aba
  separada, e agora moram dentro da própria fonte que explicam.

  A landing não tem endpoint: ela é o script no site, e por isso não aparece
  com "nenhum endpoint ainda" como se estivesse faltando alguma coisa.
*/
type FonteKind = WebhookEndpoint["kind"] | "landing";

interface Fonte {
  kind: FonteKind;
  nome: string;
  descricao: string;
  contrato?: string;
}

const FONTES: Fonte[] = [
  {
    kind: "landing",
    nome: "Landing / qualquer site",
    descricao:
      'O script (Ferramentas → Rastreamento) gera um lead_id único no navegador de quem clicou no anúncio e guarda em cookie + localStorage. Esse lead_id é o fio que conecta todo o resto. Cole o mesmo script em quantas páginas de vendas você quiser — ele já funciona sozinho em qualquer uma.',
  },
  {
    kind: "checkout",
    nome: "Checkout",
    descricao:
      'Se o botão de comprar usar window.ProfitXTracking.appendRef(url) (com "ref" ou o parâmetro que a plataforma exigir — algumas, como a Onprofit, só devolvem "sck") no link de checkout, a plataforma pode devolver esse valor no webhook de compra aprovada. Use o "Gerador de link" em Ferramentas → Rastreamento pra montar esse link sem digitar nada na mão. Cada plataforma/página de vendas nova é uma conexão nova — pode criar quantas precisar.',
    contrato:
      '{ "event": "purchase", "email": "...", "ref": "<lead_id ou null>", "external_id": "...", "amount_cents": 49700, "occurred_at": "..." }',
  },
  {
    kind: "members_area",
    nome: "Área de membros",
    descricao:
      '(a) Disparar um webhook pra gente no primeiro acesso do aluno. (b) — o passo mais importante — o botão "Abrir minha conta na corretora" dentro da área de membros precisa levar esse mesmo identificador adiante, como ?ref=<lead_id>&email=<email_do_aluno> na URL de cadastro da corretora. Se a área de membros não souber o ref (porque o checkout não propagou), ainda dá pra passar só o e-mail. Assim como o checkout, cada área de membros diferente (por curso, por plataforma) é uma conexão própria.',
    contrato:
      '{ "event": "first_login", "email": "...", "ref": "<lead_id ou null>", "external_id": "<id do aluno>", "occurred_at": "..." }',
  },
  {
    kind: "contract",
    nome: "Contrato assinado",
    descricao:
      "Quem repassa a assinatura do contrato pra cá. É o que marca o aluno como assinado na aba Pessoas e o que dispara a mensagem de pós-contrato no WhatsApp (Configurações → Automações).",
  },
  {
    kind: "broker",
    nome: "Corretora",
    descricao:
      "Ao abrir a conta, a corretora lê o ref/email/click_id que veio na URL de cadastro e devolve isso no webhook — é aqui que a gente sabe que ESSE lead específico virou conta na corretora. O mesmo webhook, disparado de novo no primeiro depósito, é o que fecha o funil.",
    contrato:
      '{ "event": "REGISTER" | "DEPOSIT_PAYED" | ..., "email": "...", "ref"/"click_id": "<lead_id ou null>", "external_id": "...", "amount_cents": 45000, "occurred_at": "..." } — formato final confirmado assim que virmos um payload real da corretora',
  },
  {
    kind: "tool",
    nome: "Ferramenta",
    descricao:
      "Cadastro e primeiro acesso do aluno na ferramenta (o Pepe). É o que alimenta a coluna Pepe na aba Pessoas e os cadastros por plano na Visão geral.",
  },
  {
    kind: "daily_results",
    nome: "Resultados do dia",
    descricao:
      'O placar de Live, PEPE e Copy que a equipe lança na Vortex. Assim que o dia é salvo lá, chega aqui e vai direto pras mensagens das Dinâmicas do Dia (Dia = placar do dia, Semana = últimos 7 dias, Mês e Total = últimos 30 dias). Cole a URL e o token na tela "Resultados do dia para o ProfitX Engine" da Vortex — o mesmo token é o que o botão "Atualizar resultados" usa pra ir buscar lá.',
    contrato:
      '{ "data": "2026-09-20", "preenchido": true, "texto": "...", "live" | "pepe" | "copy": { "operou": true, "placar", "taxa", "rentabilidade" (só copy), acumulado de 7 e 30 dias } }',
  },
];

/**
 * Estado de uma fonte, a partir dos endpoints que existem.
 *
 * "Conectada" exige pelo menos um endpoint com teste OK — só ter criado aqui
 * não prova nada, porque ainda falta colar a URL e o token no painel da
 * plataforma externa.
 */
function estadoDaFonte(
  fonte: Fonte,
  endpoints: WebhookEndpoint[]
): { tom: "ok" | "alerta" | "neutro"; texto: string; conectada: boolean } {
  if (fonte.kind === "landing") return { tom: "ok", texto: "Já funciona sozinho", conectada: true };

  const doTipo = endpoints.filter((e) => e.kind === fonte.kind);
  if (doTipo.length === 0) return { tom: "neutro", texto: "Não conectada", conectada: false };

  const testados = doTipo.filter((e) => e.last_test_ok === true).length;
  if (testados > 0) {
    return {
      tom: "ok",
      texto: doTipo.length === 1 ? "Conectada e testada" : `${testados} de ${doTipo.length} testadas`,
      conectada: true,
    };
  }
  return { tom: "alerta", texto: "Criada — falta testar", conectada: false };
}

interface WebhookLogEntry {
  id: string;
  raw_payload: Record<string, unknown>;
  accepted: boolean;
  error: string | null;
  received_at: string;
}

export function FontesDeDadosPanel({
  productId,
  endpoints,
  setEndpoints,
}: {
  productId: string;
  endpoints: WebhookEndpoint[];
  setEndpoints: Dispatch<SetStateAction<WebhookEndpoint[]>>;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [createOpen, setCreateOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState("");
  const [editingPlatformId, setEditingPlatformId] = useState<string | null>(null);
  const [platformDraft, setPlatformDraft] = useState("");
  const [revealedSecret, setRevealedSecret] = useState<{ endpoint: WebhookEndpoint; secret: string } | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [logsOpenId, setLogsOpenId] = useState<string | null>(null);
  const [logsById, setLogsById] = useState<Record<string, WebhookLogEntry[]>>({});
  const [loadingLogsId, setLoadingLogsId] = useState<string | null>(null);
  // Qual fonte está aberta. Uma por vez: a tela é uma lista de conexões, e
  // seis blocos técnicos abertos ao mesmo tempo é o que ela era antes.
  const [fonteAberta, setFonteAberta] = useState<FonteKind | null>(null);
  const [kindNovo, setKindNovo] = useState<WebhookEndpoint["kind"]>("checkout");

  const hasBroker = endpoints.some((e) => e.kind === "broker");

  async function loadLogs(endpoint: WebhookEndpoint) {
    setLoadingLogsId(endpoint.id);
    try {
      const res = await fetch(`/api/tracking/endpoints/${endpoint.id}/log`);
      const json = await res.json();
      setLogsById((prev) => ({ ...prev, [endpoint.id]: json.logs ?? [] }));
    } catch {
      toast.error("Falha ao carregar payloads recebidos.");
    } finally {
      setLoadingLogsId(null);
    }
  }

  function toggleLogs(endpoint: WebhookEndpoint) {
    if (logsOpenId === endpoint.id) {
      setLogsOpenId(null);
      return;
    }
    setLogsOpenId(endpoint.id);
    loadLogs(endpoint);
  }

  async function testEndpoint(endpoint: WebhookEndpoint) {
    setTestingId(endpoint.id);
    try {
      const res = await fetch(`/api/tracking/endpoints/${endpoint.id}/test`, { method: "POST" });
      const json = await res.json();
      const now = new Date().toISOString();
      setEndpoints((prev) =>
        prev.map((e) => (e.id === endpoint.id ? { ...e, last_test_at: now, last_test_ok: !!json.ok } : e))
      );
      if (json.ok) {
        toast.success("Teste ok — o endpoint recebeu e entendeu o payload corretamente.");
      } else {
        toast.error(json.error ?? "O teste falhou.");
      }
    } catch {
      toast.error("Falha ao chamar o endpoint de teste.");
    } finally {
      setTestingId(null);
    }
  }

  async function createEndpoint(kind: WebhookEndpoint["kind"], platform: string | null, label: string | null) {
    const res = await fetch("/api/tracking/endpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, kind, platform, label }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Falha ao criar endpoint.");
      return;
    }
    setEndpoints((prev) => [json.endpoint, ...prev]);
    setCreateOpen(false);
    setFonteAberta(kind);
    setRevealedSecret({ endpoint: json.endpoint, secret: json.secret });
  }

  async function saveLabel(endpoint: WebhookEndpoint) {
    const nextLabel = labelDraft.trim() || null;
    const res = await fetch(`/api/tracking/endpoints/${endpoint.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: nextLabel }),
    });
    if (!res.ok) {
      toast.error("Falha ao renomear.");
      return;
    }
    setEndpoints((prev) => prev.map((e) => (e.id === endpoint.id ? { ...e, label: nextLabel } : e)));
    setRenamingId(null);
  }

  async function savePlatform(endpoint: WebhookEndpoint) {
    const res = await fetch(`/api/tracking/endpoints/${endpoint.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: platformDraft }),
    });
    if (!res.ok) {
      toast.error("Falha ao trocar a plataforma.");
      return;
    }
    setEndpoints((prev) => prev.map((e) => (e.id === endpoint.id ? { ...e, platform: platformDraft } : e)));
    setEditingPlatformId(null);
    toast.success("Plataforma atualizada.");
  }

  async function rotateSecret(endpoint: WebhookEndpoint) {
    const res = await fetch(`/api/tracking/endpoints/${endpoint.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rotate" }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Falha ao rotacionar.");
      return;
    }
    setRevealedSecret({ endpoint, secret: json.secret });
    toast.success("Novo token gerado — o anterior deixou de funcionar.");
  }

  async function toggleActive(endpoint: WebhookEndpoint) {
    const nextActive = !endpoint.active;
    const res = await fetch(`/api/tracking/endpoints/${endpoint.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: nextActive }),
    });
    if (!res.ok) {
      toast.error("Falha ao atualizar.");
      return;
    }
    setEndpoints((prev) => prev.map((e) => (e.id === endpoint.id ? { ...e, active: nextActive } : e)));
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copiado.");
  }

  async function deleteEndpoint(endpoint: WebhookEndpoint) {
    const ok = await confirm({
      title: "Excluir endpoint",
      description: `Excluir "${endpoint.label || endpointSubtitle(endpoint)}"? A URL para de funcionar imediatamente.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;

    const res = await fetch(`/api/tracking/endpoints/${endpoint.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Falha ao excluir.");
      return;
    }
    setEndpoints((prev) => prev.filter((e) => e.id !== endpoint.id));
    toast.success("Endpoint excluído.");
  }

  /**
   * A linha de um endpoint — o nível técnico de uma fonte.
   *
   * É uma função e não um componente de verdade porque fecha sobre os
   * handlers (testar, renomear, rotacionar, excluir...) que vivem aqui em
   * cima. Transformar em componente exigiria passar dez callbacks por prop
   * pra mudar exatamente nada na tela.
   */
  function linhaDeEndpoint(endpoint: WebhookEndpoint) {
    return (
      <div key={endpoint.id} className="px-4 py-3">
      {renamingId === endpoint.id ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            placeholder={endpointSubtitle(endpoint)}
            className="h-8 w-56 text-xs"
            autoFocus
          />
          <Button size="sm" onClick={() => saveLabel(endpoint)}>
            Salvar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
            Cancelar
          </Button>
        </div>
      ) : editingPlatformId === endpoint.id ? (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={platformDraft}
            onChange={(e) => setPlatformDraft(e.target.value)}
            className="h-8 w-48 text-xs"
          >
            {platformsFor(endpoint.kind).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={() => savePlatform(endpoint)}>
            Salvar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingPlatformId(null)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[13px] font-medium text-text-primary">
                {endpoint.label || endpointSubtitle(endpoint)}
              </span>
              {endpoint.label && (
                <span className="text-[11px] text-text-tertiary">{endpointSubtitle(endpoint)}</span>
              )}
              {/* Estado em ponto + palavra: eram até três selos por
                  linha, e com oito endpoints a lista virava um
                  mosaico colorido onde nada saltava. */}
              <span className="inline-flex items-center gap-1.5 text-[11px]">
                <Ponto tom={endpoint.active ? "ok" : "neutro"} />
                <span className="text-text-tertiary">{endpoint.active ? "Ativo" : "Inativo"}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px]">
                <Ponto
                  tom={
                    endpoint.last_test_ok === true
                      ? "ok"
                      : endpoint.last_test_ok === false
                        ? "erro"
                        : "neutro"
                  }
                />
                <span
                  className={
                    endpoint.last_test_ok === false ? "text-danger" : "text-text-tertiary"
                  }
                >
                  {endpoint.last_test_ok === true
                    ? "Testado"
                    : endpoint.last_test_ok === false
                      ? "Teste falhou"
                      : "Nunca testado"}
                </span>
              </span>
            </div>
            <p className="mt-1 truncate font-mono text-[11px] text-text-tertiary" title={endpointUrl(endpoint)}>
              {endpointUrl(endpoint)}
            </p>
          </div>

          {/* Visível o que se usa toda hora; o resto a um clique. */}
          <div className="flex shrink-0 items-center gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => copy(endpointUrl(endpoint))}>
              Copiar URL
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => testEndpoint(endpoint)}
              disabled={testingId === endpoint.id}
            >
              {testingId === endpoint.id ? "Testando..." : "Testar"}
            </Button>
            <MenuMais>
              {(fechar) => (
                <>
                  <ItemMenu
                    icone={<FileJson size={13} />}
                    onClick={() => {
                      toggleLogs(endpoint);
                      fechar();
                    }}
                  >
                    {logsOpenId === endpoint.id ? "Fechar payloads" : "Ver payloads"}
                  </ItemMenu>
                  <ItemMenu
                    icone={<Pencil size={13} />}
                    onClick={() => {
                      setLabelDraft(endpoint.label ?? "");
                      setRenamingId(endpoint.id);
                      fechar();
                    }}
                  >
                    Renomear
                  </ItemMenu>
                  <ItemMenu
                    icone={<Replace size={13} />}
                    onClick={() => {
                      setPlatformDraft(endpoint.platform ?? platformsFor(endpoint.kind)[0] ?? "generic");
                      setEditingPlatformId(endpoint.id);
                      fechar();
                    }}
                  >
                    Trocar plataforma
                  </ItemMenu>
                  <ItemMenu
                    icone={<RefreshCw size={13} />}
                    onClick={() => {
                      rotateSecret(endpoint);
                      fechar();
                    }}
                  >
                    Rotacionar token
                  </ItemMenu>
                  <ItemMenu
                    icone={<Power size={13} />}
                    onClick={() => {
                      toggleActive(endpoint);
                      fechar();
                    }}
                  >
                    {endpoint.active ? "Desativar" : "Ativar"}
                  </ItemMenu>
                  <ItemMenu
                    perigo
                    icone={<Trash2 size={13} />}
                    onClick={() => {
                      deleteEndpoint(endpoint);
                      fechar();
                    }}
                  >
                    Excluir
                  </ItemMenu>
                </>
              )}
            </MenuMais>
          </div>
        </div>
      )}

      {logsOpenId === endpoint.id && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-medium text-text-tertiary">
              Últimas chamadas reais recebidas (não inclui os cliques em &quot;Testar&quot;)
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => loadLogs(endpoint)}
              disabled={loadingLogsId === endpoint.id}
            >
              {loadingLogsId === endpoint.id ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>

          {loadingLogsId === endpoint.id && !logsById[endpoint.id] ? (
            <p className="text-xs text-text-tertiary">Carregando...</p>
          ) : (logsById[endpoint.id]?.length ?? 0) === 0 ? (
            <p className="max-w-[80ch] text-xs text-text-tertiary">
              Nenhuma chamada real chegou ainda nesse endpoint. Assim que a plataforma externa disparar algo,
              aparece aqui — mesmo que seja rejeitado.
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {logsById[endpoint.id].map((log) => (
                <div key={log.id} className="rounded-input border border-border bg-card-hover p-2.5">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1.5">
                      <Ponto tom={log.accepted ? "ok" : "erro"} />
                      <span className={log.accepted ? "text-text-tertiary" : "text-danger"}>
                        {log.accepted ? "Aceito" : "Rejeitado"}
                      </span>
                    </span>
                    <span className="font-mono text-text-muted">
                      {new Date(log.received_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  {log.error && <p className="mb-1.5 text-[11px] text-danger">{log.error}</p>}
                  <pre className="overflow-x-auto whitespace-pre rounded-input bg-input px-2.5 py-2 font-mono text-[11px] text-text-secondary">
                    {JSON.stringify(log.raw_payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    );
  }

  return (
    <Bloco
      titulo="Fontes de dados"
      acoes={
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setKindNovo("checkout");
            setCreateOpen(true);
          }}
        >
          <Plus size={14} />
          Nova conexão
        </Button>
      }
    >
      <p className="-mt-1 mb-3 max-w-[80ch] text-[11px] text-text-tertiary">
        De onde o sistema recebe o que acontece com o lead. Cada fonte fica verde depois de um teste que deu certo —
        criar aqui não basta, a URL e o token precisam estar colados do outro lado.
      </p>

      {/* A lista fala a linguagem de quem configura: checkout, área de
          membros, corretora. O endpoint — URL, token, payload — aparece ao
          abrir a fonte, que é onde ele faz sentido. */}
      <div className="divide-y divide-border rounded-card bg-card shadow-card [&>*:first-child]:rounded-t-card [&>*:last-child]:rounded-b-card">
        {FONTES.map((fonte) => {
          const estado = estadoDaFonte(fonte, endpoints);
          const doTipo = fonte.kind === "landing" ? [] : endpoints.filter((e) => e.kind === fonte.kind);
          const plataformas = Array.from(new Set(doTipo.map((e) => e.platform).filter(Boolean)));
          const aberta = fonteAberta === fonte.kind;
          return (
            <div key={fonte.kind}>
              <button
                type="button"
                onClick={() => setFonteAberta(aberta ? null : fonte.kind)}
                className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-card-hover"
              >
                <Ponto tom={estado.tom} />
                <span className="text-[13px] font-medium text-text-primary">{fonte.nome}</span>
                {/* O nome real da plataforma conectada, quando existe — é o
                    que responde "conectado com o quê?" sem precisar abrir. */}
                {plataformas.length > 0 && (
                  <span className="text-[11px] text-text-secondary">{plataformas.join(" · ")}</span>
                )}
                <span className="text-[11px] text-text-tertiary">· {estado.texto}</span>
                <ChevronDown
                  size={15}
                  className={cn("ml-auto shrink-0 text-text-tertiary transition-transform", aberta && "rotate-180")}
                />
              </button>

              {aberta && (
                <div className="border-t border-border bg-card-hover/40">
                  <div className="px-4 py-3">
                    <p className="max-w-[90ch] text-xs leading-relaxed text-text-secondary">{fonte.descricao}</p>
                    {fonte.contrato && (
                      <code className="mt-2 block overflow-x-auto whitespace-pre rounded-input border border-border bg-input px-3 py-2 font-mono text-[11px] text-text-secondary">
                        {fonte.contrato}
                      </code>
                    )}
                  </div>

                  {fonte.kind !== "landing" && (
                    <div className="border-t border-border">
                      <div className="flex items-center justify-between gap-2 px-4 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                          Endpoints desta fonte
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setKindNovo(fonte.kind as WebhookEndpoint["kind"]);
                            setCreateOpen(true);
                          }}
                        >
                          <Plus size={13} />
                          Adicionar
                        </Button>
                      </div>
                      {doTipo.length === 0 ? (
                        <p className="px-4 pb-3 text-[11px] text-text-tertiary">
                          Nenhum endpoint dessa fonte ainda.
                        </p>
                      ) : (
                        <div className="divide-y divide-border">{doTipo.map((e) => linhaDeEndpoint(e))}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CreateEndpointModal
        open={createOpen}
        kindInicial={kindNovo}
        onClose={() => setCreateOpen(false)}
        onCreate={createEndpoint}
        hasBroker={hasBroker}
      />

      <Modal open={!!revealedSecret} onClose={() => setRevealedSecret(null)} title="Endpoint criado">
        {revealedSecret && (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Copie a URL e o token agora — o token não é mostrado de novo depois de fechar esta janela.
            </p>
            <div>
              <p className="mb-1 text-xs font-medium text-text-muted">URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-input bg-accent-soft px-3 py-2 text-xs">
                  {endpointUrl(revealedSecret.endpoint)}
                </code>
                <Button size="sm" variant="secondary" onClick={() => copy(endpointUrl(revealedSecret.endpoint))}>
                  Copiar
                </Button>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-text-muted">Token (Authorization: Bearer ...)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-input bg-accent-soft px-3 py-2 text-xs">
                  {revealedSecret.secret}
                </code>
                <Button size="sm" variant="secondary" onClick={() => copy(revealedSecret.secret)}>
                  Copiar
                </Button>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-text-muted">
                URL com token embutido <span className="text-text-muted/70">(use essa se a plataforma não tiver campo pra header customizado — cola direto no lugar da URL, sozinha)</span>
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-input bg-accent-soft px-3 py-2 text-xs">
                  {`${endpointUrl(revealedSecret.endpoint)}?token=${revealedSecret.secret}`}
                </code>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copy(`${endpointUrl(revealedSecret.endpoint)}?token=${revealedSecret.secret}`)}
                >
                  Copiar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Bloco>
  );
}

function CreateEndpointModal({
  open,
  kindInicial,
  onClose,
  onCreate,
  hasBroker,
}: {
  open: boolean;
  /** A fonte de onde o botão foi clicado — o modal abre já nela. */
  kindInicial: WebhookEndpoint["kind"];
  onClose: () => void;
  onCreate: (kind: WebhookEndpoint["kind"], platform: string | null, label: string | null) => void;
  hasBroker: boolean;
}) {
  const [kind, setKind] = useState<WebhookEndpoint["kind"]>(kindInicial);
  const [platform, setPlatform] = useState(platformsFor(kindInicial)[0] ?? "generic");
  const [label, setLabel] = useState("");

  const platformOptions = platformsFor(kind);

  function changeKind(nextKind: WebhookEndpoint["kind"]) {
    setKind(nextKind);
    setPlatform(platformsFor(nextKind)[0] ?? "generic");
  }

  function reset() {
    setKind(kindInicial);
    setPlatform(platformsFor(kindInicial)[0] ?? "generic");
    setLabel("");
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Novo endpoint de webhook"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Origem</label>
          <Select value={kind} onChange={(e) => changeKind(e.target.value as WebhookEndpoint["kind"])}>
            <option value="checkout">Checkout</option>
            <option value="members_area">Área de membros</option>
            <option value="broker">Corretora</option>
            <option value="contract">Contrato assinado</option>
            <option value="tool">Ferramenta</option>
            <option value="daily_results">Resultados do dia</option>
          </Select>
          {kind === "broker" && hasBroker && (
            <p className="mt-1 text-[11px] text-text-muted">
              Você já tem um endpoint de Corretora — normalmente só precisa de um, mas criar outro não tem problema
              (por exemplo, pra trocar de corretora ou testar uma configuração nova antes de excluir a antiga).
            </p>
          )}
        </div>

        {platformOptions.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Plataforma</label>
            <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {platformOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            Nome <span className="text-text-muted/70">(opcional, só pra identificar aqui — ex: &quot;Curso X — Hotmart&quot;)</span>
          </label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Método TRIAD — Onprofit" />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onCreate(kind, platformOptions.length > 0 ? platform : null, label.trim() || null);
              reset();
            }}
          >
            Criar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
