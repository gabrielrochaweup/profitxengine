import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { PromptsClient } from "./prompts-client";

export default async function PromptsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const [{ data: prompts }, { data: profile }] = await Promise.all([
    supabase.from("prompts").select("*").order("created_at", { ascending: false }),
    getProfile(user.id),
  ]);

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Biblioteca de Prompts</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Prompts reutilizáveis nos módulos de conversas, calendário de engajamento e e-mails.
      </p>

      <PromptsClient
        initialPrompts={prompts ?? []}
        currentUserId={user.id}
        isAdmin={profile?.role === "admin"}
      />
    </div>
  );
}
