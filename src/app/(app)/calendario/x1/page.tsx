import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalendarioTabs } from "../components/calendario-tabs";
import { X1Client } from "./x1-client";

export default async function X1Page() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: messages } = await supabase
    .from("direct_messages")
    .select("*")
    .order("scheduled_date", { ascending: false });

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Mensagens X1</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Mensagens individuais para alunos, segmentadas por perfil, com geração por IA e histórico.
      </p>

      <div className="mt-6">
        <CalendarioTabs />
      </div>

      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-text-muted">Carregando...</p>}>
          <X1Client initialMessages={messages ?? []} currentUserId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}
