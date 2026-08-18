"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { CreateProductModal } from "@/components/layout/product-tabs";
import { DEFAULT_PRODUCT_SLUG, nicheLabel } from "@/lib/products";
import type { Database } from "@/lib/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductAccessRow = Database["public"]["Tables"]["product_access"]["Row"];
type AdminUser = Database["public"]["Functions"]["admin_list_users"]["Returns"][number];

interface ProductManagerProps {
  initialProducts: Product[];
  initialAccess: ProductAccessRow[];
  users: AdminUser[];
  currentUserId: string;
}

// Admin sempre vê todos os produtos automaticamente (checado em código via
// role, não precisa de linha em product_access) — esse painel só gerencia
// quem MAIS enxerga cada produto.
export function ProductManager({ initialProducts, initialAccess, users, currentUserId }: ProductManagerProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [products, setProducts] = useState(initialProducts);
  const [access, setAccess] = useState(initialAccess);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Admins ficam de fora da lista — eles já veem todos os produtos
  // automaticamente (checado por role em (app)/layout.tsx), marcar/
  // desmarcar aqui não teria efeito nenhum.
  const approvedUsers = users.filter((u) => u.status === "approved" && u.role !== "admin");

  async function toggleAccess(productId: string, userId: string, hasAccess: boolean) {
    const key = `${productId}:${userId}`;
    setBusyKey(key);
    const supabase = createClient();
    if (hasAccess) {
      const { error } = await supabase
        .from("product_access")
        .delete()
        .eq("product_id", productId)
        .eq("user_id", userId);
      if (!error) {
        setAccess((prev) => prev.filter((a) => !(a.product_id === productId && a.user_id === userId)));
      } else {
        toast.error("Erro ao remover acesso. Tente novamente.");
      }
    } else {
      const { data, error } = await supabase
        .from("product_access")
        .insert({ product_id: productId, user_id: userId, granted_by: currentUserId })
        .select()
        .single();
      if (!error && data) {
        setAccess((prev) => [...prev, data]);
      } else {
        toast.error("Erro ao liberar acesso. Tente novamente.");
      }
    }
    setBusyKey(null);
  }

  async function handleDeleteProduct(product: Product) {
    if (product.slug === DEFAULT_PRODUCT_SLUG) {
      toast.error("Esse é o produto padrão do sistema, não pode ser excluído.");
      return;
    }
    if (products.length <= 1) {
      toast.error("Precisa sobrar pelo menos um produto.");
      return;
    }
    const ok = await confirm({
      title: `Excluir "${product.name}"`,
      description:
        "Apaga o produto e TUDO que é exclusivo dele — tarefas, prompts, imagens e o acesso liberado pra cada usuário. Ação irreversível.",
      confirmLabel: "Excluir produto",
      danger: true,
    });
    if (!ok) return;
    setDeletingId(product.id);
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setAccess((prev) => prev.filter((a) => a.product_id !== product.id));
      if (expandedId === product.id) setExpandedId(null);
    } else {
      toast.error("Erro ao excluir o produto. Tente novamente.");
    }
    setDeletingId(null);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-text-primary">Produtos ({products.length})</h2>
        <Button type="button" size="sm" onClick={() => setCreating(true)}>
          <Plus size={14} />
          Novo produto
        </Button>
      </div>

      <div className="space-y-2">
        {products.map((product) => {
          const productAccess = new Set(access.filter((a) => a.product_id === product.id).map((a) => a.user_id));
          const expanded = expandedId === product.id;
          return (
            <div key={product.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : product.id)}
                  className="flex flex-1 items-center justify-between text-left"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <span>{product.icon || "✨"}</span>
                    {product.name}
                    <span className="rounded-button bg-card-hover px-1.5 py-0.5 text-[11px] font-normal text-text-muted">
                      {nicheLabel(product.niche)}
                    </span>
                  </span>
                  <span className="text-xs text-text-muted">
                    {productAccess.size} de {approvedUsers.length} usuários (+ admins)
                  </span>
                </button>
                {product.slug !== DEFAULT_PRODUCT_SLUG && (
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(product)}
                    disabled={deletingId === product.id}
                    title="Excluir produto"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-card-hover hover:text-danger disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {expanded && (
                <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                  {approvedUsers.map((u) => {
                    const hasAccess = productAccess.has(u.id);
                    const key = `${product.id}:${u.id}`;
                    return (
                      <label
                        key={u.id}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-card-hover"
                      >
                        <span className="truncate text-text-secondary">{u.full_name || u.email}</span>
                        <input
                          type="checkbox"
                          checked={hasAccess}
                          disabled={busyKey === key}
                          onChange={() => toggleAccess(product.id, u.id, hasAccess)}
                        />
                      </label>
                    );
                  })}
                  {approvedUsers.length === 0 && (
                    <p className="text-xs text-text-muted">Nenhum usuário aprovado ainda.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {products.length === 0 && <p className="text-sm text-text-muted">Nenhum produto criado ainda.</p>}
      </div>

      <CreateProductModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(product) => setProducts((prev) => [...prev, product])}
      />
    </div>
  );
}
