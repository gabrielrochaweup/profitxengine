import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { productOwnsExclusiveRoute } from "@/lib/products";
import { AnalyticsClient } from "./analytics-client";
import { ProductMetricsClient } from "./product-metrics-client";

export default async function AnalyticsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await getProfile(user.id);
  const isAdmin = profile?.role === "admin";
  const activeProduct = await getActiveProduct(user.id, isAdmin);
  const hasDinamicas = !!activeProduct && productOwnsExclusiveRoute(activeProduct.slug, "/dinamicas-do-dia");

  // Produtos sem Dinâmicas do Dia (ex: SEVEN, físico) não usam os campos
  // fixos do PROFITX — ganham campos configuráveis pelo admin em vez disso.
  if (!hasDinamicas) {
    const emptyResult = Promise.resolve({ data: [] });
    const [{ data: fields }, { data: entries }] = await Promise.all([
      activeProduct
        ? supabase.from("product_metric_fields").select("*").eq("product_id", activeProduct.id).order("position")
        : emptyResult,
      activeProduct
        ? supabase
            .from("product_daily_metrics")
            .select("*")
            .eq("product_id", activeProduct.id)
            .order("metric_date", { ascending: false })
        : emptyResult,
    ]);

    return (
      <div>
        <h1 className="text-[22px] font-semibold leading-tight text-text-primary">Analytics</h1>
        <p className="mt-1 max-w-[70ch] text-[13px] text-text-secondary">
          Preencha o resultado de cada dia com os campos configurados pra esse produto.
        </p>

        <ProductMetricsClient
          key={activeProduct?.id ?? "none"}
          initialFields={fields ?? []}
          initialEntries={entries ?? []}
          productId={activeProduct?.id ?? null}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </div>
    );
  }

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
      <h1 className="text-[22px] font-semibold leading-tight text-text-primary">Analytics</h1>
      <p className="mt-1 max-w-[70ch] text-[13px] text-text-secondary">
        Resultado de cada dia marcado como concluído em Dinâmicas do Dia — faturamento, depósitos,
        volume de Pepe/Live/Copy e qual dinâmica performou melhor.
      </p>

      <AnalyticsClient initialResults={results ?? []} dynamics={dynamics ?? []} />
    </div>
  );
}
