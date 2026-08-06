import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { createClient, getUser } from "@/lib/supabase/server";
import { ConversasClient } from "./conversas-client";

export default async function ConversasPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const { data: conversations } = await supabase
    .from("fake_conversations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold text-text-primary">Simulador de Conversas</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Monte conversas fictícias de WhatsApp ou Instagram Direct, gere com IA e exporte como imagem.
          </p>
        </div>
        <Link
          href="/conversas/modelos-de-prompt"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-button border border-border-strong px-3 py-1.5 text-xs text-text-secondary hover:bg-card-hover"
        >
          <Settings2 size={13} />
          Modelos de prompt
        </Link>
      </div>

      <ConversasClient initialConversations={conversations ?? []} currentUserId={user.id} />
    </div>
  );
}
