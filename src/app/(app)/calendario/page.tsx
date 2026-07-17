import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalendarioClient } from "./calendario-client";

export default async function CalendarioPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: messages }, { data: directMessages }, { data: dynamicSelections }] = await Promise.all([
    supabase.from("engagement_messages").select("*").order("scheduled_date", { ascending: false }),
    supabase.from("direct_messages").select("*").order("scheduled_date", { ascending: false }),
    supabase.from("daily_dynamic_selection").select("scheduled_date, dynamic_id"),
  ]);

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Calendário de Engajamento</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Mensagens diárias do grupo e do direct dos alunos, geração de imagem e analytics de performance.
      </p>

      <CalendarioClient
        initialMessages={messages ?? []}
        initialDirectMessages={directMessages ?? []}
        initialDynamicSelections={dynamicSelections ?? []}
        currentUserId={user.id}
      />
    </div>
  );
}
