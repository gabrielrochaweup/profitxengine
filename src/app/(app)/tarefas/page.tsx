import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { TarefasClient } from "./tarefas-client";

export default async function TarefasPage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await getProfile(user.id);
  const isAdminUser = profile?.role === "admin";
  const canEdit = profile?.role === "editor" || isAdminUser;

  const product = await getActiveProduct(user.id, isAdminUser);

  if (!product) {
    return (
      <PageContainer largura="padrao">
        <PageHeader titulo="Tarefas" descricao="Nenhum produto liberado ainda pra ver as tarefas." />
      </PageContainer>
    );
  }

  const supabase = createClient();
  const [{ data: columns }, { data: tasks }, { data: attachments }, { data: variants }] = await Promise.all([
    supabase.from("task_columns").select("*").eq("product_id", product.id).order("position"),
    supabase.from("tasks").select("*").eq("product_id", product.id).order("position"),
    supabase.from("task_attachments").select("*").eq("product_id", product.id).order("created_at"),
    supabase.from("task_attachment_variants").select("*").eq("product_id", product.id).order("position"),
  ]);

  return (
    // Quadro com colunas lado a lado: é uma das poucas telas que ganha de
    // verdade com a largura inteira.
    <PageContainer largura="amplo">
      <PageHeader
        titulo={`${product.icon} Tarefas — ${product.name}`}
        descricao="Quadro de tarefas do produto. Arraste os cards entre as colunas conforme for avançando."
      />
      <TarefasClient
        key={product.id}
        productId={product.id}
        initialColumns={columns ?? []}
        initialTasks={tasks ?? []}
        initialAttachments={attachments ?? []}
        initialVariants={variants ?? []}
        canEdit={canEdit}
        currentUserId={user.id}
      />
    </PageContainer>
  );
}
