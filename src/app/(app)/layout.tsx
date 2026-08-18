import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { ProductTabs } from "@/components/layout/product-tabs";
import { ActiveProductProvider } from "@/components/layout/active-product-context";
import { DEFAULT_PRODUCT_SLUG, getProductSlugForPath } from "@/lib/products";
import type { Database } from "@/lib/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

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
  const supabase = createClient();

  let products: Product[] = [];
  if (isAdminUser) {
    const { data } = await supabase.from("products").select("*").eq("active", true).order("position");
    products = data ?? [];
  } else {
    const { data: access } = await supabase.from("product_access").select("product_id").eq("user_id", user.id);
    const productIds = (access ?? []).map((a) => a.product_id);
    if (productIds.length > 0) {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .in("id", productIds)
        .order("position");
      products = data ?? [];
    }
  }

  const pathname = headers().get("x-pathname") ?? "";
  const ownerProduct = getProductSlugForPath(pathname);
  if (ownerProduct && !isAdminUser && !products.some((p) => p.slug === ownerProduct)) {
    redirect("/sem-acesso");
  }

  const cookieProduct = cookies().get("active_product")?.value;
  const activeProduct =
    products.find((p) => p.slug === cookieProduct)?.slug ??
    products.find((p) => p.slug === DEFAULT_PRODUCT_SLUG)?.slug ??
    products[0]?.slug ??
    DEFAULT_PRODUCT_SLUG;

  return (
    <ActiveProductProvider initialProduct={activeProduct}>
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
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-card md:rounded-panel md:border md:border-border">
            <main className="flex-1 overflow-y-auto px-3 pt-3 pb-[max(6rem,calc(env(safe-area-inset-bottom)+5.5rem))] sm:px-8 sm:pt-6 sm:pb-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ActiveProductProvider>
  );
}
