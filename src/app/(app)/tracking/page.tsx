import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { TrackingClient } from "./tracking-client";
import { listarEndpoints } from "@/lib/tracking/endpoints-leitura";
import { PageContainer, PageHeader } from "@/components/ui/page";

export default async function TrackingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await getProfile(user.id);
  const isAdmin = profile?.role === "admin";
  const activeProduct = await getActiveProduct(user.id);

  if (!activeProduct) {
    return (
      <PageContainer largura="padrao">
        <PageHeader titulo="Tracking" descricao="Você não tem acesso a nenhum produto ainda." />
      </PageContainer>
    );
  }

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 90);

  const [{ data: report }, { data: rawEvents }, endpoints, { data: adCredentials }] = await Promise.all([
    supabase.rpc("tracking_campaign_report", {
      p_product_id: activeProduct.id,
      p_from: from.toISOString(),
      p_to: now.toISOString(),
    }),
    supabase
      .from("tracking_events")
      .select("id, event_type, source, email, amount_cents, currency, offer_name, lead_id, occurred_at")
      .eq("product_id", activeProduct.id)
      .order("occurred_at", { ascending: false })
      .limit(50),
    listarEndpoints(supabase, activeProduct.id),
    supabase
      .from("ad_platform_credentials")
      .select("id, platform, label, ad_account_id, is_valid, status, last_checked_at, last_synced_at")
      .eq("product_id", activeProduct.id),
  ]);

  // Junta a UTM/campanha do lead em cada evento — a tabela de eventos
  // recentes precisa mostrar de onde o cliente veio, não só o que ele fez.
  const leadIds = Array.from(new Set((rawEvents ?? []).map((e) => e.lead_id).filter((id): id is string => !!id)));
  const { data: eventLeads } =
    leadIds.length > 0
      ? await supabase.from("tracking_leads").select("id, utm_source, utm_medium, utm_campaign").in("id", leadIds)
      : { data: [] };
  const leadById = new Map((eventLeads ?? []).map((l) => [l.id, l]));
  const events = (rawEvents ?? []).map((e) => ({
    ...e,
    utm_source: e.lead_id ? (leadById.get(e.lead_id)?.utm_source ?? null) : null,
    utm_medium: e.lead_id ? (leadById.get(e.lead_id)?.utm_medium ?? null) : null,
    utm_campaign: e.lead_id ? (leadById.get(e.lead_id)?.utm_campaign ?? null) : null,
  }));

  return (
    // Tabelas de campanha e funil lado a lado: é tela de dados.
    <PageContainer largura="amplo">
      <PageHeader
        titulo="Tracking"
        descricao="Funil completo do lead: anúncio → landing → checkout → área de membros → corretora → depósito."
      />
      <TrackingClient
        productId={activeProduct.id}
        productSlug={activeProduct.slug}
        initialReport={report ?? []}
        initialEvents={events ?? []}
        initialEndpoints={endpoints ?? []}
        initialAdCredentials={adCredentials ?? []}
        isAdmin={isAdmin}
      />
    </PageContainer>
  );
}
