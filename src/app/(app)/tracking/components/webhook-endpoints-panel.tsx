"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { CHECKOUT_PLATFORMS } from "@/lib/tracking/checkout-adapters";
import { MEMBERS_AREA_PLATFORMS } from "@/lib/tracking/members-area-adapters";
import { BROKER_PLATFORMS } from "@/lib/tracking/broker-adapters";
import { CONTRACT_PLATFORMS } from "@/lib/tracking/contract-adapters";
import { TOOL_PLATFORMS } from "@/lib/tracking/tool-adapters";

export interface WebhookEndpoint {
  id: string;
  product_id: string;
  kind: "checkout" | "members_area" | "broker" | "contract" | "tool";
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
};

const KIND_PATH: Record<WebhookEndpoint["kind"], string> = {
  checkout: "checkout",
  members_area: "members-area",
  broker: "broker",
  contract: "contract-signed",
  tool: "tool",
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
  return BROKER_PLATFORMS;
}

interface WebhookLogEntry {
  id: string;
  raw_payload: Record<string, unknown>;
  accepted: boolean;
  error: string | null;
  received_at: string;
}

export function WebhookEndpointsPanel({
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

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">Webhooks</h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          Gerar novo endpoint
        </Button>
      </div>
      <p className="mb-3 text-xs text-text-secondary">
        Um endpoint por página de vendas/plataforma — crie, renomeie ou troque quando precisar.
      </p>

      {endpoints.length === 0 ? (
        <p className="text-xs text-text-muted">Nenhum endpoint configurado ainda.</p>
      ) : (
        <div className="space-y-2">
          {endpoints.map((endpoint) => (
            <div key={endpoint.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card-hover p-3">
              <div className="min-w-0">
                {renamingId === endpoint.id ? (
                  <div className="flex items-center gap-2">
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
                  <div className="flex items-center gap-2">
                    <Select value={platformDraft} onChange={(e) => setPlatformDraft(e.target.value)} className="h-8 w-48 text-xs">
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {endpoint.label || endpointSubtitle(endpoint)}
                    </span>
                    {endpoint.label && <span className="text-[11px] text-text-muted">· {endpointSubtitle(endpoint)}</span>}
                    <Badge tone={endpoint.active ? "success" : "neutral"}>{endpoint.active ? "Ativo" : "Inativo"}</Badge>
                    {endpoint.last_test_ok === true && <Badge tone="success">Testado ✓</Badge>}
                    {endpoint.last_test_ok === false && <Badge tone="danger">Teste falhou</Badge>}
                  </div>
                )}
                <p className="mt-1 truncate text-xs text-text-muted">{endpointUrl(endpoint)}</p>
                {endpoint.last_test_ok === null && (
                  <p className="mt-0.5 text-[11px] text-text-muted">Ainda não testado — clique em &quot;Testar&quot;.</p>
                )}
              </div>
              {renamingId !== endpoint.id && editingPlatformId !== endpoint.id && (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setLabelDraft(endpoint.label ?? "");
                      setRenamingId(endpoint.id);
                    }}
                  >
                    Renomear
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setPlatformDraft(endpoint.platform ?? platformsFor(endpoint.kind)[0] ?? "generic");
                      setEditingPlatformId(endpoint.id);
                    }}
                  >
                    Trocar plataforma
                  </Button>
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
                  <Button size="sm" variant="secondary" onClick={() => rotateSecret(endpoint)}>
                    Rotacionar token
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleLogs(endpoint)}>
                    {logsOpenId === endpoint.id ? "Fechar payloads" : "Ver payloads"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(endpoint)}>
                    {endpoint.active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteEndpoint(endpoint)}>
                    Excluir
                  </Button>
                </div>
              )}

              {logsOpenId === endpoint.id && (
                <div className="mt-3 w-full border-t border-border pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-medium text-text-muted">
                      Últimas chamadas reais recebidas (não inclui os cliques em &quot;Testar&quot;)
                    </p>
                    <Button size="sm" variant="ghost" onClick={() => loadLogs(endpoint)} disabled={loadingLogsId === endpoint.id}>
                      {loadingLogsId === endpoint.id ? "Atualizando..." : "Atualizar"}
                    </Button>
                  </div>

                  {loadingLogsId === endpoint.id && !logsById[endpoint.id] ? (
                    <p className="text-xs text-text-muted">Carregando...</p>
                  ) : (logsById[endpoint.id]?.length ?? 0) === 0 ? (
                    <p className="text-xs text-text-muted">
                      Nenhuma chamada real chegou ainda nesse endpoint. Assim que a plataforma externa disparar algo,
                      aparece aqui — mesmo que seja rejeitado.
                    </p>
                  ) : (
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {logsById[endpoint.id].map((log) => (
                        <div key={log.id} className="rounded-input bg-card p-2.5">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <Badge tone={log.accepted ? "success" : "danger"}>{log.accepted ? "Aceito" : "Rejeitado"}</Badge>
                            <span className="text-[11px] text-text-muted">{new Date(log.received_at).toLocaleString("pt-BR")}</span>
                          </div>
                          {log.error && <p className="mb-1.5 text-[11px] text-danger">{log.error}</p>}
                          <pre className="overflow-x-auto whitespace-pre rounded-input bg-input px-2.5 py-2 text-[11px] text-text-secondary">
                            {JSON.stringify(log.raw_payload, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateEndpointModal
        open={createOpen}
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
    </Card>
  );
}

function CreateEndpointModal({
  open,
  onClose,
  onCreate,
  hasBroker,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (kind: WebhookEndpoint["kind"], platform: string | null, label: string | null) => void;
  hasBroker: boolean;
}) {
  const [kind, setKind] = useState<WebhookEndpoint["kind"]>("checkout");
  const [platform, setPlatform] = useState(CHECKOUT_PLATFORMS[0] ?? "generic");
  const [label, setLabel] = useState("");

  const platformOptions = platformsFor(kind);

  function changeKind(nextKind: WebhookEndpoint["kind"]) {
    setKind(nextKind);
    setPlatform(platformsFor(nextKind)[0] ?? "generic");
  }

  function reset() {
    setKind("checkout");
    setPlatform(CHECKOUT_PLATFORMS[0] ?? "generic");
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
