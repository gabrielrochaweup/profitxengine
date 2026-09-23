import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { PromptsClient } from "./prompts-client";

export default async function PromptsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const activeProduct = await getActiveProduct(user.id);

  const [{ data: prompts }, { data: categories }] = await Promise.all([
    activeProduct
      ? supabase
          .from("prompts")
          .select("*")
          .eq("product_id", activeProduct.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    activeProduct
      ? supabase.from("prompt_categories").select("*").eq("product_id", activeProduct.id).order("position")
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <PageContainer largura="amplo">
      <PageHeader
        titulo="Biblioteca de Prompts"
        descricao="Prompts reutilizáveis nos módulos de conversas, calendário de engajamento e e-mails. As colunas são personalizáveis por quem é admin."
      />
      <PromptsClient
        key={activeProduct?.id ?? "none"}
        initialPrompts={prompts ?? []}
        initialCategories={categories ?? []}
        currentUserId={user.id}

      />
    </PageContainer>
  );
}
