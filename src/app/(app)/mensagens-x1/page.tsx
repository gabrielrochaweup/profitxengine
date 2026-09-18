import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { LoadingState } from "@/components/ui/loading-state";
import { X1Client } from "./x1-client";

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
    <div>
      <h1 className="text-[22px] font-semibold leading-tight text-text-primary">Mensagens X1</h1>
      <p className="mt-1 max-w-[70ch] text-[13px] text-text-secondary">
        Mensagens individuais para alunos, segmentadas por perfil, com geração por IA e histórico.
      </p>

      <div className="mt-6">
        <Suspense fallback={<LoadingState />}>
          <X1Client initialMessages={messages ?? []} currentUserId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}
