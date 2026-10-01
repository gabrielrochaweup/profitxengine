"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Pencil, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bloco, Cartao, ItemMenu, MenuMais, Ponto, Vazio } from "./ui";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip";
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

export function PixelsPanel({ productId, platform }: { productId: string; platform: "meta" | "google" }) {
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
      platform={platform}
      pixels={pixels.filter((p) => p.platform === platform)}
      onUpsert={(p) => setPixels((prev) => (prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev]))}
      onRemove={(id) => setPixels((prev) => prev.filter((p) => p.id !== id))}
    />
  );
}

function PlatformSection({
  productId,
  platform,
  pixels,
  onUpsert,
  onRemove,
}: {
  productId: string;
  platform: "meta" | "google";
  pixels: Pixel[];
  onUpsert: (p: Pixel) => void;
  onRemove: (id: string) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <Bloco
      titulo={platform === "meta" ? "Pixel da Meta" : "Tag do Google"}
      dica={
        <Tooltip
          text={
            platform === "meta"
              ? "Quais eventos saem pra Meta (PageView, Lead, InitiateCheckout, Purchase, Deposit) você escolhe em Ferramentas > Rastreamento. Purchase e Deposit saem do servidor e precisam do token da API de Conversões."
              : "Pelo navegador, o script manda só o page_view, usando o Conversion ID (AW-...). Se a página já tiver a mesma tag, não manda de novo."
          }
        />
      }
      acoes={
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          {platform === "meta" ? "Adicionar pixel" : "Adicionar tag"}
        </Button>
      }
    >
      <p className="-mt-1 mb-3 text-[11px] text-text-tertiary">
        {platform === "meta" ? "Pixel ID + token da API de Conversões." : "Conversion ID do Google Ads (AW-...)."}
      </p>

      {pixels.length === 0 ? (
        <Cartao>
          <Vazio>
            {platform === "meta" ? "Nenhum pixel da Meta conectado ainda." : "Nenhuma tag do Google conectada ainda."}
          </Vazio>
        </Cartao>
      ) : (
        <div className="divide-y divide-border rounded-card bg-card shadow-card [&>*:first-child]:rounded-t-card [&>*:last-child]:rounded-b-card">
          {pixels.map((pixel) => (
            <PixelRow key={pixel.id} pixel={pixel} onUpsert={onUpsert} onRemove={onRemove} />
          ))}
        </div>
      )}

      <CreatePixelModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        productId={productId}
        platform={platform}
        onCreated={(p) => {
          onUpsert(p);
          setCreateOpen(false);
        }}
      />
    </Bloco>
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
    <div className="px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Nome do pixel"
                className="h-8 w-48 text-xs"
              />
              <Button size="sm" onClick={saveLabel} disabled={saving}>
                Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRenaming(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate text-[13px] font-medium text-text-primary">
                {pixel.label || pixel.pixel_id}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px]">
                <Ponto tom={pixel.active ? "ok" : "neutro"} />
                <span className="text-text-tertiary">{pixel.active ? "Ativo" : "Inativo"}</span>
              </span>
              {pixel.platform === "meta" && (
                <span className="inline-flex items-center gap-1.5 text-[11px]">
                  <Ponto tom={pixel.has_capi_token ? "ok" : "alerta"} />
                  <span className={pixel.has_capi_token ? "text-text-tertiary" : "text-warning"}>
                    {pixel.has_capi_token ? "Purchase configurado" : "Sem token de Purchase"}
                  </span>
                </span>
              )}
            </div>
          )}
          <p className="mt-0.5 text-[11px] text-text-tertiary">
            <code className="font-mono">{pixel.pixel_id}</code>
          </p>
        </div>

        {!renaming && (
          <div className="flex shrink-0 items-center gap-1.5">
            {pixel.platform === "meta" && (
              <Button size="sm" variant="secondary" onClick={() => setEditingToken((v) => !v)}>
                {pixel.has_capi_token ? "Trocar token" : "Adicionar token"}
              </Button>
            )}
            <MenuMais>
              {(fechar) => (
                <>
                  <ItemMenu
                    icone={<Pencil size={13} />}
                    onClick={() => {
                      setRenaming(true);
                      fechar();
                    }}
                  >
                    Renomear
                  </ItemMenu>
                  <ItemMenu
                    icone={<Power size={13} />}
                    onClick={() => {
                      toggleActive();
                      fechar();
                    }}
                  >
                    {pixel.active ? "Desativar" : "Ativar"}
                  </ItemMenu>
                  <ItemMenu
                    perigo
                    icone={<Trash2 size={13} />}
                    onClick={() => {
                      remove();
                      fechar();
                    }}
                  >
                    Excluir
                  </ItemMenu>
                </>
              )}
            </MenuMais>
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
  platform,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  /** Vem da aba aberta — não existe mais escolha dentro do formulário. */
  platform: "meta" | "google";
  onCreated: (p: Pixel) => void;
}) {
  const toast = useToast();
  const [pixelId, setPixelId] = useState("");
  const [label, setLabel] = useState("");
  const [capiToken, setCapiToken] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
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
      title={platform === "meta" ? "Adicionar pixel da Meta" : "Adicionar tag do Google"}
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            {platform === "meta" ? "Pixel ID" : "Conversion ID (ex: AW-123456789)"}
          </label>
          <Input value={pixelId} onChange={(e) => setPixelId(e.target.value)} placeholder={platform === "meta" ? "672e1aeacb5e59472fdecb53" : "AW-123456789"} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            Nome <span className="text-text-muted/70">(opcional, só pra identificar aqui)</span>
          </label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Pixel principal" />
        </div>

        {platform === "meta" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">
              Token da API de Conversões <span className="text-text-muted/70">(opcional — sem ele os eventos do navegador funcionam, mas Purchase e Deposit não saem pelo servidor)</span>
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
