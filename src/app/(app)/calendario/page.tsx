import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { CalendarioHubClient } from "./calendario-hub-client";

export default async function CalendarioPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const [{ data: messages }, { data: directMessages }, { data: dynamicSelections }, { data: dynamics }] =
    await Promise.all([
      supabase.from("engagement_messages").select("*").order("scheduled_date", { ascending: false }),
      supabase.from("direct_messages").select("*").order("scheduled_date", { ascending: false }),
      supabase.from("daily_dynamic_selection").select("scheduled_date, dynamic_id, concluded"),
      supabase.from("message_dynamics").select("id, name, icon"),
    ]);

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Calendário</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Veja o que está acontecendo em cada dia. Clique num dia pra ver a notícia do momento e ser
        levado pra Dinâmicas do Dia ou Mensagens X1.
      </p>

      <CalendarioHubClient
        initialMessages={messages ?? []}
        initialDirectMessages={directMessages ?? []}
        initialDynamicSelections={dynamicSelections ?? []}
        dynamics={dynamics ?? []}
      />
    </div>
  );
}
