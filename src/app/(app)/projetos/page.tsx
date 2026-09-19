import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { ProjetosClient } from "./projetos-client";

/**
 * Configurações de Projeto.
 *
 * Renomear e desativar saíram da barra de abas e vieram pra cá: lá em cima
 * eles eram dois alvos minúsculos no hover do botão de trocar de projeto — o
 * gesto mais comum da barra passava por cima do mais destrutivo.
 *
 * Só admin: mexer em projeto muda o que a equipe inteira enxerga.
 */
export default async function ProjetosPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/sem-acesso");

  const supabase = createClient();
  const { data: produtos } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("position");

  return (
    <PageContainer largura="focado">
      <PageHeader
        titulo="Configurações de Projeto"
        descricao="Cada projeto é um espaço de trabalho próprio: tarefas, prompts, tracking e imagens são separados por projeto."
      />
      <ProjetosClient produtosIniciais={produtos ?? []} />
    </PageContainer>
  );
}
