import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
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
      <div>
        <h1 className="text-[28px] font-semibold text-text-primary">Tarefas</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Nenhum produto liberado ainda pra ver as tarefas.
        </p>
      </div>
    );
  }

  const supabase = createClient();
  const [{ data: columns }, { data: tasks }, { data: attachments }] = await Promise.all([
    supabase.from("task_columns").select("*").eq("product_id", product.id).order("position"),
    supabase.from("tasks").select("*").eq("product_id", product.id).order("position"),
    supabase.from("task_attachments").select("*").eq("product_id", product.id).order("created_at"),
  ]);

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">
        {product.icon} Tarefas — {product.name}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Quadro de tarefas do produto. Arraste os cards entre as colunas conforme for avançando.
      </p>

      <TarefasClient
        productId={product.id}
        initialColumns={columns ?? []}
        initialTasks={tasks ?? []}
        initialAttachments={attachments ?? []}
        canEdit={canEdit}
        currentUserId={user.id}
      />
    </div>
  );
}
