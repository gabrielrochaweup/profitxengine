import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import { DEFAULT_PRODUCT_SLUG } from "./products";
import type { Database } from "./supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

/**
 * Busca crua: todos os produtos ativos + quais esse usuário tem liberados.
 *
 * Separado de `getAccessibleProducts` porque NÃO depende de saber se a pessoa
 * é admin. Isso é o ponto: o layout precisava do perfil antes de começar a
 * buscar produtos, e as duas viagens ficavam enfileiradas. Sem essa
 * dependência, dá pra disparar as duas juntas — e nesse app cada viagem custa
 * ~200ms.
 *
 * As duas consultas aqui dentro também vão em paralelo. Antes, pra quem não é
 * admin, elas eram sequenciais (buscar os acessos, depois os produtos desses
 * acessos): duas viagens onde cabia uma. A lista de produtos é de poucas
 * linhas, então trazer todas e filtrar na memória sai mais barato que
 * esperar.
 */
const carregarProdutos = cache(async (userId: string) => {
  const supabase = createClient();
  const [{ data: todos }, { data: acessos }] = await Promise.all([
    supabase.from("products").select("*").eq("active", true).order("position"),
    supabase.from("product_access").select("product_id").eq("user_id", userId),
  ]);

  return {
    todos: todos ?? [],
    idsLiberados: new Set((acessos ?? []).map((a) => a.product_id)),
  };
});

/**
 * Admins veem todos os produtos ativos; os demais só os liberados em
 * product_access. Usado tanto pelo (app)/layout.tsx (barra de abas +
 * checagem de rota) quanto por qualquer página de ferramenta compartilhada
 * que precise saber de qual produto buscar dado (ex: Tarefas).
 *
 * Não faz rede própria: filtra o que `carregarProdutos` já trouxe. Se o
 * layout tiver disparado aquela busca em paralelo com o perfil, esta chamada
 * resolve do cache, sem esperar nada.
 */
export const getAccessibleProducts = cache(async (userId: string, isAdmin: boolean): Promise<Product[]> => {
  const { todos, idsLiberados } = await carregarProdutos(userId);
  return isAdmin ? todos : todos.filter((p) => idsLiberados.has(p.id));
});

/**
 * Começa a buscar os produtos sem esperar o perfil.
 *
 * O layout chama isto junto do `getProfile` num Promise.all; depois, quando
 * já sabe se é admin, chama `getAccessibleProducts` normalmente e recebe do
 * cache. Existe só pra tornar esse "dispare agora, filtre depois" explícito
 * em vez de um efeito colateral escondido.
 */
export function iniciarBuscaDeProdutos(userId: string): Promise<unknown> {
  return carregarProdutos(userId);
}

/**
 * Resolve o produto ativo a partir do cookie (setado pelo ActiveProductProvider
 * ao trocar de aba), caindo pro PROFITX ou pro primeiro produto acessível.
 *
 * `cache()` aqui e no getAccessibleProducts porque layout e page pedem a MESMA
 * lista em toda navegação: o layout pra desenhar a barra de produtos, a página
 * pra saber de qual produto buscar dado. Sem o dedupe, era uma ida a mais ao
 * banco por página.
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
