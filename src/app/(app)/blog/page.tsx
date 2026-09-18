import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { hasRole } from "@/lib/auth";
import type { UserRole } from "@/lib/supabase/types";
import { PageContainer, PageHeader } from "@/components/ui/page";
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
      <PageContainer largura="padrao">
        <PageHeader titulo="Blog" descricao="Você não tem acesso a nenhum produto ainda." />
      </PageContainer>
    );
  }

  if (!hasRole(role, "editor")) {
    return (
      <PageContainer largura="padrao">
        <PageHeader titulo="Blog" descricao="Peça a um admin pra mudar seu nível de acesso." />
      </PageContainer>
    );
  }

  return (
    <PageContainer largura="padrao">
      <PageHeader
        titulo="Blog"
        descricao="Gera o post a partir de um tema ou de uma slug — texto, imagem de capa e dados de SEO — e guarda pronto no domínio escolhido."
      />
      <BlogClient productId={activeProduct.id} />
    </PageContainer>
  );
}
