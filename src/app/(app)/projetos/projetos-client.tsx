"use client";

import { FaixaTitulo } from "@/components/ui/faixa";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Pencil, Plus, Power } from "@/components/ui/icones";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { CreateProductModal, EditProductModal } from "@/components/layout/product-modals";
import { useActiveProduct } from "@/components/layout/active-product-context";
import { DEFAULT_PRODUCT_SLUG, nicheLabel } from "@/lib/products";
import type { Database } from "@/lib/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

export function ProjetosClient({ produtosIniciais }: { produtosIniciais: Product[] }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { activeProduct, setActiveProduct } = useActiveProduct();

  const [produtos, setProdutos] = useState(produtosIniciais);
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<Product | null>(null);

  async function desativar(produto: Product) {
    const ok = await confirm({
      title: "Desativar projeto",
      description: `Desativar "${produto.name}"? Ele some da barra pra todo mundo, mas os dados (tarefas, conversas, tracking, imagens) continuam salvos — a exclusão definitiva, essa sim sem volta, fica no Admin.`,
      confirmLabel: "Desativar",
      danger: true,
    });
    if (!ok) return;

    const supabase = createClient();
    const { error } = await supabase.from("products").update({ active: false }).eq("id", produto.id);
    if (error) {
      toast.error("Não deu pra desativar o projeto.");
      return;
    }

    const restantes = produtos.filter((p) => p.id !== produto.id);
    setProdutos(restantes);
    toast.success(`"${produto.name}" desativado.`);

    // Quem estava com ele aberto precisa cair em algum lugar — senão a barra
    // fica sem nenhuma aba marcada.
    if (activeProduct === produto.slug) {
      const proximo = restantes.find((p) => p.slug === DEFAULT_PRODUCT_SLUG) ?? restantes[0];
      if (proximo) setActiveProduct(proximo.slug);
    }
    router.refresh();
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <FaixaTitulo>Projetos ({produtos.length})</FaixaTitulo>
        <Button type="button" size="sm" onClick={() => setCriando(true)}>
          <Plus size={14} />
          Novo projeto
        </Button>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-card bg-card shadow-card">
        {produtos.map((produto) => {
          const padrao = produto.slug === DEFAULT_PRODUCT_SLUG;
          return (
            <div key={produto.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-button bg-card-hover text-[15px]">
                {produto.icon || "✨"}
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-text-primary">
                  {produto.name}
                  {padrao && (
                    <span className="inline-flex items-center gap-1 rounded-button bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent-text">
                      <Lock size={9} />
                      Projeto padrão
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-text-tertiary">
                  <code className="text-text-secondary">{produto.slug}</code> · {nicheLabel(produto.niche)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button type="button" size="sm" variant="secondary" onClick={() => setEditando(produto)}>
                  <Pencil size={13} />
                  Renomear
                </Button>
                {padrao ? (
                  // Sem botão desabilitado: um botão apagado convida o clique e
                  // não responde. A frase diz o que o botão diria.
                  <span className="text-[11px] text-text-muted">Não pode ser excluído</span>
                ) : (
                  <Button type="button" size="sm" variant="danger" onClick={() => desativar(produto)}>
                    <Power size={13} />
                    Desativar
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {produtos.length === 0 && (
          <p className="px-4 py-6 text-center text-[12px] text-text-tertiary">Nenhum projeto ativo.</p>
        )}
      </div>

      <div className="mt-3 rounded-card border border-border bg-card-hover/40 px-4 py-3">
        <p className="text-[12px] font-medium text-text-secondary">
          O <strong className="text-text-primary">PROFITX</strong> é o projeto padrão do sistema e não pode ser
          excluído.
        </p>
        <p className="mt-1 text-[11px] text-text-tertiary">
          É pra ele que o app volta quando alguém perde acesso a um projeto ou quando um projeto é desativado — sem
          ele, a barra de cima ficaria sem nenhuma aba pra abrir. Todos os outros, criados aqui ou pelo “+” da barra,
          podem ser desativados a qualquer momento.
        </p>
      </div>

      <CreateProductModal
        open={criando}
        onClose={() => setCriando(false)}
        onCreated={(produto) => {
          setProdutos((atual) => [...atual, produto]);
          router.refresh();
        }}
      />

      {editando && (
        <EditProductModal
          // A chave remonta o modal a cada projeto: os campos nascem com o
          // valor daquele projeto, sem efeito nenhum pra sincronizar.
          key={editando.id}
          product={editando}
          onClose={() => setEditando(null)}
          onSaved={(produto) => {
            setProdutos((atual) => atual.map((p) => (p.id === produto.id ? produto : p)));
            // O nome também aparece em página renderizada no servidor (o
            // título do quadro de Tarefas, por exemplo) — sem isso, esta tela
            // mostraria o nome novo e o resto do app o antigo até dar F5.
            router.refresh();
          }}
        />
      )}
    </>
  );
}
