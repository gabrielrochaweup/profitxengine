import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
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

  // Só admin. A tela abre a senha das contas da empresa e diz em qual
  // celular está o 2FA — não tem meio-termo entre ver e não ver, e editor
  // não precisa disso pra editar conteúdo.
  if (role !== "admin") {
    return (
      <PageContainer largura="padrao">
        <PageHeader
          titulo="Acessos"
          descricao="Essa área é restrita aos admins. Se você precisa entrar em alguma conta, peça a um admin."
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
