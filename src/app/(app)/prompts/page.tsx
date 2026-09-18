import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { PromptsClient } from "./prompts-client";

export default async function PromptsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await getProfile(user.id);
  const activeProduct = await getActiveProduct(user.id, profile?.role === "admin");

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
    <div>
      <h1 className="text-[22px] font-semibold leading-tight text-text-primary">Biblioteca de Prompts</h1>
      <p className="mt-1 max-w-[70ch] text-[13px] text-text-secondary">
        Prompts reutilizáveis nos módulos de conversas, calendário de engajamento e e-mails. Colunas
        totalmente personalizáveis por quem é admin.
      </p>

      <PromptsClient
        key={activeProduct?.id ?? "none"}
        initialPrompts={prompts ?? []}
        initialCategories={categories ?? []}
        currentUserId={user.id}
        isAdmin={profile?.role === "admin"}
      />
    </div>
  );
}
