import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { LoadingState } from "@/components/ui/loading-state";
import { X1Client } from "./x1-client";
import { PageContainer, PageHeader } from "@/components/ui/page";

export default async function X1Page() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const { data: messages } = await supabase
    .from("direct_messages")
    .select("*")
    .order("scheduled_date", { ascending: false });

  return (
    <PageContainer largura="padrao">
      <PageHeader
        titulo="Mensagens X1"
        descricao="Mensagens individuais para alunos, segmentadas por perfil, com geração por IA e histórico."
      />
      <Suspense fallback={<LoadingState />}>
        <X1Client initialMessages={messages ?? []} currentUserId={user.id} />
      </Suspense>
    </PageContainer>
  );
}
