"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [revealedSecret, setRevealedSecret] = useState<{ endpoint: WebhookEndpoint; secret: string } | null>(null);

  async function createEndpoint(kind: WebhookEndpoint["kind"], platform: string | null) {
    const res = await fetch("/api/tracking/endpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, kind, platform }),
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
      description: `Excluir o endpoint de ${KIND_LABEL[endpoint.kind]}${endpoint.platform ? ` (${endpoint.platform})` : ""}? A URL para de funcionar imediatamente.`,
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
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">Webhooks</h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          Gerar novo endpoint
        </Button>
      </div>

      {endpoints.length === 0 ? (
        <p className="text-xs text-text-muted">Nenhum endpoint configurado ainda.</p>
      ) : (
        <div className="space-y-2">
          {endpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    {KIND_LABEL[endpoint.kind]}
                    {endpoint.platform ? ` · ${endpoint.platform}` : ""}
                  </span>
                  <Badge tone={endpoint.active ? "success" : "neutral"}>{endpoint.active ? "Ativo" : "Inativo"}</Badge>
                </div>
                <p className="mt-1 truncate text-xs text-text-muted">{endpointUrl(endpoint)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
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
            </div>
          ))}
        </div>
      )}

      <CreateEndpointModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createEndpoint} />

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
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (kind: WebhookEndpoint["kind"], platform: string | null) => void;
}) {
  const [kind, setKind] = useState<WebhookEndpoint["kind"]>("broker");
  const [platform, setPlatform] = useState(CHECKOUT_PLATFORMS[0] ?? "generic");

  return (
    <Modal open={open} onClose={onClose} title="Novo endpoint de webhook">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Origem</label>
          <Select value={kind} onChange={(e) => setKind(e.target.value as WebhookEndpoint["kind"])}>
            <option value="broker">Corretora</option>
            <option value="members_area">Área de membros</option>
            <option value="checkout">Checkout</option>
          </Select>
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

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onCreate(kind, kind === "checkout" ? platform : null)}>Criar</Button>
        </div>
      </div>
    </Modal>
  );
}
