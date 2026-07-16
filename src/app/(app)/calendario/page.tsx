import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalendarioClient } from "./calendario-client";

export default async function CalendarioPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: messages } = await supabase
    .from("engagement_messages")
    .select("*")
    .order("scheduled_date", { ascending: false });

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Calendário de Engajamento</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Mensagens diárias do grupo, geração de imagem e analytics de performance.
      </p>

      <CalendarioClient initialMessages={messages ?? []} currentUserId={user.id} />
    </div>
  );
}
