import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getUser, getProfile } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { ProductTabs } from "@/components/layout/product-tabs";
import { ActiveProductProvider } from "@/components/layout/active-product-context";
import { ChamadaProvider } from "@/app/(app)/comunidade/chamada-provider";
import { AjudaFlutuante } from "@/components/layout/ajuda-flutuante";
import { DEFAULT_PRODUCT_SLUG, isPathAccessible } from "@/lib/products";
import { getAccessibleProducts, iniciarBuscaDeProdutos } from "@/lib/products-server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    data: { user },
  } = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Perfil e produtos ao mesmo tempo. A lista de produtos depende de saber se
  // a pessoa é admin, mas a BUSCA não — então ela começa junto e o filtro
  // acontece depois, já com o perfil em mãos. Enfileirar as duas custava uma
  // viagem inteira ao banco (~200ms) em toda navegação.
  const [{ data: profile }] = await Promise.all([getProfile(user.id), iniciarBuscaDeProdutos(user.id)]);

  if (profile?.status && profile.status !== "approved") {
    redirect("/pendente");
  }

  const isAdminUser = profile?.role === "admin";
  // Já veio do cache da busca acima — não vai à rede de novo.
  const products = await getAccessibleProducts(user.id);

  const pathname = headers().get("x-pathname") ?? "";
  if (!isAdminUser && !isPathAccessible(pathname, products.map((p) => p.slug))) {
    redirect("/sem-acesso");
  }

  const cookieProduct = cookies().get("active_product")?.value;
  const activeProduct =
    products.find((p) => p.slug === cookieProduct)?.slug ??
    products.find((p) => p.slug === DEFAULT_PRODUCT_SLUG)?.slug ??
    products[0]?.slug ??
    DEFAULT_PRODUCT_SLUG;

  return (
    <ActiveProductProvider
      initialProduct={activeProduct}
      products={products.map((p) => ({ id: p.id, slug: p.slug }))}
    >
      {/* A chamada da Comunidade mora aqui, acima das páginas: trocar de tela
          não pode desligar o microfone de quem está no meio de uma conversa —
          e mostrar uma tela do próprio ENGINE exige exatamente isso. */}
      <ChamadaProvider
        meuId={user.id}
        meuNome={profile?.full_name?.trim() || "Sem nome"}
        disponivel={
          !!process.env.LIVEKIT_URL && !!process.env.LIVEKIT_API_KEY && !!process.env.LIVEKIT_API_SECRET
        }
      >
      <div className="flex h-dvh flex-col bg-app md:gap-3 md:p-3">
        {products.length > 0 && (
          <div className="hidden shrink-0 md:block">
            <ProductTabs initialProducts={products} isAdmin={isAdminUser} />
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row md:gap-3">
          <Sidebar
            fullName={profile?.full_name ?? null}
            email={user.email ?? null}
            role={profile?.role ?? "editor"}
          />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-card md:rounded-panel md:shadow-card">
            <main className="flex-1 overflow-y-auto px-3 pt-3 pb-[max(6rem,calc(env(safe-area-inset-bottom)+5.5rem))] sm:px-8 sm:pt-6 sm:pb-6">
              {children}
            </main>
          </div>
        </div>
      </div>

      {/* A ajuda mora no layout pra existir em toda página sem ninguém
          precisar plugar. Suspense porque ela lê ?aba= da URL, e
          useSearchParams sem fronteira faria o Next renderizar a árvore
          inteira no cliente. */}
      <Suspense fallback={null}>
        <AjudaFlutuante />
      </Suspense>
      </ChamadaProvider>
    </ActiveProductProvider>
  );
}
