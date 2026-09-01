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

export interface WebhookEndpoint {
  id: string;
  product_id: string;
  kind: "checkout" | "members_area" | "broker";
  platform: string | null;
  label: string | null;
  endpoint_slug: string;
  active: boolean;
  created_at: string;
}

const KIND_LABEL: Record<WebhookEndpoint["kind"], string> = {
  checkout: "Checkout",
  members_area: "Área de membros",
  broker: "Corretora",
};

const KIND_PATH: Record<WebhookEndpoint["kind"], string> = {
  checkout: "checkout",
  members_area: "members-area",
  broker: "broker",
};

function endpointUrl(endpoint: WebhookEndpoint): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/api/tracking/webhooks/${KIND_PATH[endpoint.kind]}/${endpoint.endpoint_slug}`;
}

function endpointSubtitle(endpoint: WebhookEndpoint): string {
  return `${KIND_LABEL[endpoint.kind]}${endpoint.platform ? ` · ${endpoint.platform}` : ""}`;
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
  const [revealedSecret, setRevealedSecret] = useState<{ endpoint: WebhookEndpoint; secret: string } | null>(null);

  const hasBroker = endpoints.some((e) => e.kind === "broker");

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
        <h3 className="text-sm font-medium text-text-primary">Webhooks</h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          Gerar novo endpoint
        </Button>
      </div>
      <p className="mb-3 text-xs text-text-secondary">
        Dá pra ter vários endpoints de Checkout e de Área de membros — um pra cada página de vendas/plataforma. A
        Corretora é a exceção: só existe um endpoint dela por produto, compartilhado por todas as páginas.
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
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {endpoint.label || endpointSubtitle(endpoint)}
                    </span>
                    {endpoint.label && <span className="text-[11px] text-text-muted">· {endpointSubtitle(endpoint)}</span>}
                    <Badge tone={endpoint.active ? "success" : "neutral"}>{endpoint.active ? "Ativo" : "Inativo"}</Badge>
                  </div>
                )}
                <p className="mt-1 truncate text-xs text-text-muted">{endpointUrl(endpoint)}</p>
              </div>
              {renamingId !== endpoint.id && (
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
                  <Button size="sm" variant="secondary" onClick={() => copy(endpointUrl(endpoint))}>
                    Copiar URL
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => rotateSecret(endpoint)}>
                    Rotacionar token
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(endpoint)}>
                    {endpoint.active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteEndpoint(endpoint)}>
                    Excluir
                  </Button>
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
                <code className="flex-1 truncate rounded-input bg-input px-3 py-2 text-xs">
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
                <code className="flex-1 truncate rounded-input bg-input px-3 py-2 text-xs">
                  {revealedSecret.secret}
                </code>
                <Button size="sm" variant="secondary" onClick={() => copy(revealedSecret.secret)}>
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
          <label className="mb-1 block text-xs font-medium text-text-muted">Origem</label>
          <Select value={kind} onChange={(e) => setKind(e.target.value as WebhookEndpoint["kind"])}>
            <option value="checkout">Checkout</option>
            <option value="members_area">Área de membros</option>
            <option value="broker" disabled={hasBroker}>
              Corretora{hasBroker ? " (já existe um endpoint)" : ""}
            </option>
          </Select>
          {kind === "broker" && hasBroker && (
            <p className="mt-1 text-[11px] text-warning">
              Já existe um endpoint de Corretora pra esse produto — só pode ter um, já que a corretora é a mesma pra
              todas as páginas de venda. Exclua o atual antes de criar outro.
            </p>
          )}
        </div>

        {kind === "checkout" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Plataforma</label>
            <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {CHECKOUT_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">
            Nome <span className="text-text-muted/70">(opcional, só pra identificar aqui — ex: &quot;Curso X — Hotmart&quot;)</span>
          </label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Método TRIAD — Onprofit" />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={kind === "broker" && hasBroker}
            onClick={() => {
              onCreate(kind, kind === "checkout" ? platform : null, label.trim() || null);
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
