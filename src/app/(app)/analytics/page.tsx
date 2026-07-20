import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const [{ data: results }, { data: dynamics }] = await Promise.all([
    supabase
      .from("daily_dynamic_selection")
      .select(
        "scheduled_date, dynamic_id, concluded, pepe_pessoas, pepe_valor, live_pessoas, live_valor, copy_pessoas, copy_valor, depositos_valor, depositos_qtd, faturamento_bruto, faturamento_liquido, observacoes"
      )
      .eq("concluded", true)
      .order("scheduled_date", { ascending: true }),
    supabase.from("message_dynamics").select("id, name, icon"),
  ]);

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Analytics</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Resultado de cada dia marcado como concluído em Dinâmicas do Dia — faturamento, depósitos,
        volume de Pepe/Live/Copy e qual dinâmica performou melhor.
      </p>

      <AnalyticsClient initialResults={results ?? []} dynamics={dynamics ?? []} />
    </div>
  );
}
