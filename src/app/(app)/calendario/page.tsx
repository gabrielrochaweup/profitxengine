import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { productOwnsExclusiveRoute } from "@/lib/products";
import { CalendarioHubClient } from "./calendario-hub-client";

export default async function CalendarioPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await getProfile(user.id);
  const activeProduct = await getActiveProduct(user.id, profile?.role === "admin");
  const hasDinamicas = !!activeProduct && productOwnsExclusiveRoute(activeProduct.slug, "/dinamicas-do-dia");
  const emptyResult = Promise.resolve({ data: [] });

  const [{ data: messages }, { data: directMessages }, { data: dynamicSelections }, { data: dynamics }] =
    await Promise.all([
      supabase.from("engagement_messages").select("*").order("scheduled_date", { ascending: false }),
      supabase.from("direct_messages").select("*").order("scheduled_date", { ascending: false }),
      hasDinamicas
        ? supabase.from("daily_dynamic_selection").select("scheduled_date, dynamic_id, concluded")
        : emptyResult,
      hasDinamicas ? supabase.from("message_dynamics").select("id, name, icon") : emptyResult,
    ]);

  return (
    <div>
      <h1 className="text-[22px] font-semibold leading-tight text-text-primary">Calendário</h1>
      <p className="mt-1 max-w-[70ch] text-[13px] text-text-secondary">
        Veja o que está acontecendo em cada dia. Clique num dia pra ver a notícia do momento e ser
        levado pra Dinâmicas do Dia ou Mensagens X1.
      </p>

      <CalendarioHubClient
        initialMessages={messages ?? []}
        initialDirectMessages={directMessages ?? []}
        initialDynamicSelections={dynamicSelections ?? []}
        dynamics={dynamics ?? []}
        showDynamicsLegend={hasDinamicas}
      />
    </div>
  );
}
