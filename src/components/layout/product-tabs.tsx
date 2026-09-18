"use client";

import { useState, type MouseEvent } from "react";
import { Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { useActiveProduct } from "./active-product-context";
import { NICHE_OPTIONS, DEFAULT_PRODUCT_SLUG } from "@/lib/products";
import type { Database } from "@/lib/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

interface ProductTabsProps {
  initialProducts: Product[];
  isAdmin: boolean;
}

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "produto";
}

// Barra de produtos no topo do app (desktop) — trocador de workspace, não
// abas de navegador de verdade: clicar só troca o estado ativo
// (ActiveProductProvider), sem navegar pra lugar nenhum.
export function ProductTabs({ initialProducts, isAdmin }: ProductTabsProps) {
  const { activeProduct, setActiveProduct } = useActiveProduct();
  const toast = useToast();
  const confirm = useConfirm();
  const [products, setProducts] = useState(initialProducts);
  const [creating, setCreating] = useState(false);

  async function deleteProduct(product: Product, e: MouseEvent) {
    e.stopPropagation();
    if (products.length <= 1) {
      toast.error("Precisa ter pelo menos um produto.");
      return;
    }
    const ok = await confirm({
      title: "Desativar produto",
      description: `Desativar "${product.name}"? Ele some da barra pra todo mundo, mas os dados (tarefas, conversas, tracking, etc.) continuam salvos — se precisar, dá pra reativar depois.`,
      confirmLabel: "Desativar",
      danger: true,
    });
    if (!ok) return;

    const supabase = createClient();
    const { error } = await supabase.from("products").update({ active: false }).eq("id", product.id);
    if (error) {
      toast.error("Falha ao desativar o produto.");
      return;
    }

    const remaining = products.filter((p) => p.id !== product.id);
    setProducts(remaining);
    toast.success(`"${product.name}" desativado.`);

    if (activeProduct === product.slug) {
      const next = remaining.find((p) => p.slug === DEFAULT_PRODUCT_SLUG) ?? remaining[0];
      if (next) setActiveProduct(next.slug);
    }
  }

  return (
    <div className="flex items-center gap-1.5 rounded-panel bg-sidebar shadow-card p-1.5">
      {products.map((p) => (
        <div
          key={p.id}
          className={cn(
            "group flex items-center gap-1 rounded-button py-1.5 pl-3 text-sm font-medium transition-colors",
            isAdmin ? "pr-1.5" : "pr-3",
            activeProduct === p.slug
              ? "bg-accent text-accent-contrast"
              : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
          )}
        >
          <button type="button" onClick={() => setActiveProduct(p.slug)} className="flex items-center gap-1.5">
            <span>{p.icon || "✨"}</span>
            {p.name}
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={(e) => deleteProduct(p, e)}
              title="Desativar produto"
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100",
                activeProduct === p.slug ? "hover:bg-white/20" : "hover:bg-card-hover"
              )}
            >
              <X size={11} />
            </button>
          )}
        </div>
      ))}

      {isAdmin && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          title="Novo produto"
          className="flex h-8 w-8 items-center justify-center rounded-button text-text-secondary hover:bg-card-hover hover:text-text-primary"
        >
          <Plus size={16} />
        </button>
      )}

      <CreateProductModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(product) => {
          setProducts((prev) => [...prev, product]);
          setActiveProduct(product.slug);
        }}
      />
    </div>
  );
}

export function CreateProductModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (product: Product) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✨");
  const [niche, setNiche] = useState<string>(NICHE_OPTIONS[0].value);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("products")
      .insert({
        slug: slugify(name),
        name: name.trim(),
        icon: icon.trim() || null,
        niche,
        created_by: user?.id ?? null,
      })
      .select()
      .single();
    if (!error && data) {
      onCreated(data);
      setName("");
      setIcon("✨");
      setNiche(NICHE_OPTIONS[0].value);
      onClose();
    } else {
      toast.error("Erro ao criar o produto. Tente novamente.");
    }
    setSaving(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo produto">
      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_80px] gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Produto 2" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Ícone</label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="✨" className="text-center" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Nicho</label>
          <Select value={niche} onChange={(e) => setNiche(e.target.value)}>
            {NICHE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <p className="text-[11px] text-text-muted">Define de onde vêm as notícias mostradas no Calendário.</p>
        </div>
        <Button type="button" onClick={handleCreate} disabled={saving || !name.trim()} className="w-full">
          {saving ? "Criando..." : "Criar produto"}
        </Button>
      </div>
    </Modal>
  );
}
