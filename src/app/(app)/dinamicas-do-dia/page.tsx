import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { LoadingState } from "@/components/ui/loading-state";
import { DinamicasDoDiaClient } from "./dinamicas-do-dia-client";
import { PageContainer, PageHeader } from "@/components/ui/page";

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
    <PageContainer largura="padrao">
      <PageHeader
        titulo="Dinâmicas do Dia"
        descricao="Rode a dinâmica do dia com os cálculos reais, gere variações por IA por mensagem, ou gere livre sem partir de um template."
      />

      <Suspense fallback={<LoadingState />}>
        <DinamicasDoDiaClient
          initialMessages={messages ?? []}
          currentUserId={user.id}
          canEditResult={hasRole(profile?.role ?? "viewer", "editor")}
        />
      </Suspense>
    </PageContainer>
  );
}
