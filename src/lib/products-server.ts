import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import { DEFAULT_PRODUCT_SLUG } from "./products";
import type { Database } from "./supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

// Admins veem todos os produtos ativos automaticamente; os demais só os
// produtos liberados em product_access. Usado tanto pelo (app)/layout.tsx
// (barra de abas + checagem de rota) quanto por qualquer página de
// ferramenta compartilhada que precise saber de qual produto buscar dado
// (ex: Tarefas).
export const getAccessibleProducts = cache(async (userId: string, isAdmin: boolean): Promise<Product[]> => {
  const supabase = createClient();

  if (isAdmin) {
    const { data } = await supabase.from("products").select("*").eq("active", true).order("position");
    return data ?? [];
  }

  const { data: access } = await supabase.from("product_access").select("product_id").eq("user_id", userId);
  const productIds = (access ?? []).map((a) => a.product_id);
  if (productIds.length === 0) return [];

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .in("id", productIds)
    .order("position");
  return data ?? [];
});

/**
 * Resolve o produto ativo a partir do cookie (setado pelo ActiveProductProvider
 * ao trocar de aba), caindo pro PROFITX ou pro primeiro produto acessível.
 *
 * `cache()` aqui e no getAccessibleProducts porque layout e page pedem a MESMA
 * lista em toda navegação: o layout pra desenhar a barra de produtos, a página
 * pra saber de qual produto buscar dado. Sem o dedupe, era uma ida a mais ao
 * banco por página — e nesse app a ida custa ~200ms, não a consulta.
 */
export const getActiveProduct = cache(async (userId: string, isAdmin: boolean): Promise<Product | null> => {
  const products = await getAccessibleProducts(userId, isAdmin);
  if (products.length === 0) return null;

  const cookieSlug = cookies().get("active_product")?.value;
  return (
    products.find((p) => p.slug === cookieSlug) ??
    products.find((p) => p.slug === DEFAULT_PRODUCT_SLUG) ??
    products[0]
  );
});
