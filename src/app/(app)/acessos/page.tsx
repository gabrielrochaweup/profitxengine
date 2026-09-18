import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { hasRole } from "@/lib/auth";
import type { UserRole } from "@/lib/supabase/types";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { AcessosClient } from "./acessos-client";

export default async function AcessosPage() {
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
        <PageHeader titulo="Acessos" descricao="Você não tem acesso a nenhum produto ainda." />
      </PageContainer>
    );
  }

  // Visualizador não entra: a tela existe pra quem opera as contas, e uma
  // senha guardada não tem meio-termo entre ver e não ver.
  if (!hasRole(role, "editor")) {
    return (
      <PageContainer largura="padrao">
        <PageHeader
          titulo="Acessos"
          descricao="Essa área é da equipe que opera as contas. Peça a um admin pra mudar seu nível de acesso."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer largura="padrao">
      <PageHeader
        titulo="Acessos"
        descricao="Onde a equipe entra, quem tem o 2FA e quanto as assinaturas custam por mês."
      />
      <AcessosClient productId={activeProduct.id} />
    </PageContainer>
  );
}
