"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  Copy,
  FileJson,
  FileSignature,
  FlaskConical,
  Globe,
  GraduationCap,
  Info,
  Landmark,
  Pencil,
  Plus,
  RefreshCw,
  Replace,
  ShoppingCart,
  Trash2,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Bloco, BotaoIcone, CampoCopiavel, Interruptor } from "./ui";
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

// O token só sai do servidor quando alguém pede pra ver ou copiar; até lá
// a tela mostra a máscara, do mesmo tamanho pra todos.
const MASCARA = "••••••••••••••••";

function quando(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
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

// Um ícone por fonte: com oito linhas iguais, é ele que deixa achar a
// corretora ou o checkout sem ler.
const ICONE_DA_FONTE: Record<FonteKind, LucideIcon> = {
  landing: Globe,
  checkout: ShoppingCart,
  members_area: GraduationCap,
  contract: FileSignature,
  broker: Landmark,
  tool: Wrench,
  daily_results: BarChart3,
};

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
  // Tokens já buscados nesta visita — o segundo clique em copiar não vai de
  // novo ao servidor. Some ao sair da tela.
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [tokenVisivelId, setTokenVisivelId] = useState<string | null>(null);
  const [buscandoTokenId, setBuscandoTokenId] = useState<string | null>(null);
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
    setTokens((prev) => ({ ...prev, [json.endpoint.id]: json.secret }));
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

  // Com o botão à vista, rotacionar sem perguntar seria derrubar uma
  // integração que funciona com um clique distraído.
  async function rotateSecret(endpoint: WebhookEndpoint) {
    const ok = await confirm({
      title: "Rotacionar token",
      description: `O token atual de "${endpoint.label || endpointSubtitle(endpoint)}" para de funcionar na hora. A plataforma do outro lado só volta a enviar depois que você colar o token novo (ou a URL com token nova) lá.`,
      confirmLabel: "Gerar token novo",
      danger: true,
    });
    if (!ok) return;

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
    // Já fica na linha, revelado, pronto pra copiar e colar do outro lado.
    setTokens((prev) => ({ ...prev, [endpoint.id]: json.secret }));
    setTokenVisivelId(endpoint.id);
    toast.success("Token novo gerado — copie e cole do outro lado.");
  }

  async function obterToken(endpoint: WebhookEndpoint): Promise<string | null> {
    if (tokens[endpoint.id]) return tokens[endpoint.id];
    setBuscandoTokenId(endpoint.id);
    try {
      const res = await fetch(`/api/tracking/endpoints/${endpoint.id}/token`);
      const json = await res.json().catch(() => null);
      if (!res.ok || typeof json?.token !== "string") {
        toast.error(json?.error ?? "Falha ao ler o token.");
        return null;
      }
      setTokens((prev) => ({ ...prev, [endpoint.id]: json.token }));
      return json.token as string;
    } finally {
      setBuscandoTokenId(null);
    }
  }

  async function alternarToken(endpoint: WebhookEndpoint) {
    if (tokenVisivelId === endpoint.id) {
      setTokenVisivelId(null);
      return;
    }
    if (await obterToken(endpoint)) setTokenVisivelId(endpoint.id);
  }

  async function copiarSegredo(endpoint: WebhookEndpoint, qual: "token" | "url"): Promise<boolean> {
    const token = await obterToken(endpoint);
    if (!token) return false;
    return copy(qual === "token" ? token : `${endpointUrl(endpoint)}?token=${token}`);
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

  // Alguns navegadores recusam copiar depois de uma ida ao servidor (o
  // clique "expira"). Nesse caso o token já ficou guardado, e o segundo
  // clique copia na hora.
  // Nos campos, o próprio botão vira "Copiado" — um toast a mais só
  // repetiria. A mensagem é pra quem copia de fora de um campo.
  async function copy(text: string, mensagem?: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      if (mensagem) toast.success(mensagem);
      return true;
    } catch {
      toast.error("O navegador bloqueou a cópia — clique de novo em copiar.");
      return false;
    }
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
   * O cartão de um endpoint — uma conexão com uma plataforma externa.
   *
   * Três faixas, cada uma com um papel: o cabeçalho diz QUAL conexão é e
   * se está funcionando; o corpo tem o que se cola do outro lado; o rodapé
   * tem o que se FAZ com ela. Antes era tudo uma linha corrida, e duas
   * conexões seguidas se emendavam uma na outra.
   *
   * É uma função e não um componente porque fecha sobre os handlers que
   * vivem aqui em cima; como componente, seriam dez callbacks por prop.
   */
  function cartaoDeEndpoint(endpoint: WebhookEndpoint) {
    const url = endpointUrl(endpoint);
    const token = tokens[endpoint.id];
    const revelado = tokenVisivelId === endpoint.id && !!token;
    const buscando = buscandoTokenId === endpoint.id;
    const tokenNaTela = revelado ? token : MASCARA;
    const podeTrocarPlataforma = platformsFor(endpoint.kind).length > 1;
    const Icone = ICONE_DA_FONTE[endpoint.kind];

    return (
      <div
        key={endpoint.id}
        className={cn(
          "overflow-hidden rounded-card border border-border bg-card shadow-card-sm transition-opacity",
          !endpoint.active && "opacity-70"
        )}
      >
        {/* ── Cabeçalho: qual conexão, e se ela está de pé ── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-button bg-accent-soft text-accent-text">
            <Icone size={16} />
          </span>

          <div className="min-w-0">
            {renamingId === endpoint.id ? (
              <form
                className="flex items-center gap-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveLabel(endpoint);
                }}
              >
                <Input
                  value={labelDraft}
                  onChange={(e) => setLabelDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setRenamingId(null)}
                  placeholder="Ex: Método TRIAD — Onprofit"
                  className="h-8 w-64 text-xs"
                  autoFocus
                />
                <BotaoIcone titulo="Salvar nome" type="submit">
                  <Check size={15} />
                </BotaoIcone>
                <BotaoIcone titulo="Cancelar" onClick={() => setRenamingId(null)}>
                  <X size={15} />
                </BotaoIcone>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setLabelDraft(endpoint.label ?? "");
                  setRenamingId(endpoint.id);
                }}
                title="Editar o nome da conexão"
                className="group flex items-center gap-1.5 text-left"
              >
                {endpoint.label ? (
                  <span className="text-[14px] font-semibold text-text-primary">{endpoint.label}</span>
                ) : (
                  <span className="text-[14px] italic text-text-tertiary">Sem nome</span>
                )}
                <Pencil size={13} className="text-text-tertiary transition-colors group-hover:text-accent-text" />
              </button>
            )}

            {editingPlatformId === endpoint.id ? (
              <div className="mt-1 flex items-center gap-1">
                <Select value={platformDraft} onChange={(e) => setPlatformDraft(e.target.value)} className="h-7 w-40 text-xs">
                  {platformsFor(endpoint.kind).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
                <BotaoIcone titulo="Salvar plataforma" onClick={() => savePlatform(endpoint)} className="h-7 w-7">
                  <Check size={14} />
                </BotaoIcone>
                <BotaoIcone titulo="Cancelar" onClick={() => setEditingPlatformId(null)} className="h-7 w-7">
                  <X size={14} />
                </BotaoIcone>
              </div>
            ) : (
              <p className="mt-0.5 text-[11px] text-text-tertiary">
                {KIND_LABEL[endpoint.kind]}
                {endpoint.platform && (
                  <>
                    {" · "}
                    <span className="font-mono text-text-secondary">{endpoint.platform}</span>
                  </>
                )}
              </p>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Badge
              tone={endpoint.last_test_ok === true ? "success" : endpoint.last_test_ok === false ? "danger" : "neutral"}
            >
              {endpoint.last_test_ok === true
                ? `Testado${endpoint.last_test_at ? ` · ${quando(endpoint.last_test_at)}` : ""}`
                : endpoint.last_test_ok === false
                  ? "Último teste falhou"
                  : "Nunca testado"}
            </Badge>
            <Interruptor
              checked={endpoint.active}
              onChange={() => toggleActive(endpoint)}
              label={endpoint.active ? "Desativar conexão" : "Ativar conexão"}
            />
          </div>
        </div>

        {/* ── Corpo: o que se cola na plataforma do outro lado ── */}
        <div className="space-y-3 px-4 py-4">
          <CampoCopiavel rotulo="URL do webhook" valor={url} onCopiar={() => copy(url)} />
          <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <CampoCopiavel
              rotulo="Token"
              valor={tokenNaTela}
              secreto
              revelado={revelado}
              carregando={buscando}
              onAlternar={() => alternarToken(endpoint)}
              onCopiar={() => copiarSegredo(endpoint, "token")}
            />
            <CampoCopiavel
              rotulo="URL com token embutido"
              valor={`${url}?token=${tokenNaTela}`}
              secreto
              revelado={revelado}
              carregando={buscando}
              onAlternar={() => alternarToken(endpoint)}
              onCopiar={() => copiarSegredo(endpoint, "url")}
            />
          </div>
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-text-muted">
            <Info size={12} className="mt-0.5 shrink-0" />
            <span>
              A plataforma tem campo de token (ou &quot;Authorization&quot;)? Cole a <strong className="font-medium text-text-secondary">URL do webhook</strong> e o{" "}
              <strong className="font-medium text-text-secondary">Token</strong> separados. Só tem um campo de endereço? Use a{" "}
              <strong className="font-medium text-text-secondary">URL com token embutido</strong>.
            </span>
          </p>
        </div>

        {/* ── Rodapé: o que se faz com a conexão ── */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border bg-card-hover/50 px-4 py-2.5">
          <Button size="sm" variant="secondary" onClick={() => testEndpoint(endpoint)} disabled={testingId === endpoint.id}>
            <FlaskConical size={13} />
            {testingId === endpoint.id ? "Testando..." : "Testar"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => toggleLogs(endpoint)}>
            <FileJson size={13} />
            {logsOpenId === endpoint.id ? "Fechar payloads" : "Payloads recebidos"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => rotateSecret(endpoint)}>
            <RefreshCw size={13} />
            Rotacionar token
          </Button>
          {podeTrocarPlataforma && editingPlatformId !== endpoint.id && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setPlatformDraft(endpoint.platform ?? platformsFor(endpoint.kind)[0] ?? "generic");
                setEditingPlatformId(endpoint.id);
              }}
            >
              <Replace size={13} />
              Trocar plataforma
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ml-auto text-danger hover:bg-danger-soft hover:text-danger" onClick={() => deleteEndpoint(endpoint)}>
            <Trash2 size={13} />
            Excluir
          </Button>
        </div>

        {logsOpenId === endpoint.id && (
          <div className="border-t border-border bg-app/40 px-4 py-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                Últimas chamadas reais <span className="font-normal normal-case tracking-normal">(os cliques em &quot;Testar&quot; não entram)</span>
              </p>
              <Button size="sm" variant="ghost" onClick={() => loadLogs(endpoint)} disabled={loadingLogsId === endpoint.id}>
                <RefreshCw size={13} />
                {loadingLogsId === endpoint.id ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>

            {loadingLogsId === endpoint.id && !logsById[endpoint.id] ? (
              <p className="text-xs text-text-tertiary">Carregando...</p>
            ) : (logsById[endpoint.id]?.length ?? 0) === 0 ? (
              <p className="max-w-[80ch] text-xs text-text-tertiary">
                Nenhuma chamada real chegou ainda. Assim que a plataforma externa disparar algo, aparece aqui — mesmo que
                seja rejeitado.
              </p>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {logsById[endpoint.id].map((log) => (
                  <div key={log.id} className="overflow-hidden rounded-input border border-border bg-card">
                    <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-1.5 text-[11px]">
                      <Badge tone={log.accepted ? (log.error ? "warning" : "success") : "danger"}>
                        {log.accepted ? (log.error ? "Aceito com aviso" : "Aceito") : "Rejeitado"}
                      </Badge>
                      <span className="font-mono text-text-muted">{new Date(log.received_at).toLocaleString("pt-BR")}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto h-6 px-2"
                        onClick={() => copy(JSON.stringify(log.raw_payload, null, 2), "Payload copiado.")}
                      >
                        <Copy size={12} />
                        Copiar
                      </Button>
                    </div>
                    {log.error && (
                      <p className={cn("px-3 pt-2 text-[11px]", log.accepted ? "text-warning" : "text-danger")}>{log.error}</p>
                    )}
                    <pre className="max-h-64 overflow-auto px-3 py-2 font-mono text-[11px] text-text-secondary">
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
          membros, corretora. O técnico (URL, token, payload) aparece ao
          abrir a fonte, dentro de um cartão por conexão. */}
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
        {FONTES.map((fonte, i) => {
          const estado = estadoDaFonte(fonte, endpoints);
          const doTipo = fonte.kind === "landing" ? [] : endpoints.filter((e) => e.kind === fonte.kind);
          const plataformas = Array.from(new Set(doTipo.map((e) => e.platform).filter(Boolean)));
          const aberta = fonteAberta === fonte.kind;
          const Icone = ICONE_DA_FONTE[fonte.kind];
          return (
            <div key={fonte.kind} className={cn(i > 0 && "border-t border-border")}>
              <button
                type="button"
                onClick={() => setFonteAberta(aberta ? null : fonte.kind)}
                aria-expanded={aberta}
                className={cn(
                  "flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-card-hover",
                  aberta && "bg-card-hover"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-button",
                    estado.tom === "ok"
                      ? "bg-success-soft text-success"
                      : estado.tom === "alerta"
                        ? "bg-warning-soft text-warning"
                        : "bg-card-hover text-text-tertiary"
                  )}
                >
                  <Icone size={15} />
                </span>
                <span className="text-[13px] font-semibold text-text-primary">{fonte.nome}</span>
                {/* Com o quê está conectado — responde sem precisar abrir. */}
                {plataformas.map((p) => (
                  <span key={p} className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-text-secondary">
                    {p}
                  </span>
                ))}
                <span
                  className={cn(
                    "ml-auto text-[11px]",
                    estado.tom === "ok" ? "text-success" : estado.tom === "alerta" ? "text-warning" : "text-text-tertiary"
                  )}
                >
                  {estado.texto}
                </span>
                <ChevronDown
                  size={15}
                  className={cn("shrink-0 text-text-tertiary transition-transform", aberta && "rotate-180")}
                />
              </button>

              {aberta && (
                <div className="space-y-4 border-t border-border bg-app/50 px-4 py-4">
                  {/* Sobre a fonte: explicação, não coisa pra copiar. */}
                  <div className="flex gap-2.5 rounded-input border border-border bg-card px-3.5 py-3">
                    <Info size={15} className="mt-0.5 shrink-0 text-accent-text" />
                    <div className="min-w-0 space-y-2">
                      <p className="max-w-[95ch] text-[12px] leading-relaxed text-text-secondary">{fonte.descricao}</p>
                      {fonte.contrato && (
                        <details className="group">
                          <summary className="flex cursor-pointer list-none items-center gap-1 text-[11px] font-medium text-accent-text hover:underline">
                            <ChevronDown size={12} className="-rotate-90 transition-transform group-open:rotate-0" />
                            Ver o formato do payload esperado
                          </summary>
                          <code className="mt-2 block overflow-x-auto whitespace-pre rounded-input border border-border bg-input px-3 py-2 font-mono text-[11px] text-text-secondary">
                            {fonte.contrato}
                          </code>
                        </details>
                      )}
                    </div>
                  </div>

                  {fonte.kind !== "landing" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                          Conexões desta fonte <span className="text-text-secondary">· {doTipo.length}</span>
                        </p>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="shrink-0 whitespace-nowrap"
                          onClick={() => {
                            setKindNovo(fonte.kind as WebhookEndpoint["kind"]);
                            setCreateOpen(true);
                          }}
                        >
                          <Plus size={13} />
                          Nova conexão
                        </Button>
                      </div>
                      {doTipo.length === 0 ? (
                        <div className="rounded-card border border-dashed border-border px-4 py-6 text-center text-[12px] text-text-tertiary">
                          Nenhuma conexão dessa fonte ainda. Crie uma e cole a URL e o token na plataforma.
                        </div>
                      ) : (
                        <div className="space-y-3">{doTipo.map((e) => cartaoDeEndpoint(e))}</div>
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
              Cole a URL e o token na plataforma do outro lado. Se precisar de novo depois, é só abrir esta conexão
              em Fontes de dados — tem botão de copiar para cada um.
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
