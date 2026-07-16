import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversasClient } from "./conversas-client";

export default async function ConversasPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: conversations } = await supabase
    .from("fake_conversations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Simulador de Conversas</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Monte conversas fictícias de WhatsApp ou Instagram Direct, gere com IA e exporte como imagem.
      </p>

      <ConversasClient initialConversations={conversations ?? []} currentUserId={user.id} />
    </div>
  );
}
