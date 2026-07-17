import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalendarioTabs } from "../components/calendario-tabs";
import { DinamicasDoDiaClient } from "./dinamicas-do-dia-client";

export default async function DinamicasDoDiaPage() {
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
      <h1 className="text-[28px] font-semibold text-text-primary">Dinâmicas do Dia</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Rode a dinâmica do dia com os cálculos reais, gere variações por IA por mensagem, ou gere
        livre sem partir de um template.
      </p>

      <div className="mt-6">
        <CalendarioTabs />
      </div>

      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-text-muted">Carregando...</p>}>
          <DinamicasDoDiaClient initialMessages={messages ?? []} currentUserId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}
