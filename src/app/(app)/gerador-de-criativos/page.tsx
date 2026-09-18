import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { CriativosLivre } from "./components/criativos-livre";

export default async function GeradorDeCriativosPage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  return (
    <PageContainer largura="focado">
      <PageHeader
        titulo="Gerador de Criativos"
        descricao="Descreva o criativo e gere a imagem. Use uma referência quando quiser manter o estilo de algo que já existe."
      />
      <CriativosLivre />
    </PageContainer>
  );
}
