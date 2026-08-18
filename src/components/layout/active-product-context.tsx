"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const COOKIE_NAME = "active_product";

interface ProductRef {
  id: string;
  slug: string;
}

interface ActiveProductContextValue {
  activeProduct: string;
  activeProductId: string | null;
  setActiveProduct: (slug: string) => void;
}

const ActiveProductContext = createContext<ActiveProductContextValue | null>(null);

interface ActiveProductProviderProps {
  initialProduct: string;
  products: ProductRef[];
  children: ReactNode;
}

// Troca de produto é só estado de tela — nenhuma navegação acontece.
// Persiste num cookie (não localStorage) pra o servidor conseguir ler de
// volta no próximo carregamento (checagem de acesso por rota em
// (app)/layout.tsx precisa saber qual produto estava ativo antes do React
// montar). router.refresh() reexecuta os Server Components da rota atual
// com o cookie novo — necessário pra páginas com dado isolado por produto
// (Tarefas, Prompts, Imagens) recarregarem o conteúdo certo ao trocar de
// produto sem sair da tela.
export function ActiveProductProvider({ initialProduct, products, children }: ActiveProductProviderProps) {
  const router = useRouter();
  const [activeProduct, setActiveProductState] = useState(initialProduct);

  function setActiveProduct(slug: string) {
    setActiveProductState(slug);
    document.cookie = `${COOKIE_NAME}=${slug}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  const activeProductId = products.find((p) => p.slug === activeProduct)?.id ?? null;

  return (
    <ActiveProductContext.Provider value={{ activeProduct, activeProductId, setActiveProduct }}>
      {children}
    </ActiveProductContext.Provider>
  );
}

export function useActiveProduct(): ActiveProductContextValue {
  const ctx = useContext(ActiveProductContext);
  if (!ctx) throw new Error("useActiveProduct precisa estar dentro de ActiveProductProvider");
  return ctx;
}
