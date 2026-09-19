"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveProduct } from "./active-product-context";
import { CreateProductModal } from "./product-modals";
import type { Database } from "@/lib/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

interface ProductTabsProps {
  initialProducts: Product[];
  isAdmin: boolean;
}

/*
  Barra de produtos no topo do app (desktop) — trocador de workspace, não abas
  de navegador de verdade: clicar só troca o estado ativo
  (ActiveProductProvider), sem navegar pra lugar nenhum.

  Renomear e desativar saíram daqui. Eram dois alvos de 16px que apareciam no
  hover em cima do botão de TROCAR de projeto: o gesto mais comum da barra
  (clicar pra trocar) passava por cima do mais destrutivo (o X). Essas duas
  ações moram em Configurações de Projeto, no menu do usuário. O "+" fica: é
  um clique, abre um formulário e não apaga nada.
*/
export function ProductTabs({ initialProducts, isAdmin }: ProductTabsProps) {
  const { activeProduct, setActiveProduct } = useActiveProduct();
  const [products, setProducts] = useState(initialProducts);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex items-center gap-1.5 rounded-panel bg-sidebar shadow-card p-1.5">
      {/* A marca mora aqui, e não no topo da sidebar: eram dois blocos de
          identidade empilhados no mesmo canto — o nome do app logo acima do
          nome do app de novo. Aqui em cima ela também fica ao lado do
          trocador de workspace, que é o que ela qualifica ("ProfitX Engine,
          vendo o produto X"). */}
      <div className="flex shrink-0 items-center gap-2 pl-1.5 pr-3">
        {/* O símbolo novo vem sem o quadrado colorido que o arquivo antigo
            trazia embutido — e, sendo quase branco, sumiria no tema claro. O
            ladrilho devolve o contraste nos dois temas e mantém a marca do
            mesmo tamanho de antes. */}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-button bg-accent">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.svg" alt="ENGINE" className="h-[18px] w-auto" />
        </span>
        <span className="whitespace-nowrap text-[13px] font-semibold tracking-wide text-text-primary">ENGINE</span>
      </div>
      <div className="h-5 w-px shrink-0 bg-border" />

      {products.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => setActiveProduct(p.slug)}
          className={cn(
            "flex items-center gap-1.5 rounded-button px-3 py-1.5 text-sm font-medium transition-colors",
            activeProduct === p.slug
              ? "bg-accent text-accent-contrast"
              : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
          )}
        >
          <span>{p.icon || "✨"}</span>
          {p.name}
        </button>
      ))}

      {isAdmin && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          title="Novo projeto"
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
