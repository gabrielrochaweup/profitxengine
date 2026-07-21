import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { LoadingState } from "@/components/ui/loading-state";
import { DinamicasDoDiaClient } from "./dinamicas-do-dia-client";

export default async function DinamicasDoDiaPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const profile = await getSessionProfile();

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
        <Suspense fallback={<LoadingState />}>
          <DinamicasDoDiaClient
            initialMessages={messages ?? []}
            currentUserId={user.id}
            canEditResult={hasRole(profile?.role ?? "viewer", "editor")}
          />
        </Suspense>
      </div>
    </div>
  );
}
