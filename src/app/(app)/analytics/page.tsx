import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { productOwnsExclusiveRoute } from "@/lib/products";
import { AnalyticsClient } from "./analytics-client";
import { ProductMetricsClient } from "./product-metrics-client";
import { PageContainer, PageHeader } from "@/components/ui/page";

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
      <PageContainer largura="padrao">
        <PageHeader
          titulo="Analytics"
          descricao="Preencha o resultado de cada dia com os campos configurados pra esse produto."
        />
        <ProductMetricsClient
          key={activeProduct?.id ?? "none"}
          initialFields={fields ?? []}
          initialEntries={entries ?? []}
          productId={activeProduct?.id ?? null}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </PageContainer>
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
    <PageContainer largura="padrao">
      <PageHeader
        titulo="Analytics"
        descricao="Resultado de cada dia marcado como concluído em Dinâmicas do Dia — faturamento, depósitos, volume de Pepe/Live/Copy e qual dinâmica performou melhor."
      />
      <AnalyticsClient initialResults={results ?? []} dynamics={dynamics ?? []} />
    </PageContainer>
  );
}
