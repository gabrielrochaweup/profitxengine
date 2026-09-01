import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getUser, getProfile } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { ProductTabs } from "@/components/layout/product-tabs";
import { ActiveProductProvider } from "@/components/layout/active-product-context";
import { DEFAULT_PRODUCT_SLUG, isPathAccessible } from "@/lib/products";
import { getAccessibleProducts } from "@/lib/products-server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    data: { user },
  } = await getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await getProfile(user.id);

  if (profile?.status && profile.status !== "approved") {
    redirect("/pendente");
  }

  const isAdminUser = profile?.role === "admin";
  const products = await getAccessibleProducts(user.id, isAdminUser);

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
    </ActiveProductProvider>
  );
}
