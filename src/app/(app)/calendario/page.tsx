import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalendarioTabs } from "./components/calendario-tabs";
import { CalendarioHubClient } from "./calendario-hub-client";

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
        Veja o que está acontecendo em cada dia e escolha o que criar. O calendário é só um apoio —
        clique num dia pra ver a notícia do momento e ser levado pra Dinâmica do Dia ou Mensagens X1.
      </p>

      <div className="mt-6">
        <CalendarioTabs />
      </div>

      <CalendarioHubClient
        initialMessages={messages ?? []}
        initialDirectMessages={directMessages ?? []}
        initialDynamicSelections={dynamicSelections ?? []}
      />
    </div>
  );
}
