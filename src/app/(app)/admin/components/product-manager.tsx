"use client";

import { useState } from "react";
import { Plus, Trash2 } from "@/components/ui/icones";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { CreateProductModal } from "@/components/layout/product-modals";
import { DEFAULT_PRODUCT_SLUG, nicheLabel } from "@/lib/products";
import type { Database } from "@/lib/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type AdminUser = Database["public"]["Functions"]["admin_list_users"]["Returns"][number];

interface ProductManagerProps {
  initialProducts: Product[];
  users: AdminUser[];
}

// Este painel NÃO gerencia mais quem vê cada produto: desde a migration
// 0112, todo usuário aprovado enxerga os produtos ativos. A lista de
// caixinhas por usuário saiu daqui porque tinha virado um controle que não
// controlava nada — marcar ou desmarcar não mudaria o que a pessoa vê.
//
// Pra tirar o acesso de alguém: Equipe, acima, mudando o status dela. Pra
// tirar um produto de todo mundo: desative o produto.
export function ProductManager({ initialProducts, users }: ProductManagerProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [products, setProducts] = useState(initialProducts);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const approvedUsers = users.filter((u) => u.status === "approved" && u.role !== "admin");
  const admins = users.filter((u) => u.status === "approved" && u.role === "admin");

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
        "Apaga o produto e TUDO que é exclusivo dele — tarefas, prompts e imagens. Ação irreversível.",
      confirmLabel: "Excluir produto",
      danger: true,
    });
    if (!ok) return;
    setDeletingId(product.id);
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
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
                    {approvedUsers.length + admins.length} pessoas aprovadas
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
                <div className="mt-3 border-t border-border pt-3">
                  <p className="mb-2 text-xs text-text-muted">
                    Todo mundo aprovado enxerga este produto. Pra tirar alguém, mude o status da pessoa em
                    Equipe; pra tirar o produto de todos, desative o produto.
                  </p>
                  <div className="space-y-1.5">
                    {[...admins, ...approvedUsers].map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm"
                      >
                        <span className="truncate text-text-secondary">{u.full_name || u.email}</span>
                        {u.role === "admin" && <span className="text-[11px] text-text-muted">admin</span>}
                      </div>
                    ))}
                    {approvedUsers.length + admins.length === 0 && (
                      <p className="text-xs text-text-muted">Nenhum usuário aprovado ainda.</p>
                    )}
                  </div>
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
