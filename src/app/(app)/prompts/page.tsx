import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { PromptsClient } from "./prompts-client";

export default async function PromptsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const [{ data: prompts }, { data: categories }, { data: profile }] = await Promise.all([
    supabase.from("prompts").select("*").order("created_at", { ascending: false }),
    supabase.from("prompt_categories").select("*").order("position"),
    getProfile(user.id),
  ]);

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Biblioteca de Prompts</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Prompts reutilizáveis nos módulos de conversas, calendário de engajamento e e-mails. Colunas
        totalmente personalizáveis por quem é admin.
      </p>

      <PromptsClient
        initialPrompts={prompts ?? []}
        initialCategories={categories ?? []}
        currentUserId={user.id}
        isAdmin={profile?.role === "admin"}
      />
    </div>
  );
}
