"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const COOKIE_NAME = "active_product";

interface ActiveProductContextValue {
  activeProduct: string;
  setActiveProduct: (slug: string) => void;
}

const ActiveProductContext = createContext<ActiveProductContextValue | null>(null);

interface ActiveProductProviderProps {
  initialProduct: string;
  children: ReactNode;
}

// Troca de produto é só estado de tela — nenhuma navegação acontece.
// Persiste num cookie (não localStorage) pra o servidor conseguir ler de
// volta no próximo carregamento (checagem de acesso por rota em
// (app)/layout.tsx precisa saber qual produto estava ativo antes do React
// montar).
export function ActiveProductProvider({ initialProduct, children }: ActiveProductProviderProps) {
  const [activeProduct, setActiveProductState] = useState(initialProduct);

  function setActiveProduct(slug: string) {
    setActiveProductState(slug);
    document.cookie = `${COOKIE_NAME}=${slug}; path=/; max-age=31536000; SameSite=Lax`;
  }

  return (
    <ActiveProductContext.Provider value={{ activeProduct, setActiveProduct }}>
      {children}
    </ActiveProductContext.Provider>
  );
}

export function useActiveProduct(): ActiveProductContextValue {
  const ctx = useContext(ActiveProductContext);
  if (!ctx) throw new Error("useActiveProduct precisa estar dentro de ActiveProductProvider");
  return ctx;
}
