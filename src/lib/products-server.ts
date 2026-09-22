import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import { DEFAULT_PRODUCT_SLUG } from "./products";
import type { Database } from "./supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

/**
 * Os produtos que existem e estão no ar.
 *
 * Era aqui que morava o segundo portão de acesso: além de `products`, esta
 * função buscava `product_access` pra saber quais o usuário podia ver. Esse
 * portão acabou (ver migration 0112) — quem está aprovado enxerga os produtos
 * ativos —, e com ele foi embora uma das duas consultas.
 */
const carregarProdutos = cache(async (userId: string) => {
  void userId; // a lista não depende mais de quem pergunta; o parâmetro fica só como chave do cache
  const supabase = createClient();
  const { data } = await supabase.from("products").select("*").eq("active", true).order("position");
  return data ?? [];
});

/**
 * Os produtos que esta pessoa enxerga.
 *
 * Quem chega aqui já passou pelo (app)/layout.tsx, que manda pra /pendente
 * quem não está aprovado — então "aprovado" é pré-condição, não algo a
 * checar de novo. Admin e editor veem a mesma lista: aprovar alguém JÁ é a
 * decisão de confiança, e exigir uma segunda marcação produto a produto só
 * produzia gente aprovada com o app inteiro vazio.
 *
 * Pra tirar um produto de todo mundo, desative-o (products.active).
 *
 * Continua sendo o mesmo cache de `carregarProdutos`: layout e página pedem
 * essa lista na mesma navegação, e sem o dedupe seria uma ida a mais ao banco
 * por tela.
 */
export const getAccessibleProducts = cache(async (userId: string): Promise<Product[]> => {
  return carregarProdutos(userId);
});

/**
 * Começa a buscar os produtos sem esperar o perfil.
 *
 * O layout chama isto junto do `getProfile` num Promise.all; depois chama
 * `getAccessibleProducts` normalmente e recebe do cache. Existe só pra tornar
 * esse "dispare agora, use depois" explícito em vez de um efeito colateral
 * escondido.
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
export const getActiveProduct = cache(async (userId: string): Promise<Product | null> => {
  const products = await getAccessibleProducts(userId);
  if (products.length === 0) return null;

  const cookieSlug = cookies().get("active_product")?.value;
  return (
    products.find((p) => p.slug === cookieSlug) ??
    products.find((p) => p.slug === DEFAULT_PRODUCT_SLUG) ??
    products[0]
  );
});
