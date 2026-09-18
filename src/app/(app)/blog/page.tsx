import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { hasRole } from "@/lib/auth";
import type { UserRole } from "@/lib/supabase/types";
import { BlogClient } from "./blog-client";

export default async function BlogPage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await getProfile(user.id);
  const role = (profile?.role ?? "editor") as UserRole;
  const activeProduct = await getActiveProduct(user.id, role === "admin");

  if (!activeProduct) {
    return (
      <div>
        <h1 className="text-[28px] font-semibold text-text-primary">Blog</h1>
        <p className="mt-1 text-sm text-text-secondary">Você não tem acesso a nenhum produto ainda.</p>
      </div>
    );
  }

  if (!hasRole(role, "editor")) {
    return (
      <div>
        <h1 className="text-[28px] font-semibold text-text-primary">Blog</h1>
        <p className="mt-1 text-sm text-text-secondary">Peça a um admin pra mudar seu nível de acesso.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Blog</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Gera o post a partir de um tema ou de uma slug — texto, imagem de capa e dados de SEO — e guarda pronto
        no domínio escolhido.
      </p>

      <BlogClient productId={activeProduct.id} />
    </div>
  );
}
