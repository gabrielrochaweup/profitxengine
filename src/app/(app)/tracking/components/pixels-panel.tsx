"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

export interface Pixel {
  id: string;
  platform: "meta" | "google";
  pixel_id: string;
  label: string | null;
  active: boolean;
  has_capi_token: boolean;
  created_at: string;
}

export function PixelsPanel({ productId, productSlug }: { productId: string; productSlug: string }) {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const toast = useToast();

  useEffect(() => {
    fetch(`/api/tracking/pixels?product_id=${productId}`)
      .then((r) => r.json())
      .then((json) => setPixels(json.pixels ?? []))
      .catch(() => toast.error("Falha ao carregar pixels."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return (
    <PlatformSection
      productId={productId}
      productSlug={productSlug}
      pixels={pixels}
      onUpsert={(p) => setPixels((prev) => (prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev]))}
      onRemove={(id) => setPixels((prev) => prev.filter((p) => p.id !== id))}
    />
  );
}

function PlatformSection({
  productId,
  productSlug,
  pixels,
  onUpsert,
  onRemove,
}: {
  productId: string;
  productSlug: string;
  pixels: Pixel[];
  onUpsert: (p: Pixel) => void;
  onRemove: (id: string) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">Pixels</h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          Adicionar pixel
        </Button>
      </div>
      <p className="mb-3 text-xs text-text-secondary">
        Além de ler o gasto (aba acima), o pixel dispara os eventos padrão de verdade: <strong>PageView</strong> a cada
        visita, <strong>Lead</strong> no primeiro toque, <strong>InitiateCheckout</strong> no clique do link de
        checkout — tudo pelo script já instalado em {productSlug}. <strong>Purchase</strong> (só Meta, via API de
        Conversões) dispara do lado do servidor quando o webhook de compra chega — por isso precisa do token da API de
        Conversões, não só do Pixel ID.
      </p>

      {pixels.length === 0 ? (
        <p className="text-xs text-text-muted">Nenhum pixel conectado ainda.</p>
      ) : (
        <div className="space-y-2">
          {pixels.map((pixel) => (
            <PixelRow key={pixel.id} pixel={pixel} onUpsert={onUpsert} onRemove={onRemove} />
          ))}
        </div>
      )}

      <CreatePixelModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        productId={productId}
        onCreated={(p) => {
          onUpsert(p);
          setCreateOpen(false);
        }}
      />
    </Card>
  );
}

function PixelRow({ pixel, onUpsert, onRemove }: { pixel: Pixel; onUpsert: (p: Pixel) => void; onRemove: (id: string) => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [renaming, setRenaming] = useState(false);
  const [label, setLabel] = useState(pixel.label ?? "");
  const [editingToken, setEditingToken] = useState(false);
  const [tokenDraft, setTokenDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveLabel() {
    setSaving(true);
    const res = await fetch(`/api/tracking/pixels/${pixel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() || null }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(json.error ?? "Falha ao renomear.");
      return;
    }
    onUpsert(json.pixel);
    setRenaming(false);
  }

  async function saveToken() {
    setSaving(true);
    const res = await fetch(`/api/tracking/pixels/${pixel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capi_token: tokenDraft.trim() || null }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(json.error ?? "Falha ao salvar token.");
      return;
    }
    onUpsert(json.pixel);
    setEditingToken(false);
    setTokenDraft("");
    toast.success("Token salvo.");
  }

  async function toggleActive() {
    const res = await fetch(`/api/tracking/pixels/${pixel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !pixel.active }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error("Falha ao atualizar.");
      return;
    }
    onUpsert(json.pixel);
  }

  async function remove() {
    const ok = await confirm({
      title: "Excluir pixel",
      description: `Excluir "${pixel.label || pixel.pixel_id}"? Ele para de disparar eventos imediatamente.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/tracking/pixels/${pixel.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Falha ao excluir.");
      return;
    }
    onRemove(pixel.id);
    toast.success("Pixel removido.");
  }

  return (
    <div className="rounded-xl bg-card-hover p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          {renaming ? (
            <div className="flex items-center gap-2">
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nome do pixel" className="h-8 w-48 text-xs" />
              <Button size="sm" onClick={saveLabel} disabled={saving}>
                Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRenaming(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">{pixel.label || pixel.pixel_id}</span>
              <Badge tone="neutral">{pixel.platform === "meta" ? "Meta" : "Google"}</Badge>
              <Badge tone={pixel.active ? "success" : "neutral"}>{pixel.active ? "Ativo" : "Inativo"}</Badge>
              {pixel.platform === "meta" && (
                <Badge tone={pixel.has_capi_token ? "success" : "warning"}>
                  {pixel.has_capi_token ? "Purchase configurado" : "Sem token de Purchase"}
                </Badge>
              )}
            </div>
          )}
          <p className="mt-1 text-xs text-text-muted">
            ID <code>{pixel.pixel_id}</code>
          </p>
        </div>

        {!renaming && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setRenaming(true)}>
              Renomear
            </Button>
            {pixel.platform === "meta" && (
              <Button size="sm" variant="secondary" onClick={() => setEditingToken((v) => !v)}>
                {pixel.has_capi_token ? "Trocar token" : "Adicionar token"}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={toggleActive}>
              {pixel.active ? "Desativar" : "Ativar"}
            </Button>
            <Button size="sm" variant="danger" onClick={remove}>
              Excluir
            </Button>
          </div>
        )}
      </div>

      {editingToken && (
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="password"
            value={tokenDraft}
            onChange={(e) => setTokenDraft(e.target.value)}
            placeholder="Token da API de Conversões (Events Manager > Configurações)"
            className="h-8 flex-1 text-xs"
          />
          <Button size="sm" onClick={saveToken} disabled={saving || !tokenDraft.trim()}>
            Salvar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingToken(false)}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}

function CreatePixelModal({
  open,
  onClose,
  productId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  onCreated: (p: Pixel) => void;
}) {
  const toast = useToast();
  const [platform, setPlatform] = useState<"meta" | "google">("meta");
  const [pixelId, setPixelId] = useState("");
  const [label, setLabel] = useState("");
  const [capiToken, setCapiToken] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setPlatform("meta");
    setPixelId("");
    setLabel("");
    setCapiToken("");
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/tracking/pixels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        platform,
        pixel_id: pixelId.trim(),
        label: label.trim() || null,
        capi_token: platform === "meta" ? capiToken.trim() || null : null,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(json.error ?? "Falha ao adicionar pixel.");
      return;
    }
    onCreated(json.pixel);
    reset();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Adicionar pixel"
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPlatform("meta")}
            className={`flex-1 rounded-input px-3 py-2 text-sm font-medium ${platform === "meta" ? "bg-accent text-white" : "bg-card-hover text-text-secondary"}`}
          >
            Meta Pixel
          </button>
          <button
            type="button"
            onClick={() => setPlatform("google")}
            className={`flex-1 rounded-input px-3 py-2 text-sm font-medium ${platform === "google" ? "bg-accent text-white" : "bg-card-hover text-text-secondary"}`}
          >
            Google Ads
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">
            {platform === "meta" ? "Pixel ID" : "Conversion ID (ex: AW-123456789)"}
          </label>
          <Input value={pixelId} onChange={(e) => setPixelId(e.target.value)} placeholder={platform === "meta" ? "672e1aeacb5e59472fdecb53" : "AW-123456789"} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">
            Nome <span className="text-text-muted/70">(opcional, só pra identificar aqui)</span>
          </label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Pixel principal" />
        </div>

        {platform === "meta" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">
              Token da API de Conversões <span className="text-text-muted/70">(opcional — sem ele, PageView/Lead/InitiateCheckout funcionam, mas Purchase não)</span>
            </label>
            <Input
              type="password"
              value={capiToken}
              onChange={(e) => setCapiToken(e.target.value)}
              placeholder="Events Manager > Configurações > API de Conversões"
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving || !pixelId.trim()}>
            {saving ? "Salvando..." : "Adicionar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
