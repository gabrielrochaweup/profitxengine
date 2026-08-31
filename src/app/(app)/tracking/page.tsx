import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { TrackingClient } from "./tracking-client";

export default async function TrackingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await getProfile(user.id);
  const isAdmin = profile?.role === "admin";
  const activeProduct = await getActiveProduct(user.id, isAdmin);

  if (!activeProduct) {
    return (
      <div>
        <h1 className="text-[28px] font-semibold text-text-primary">Tracking</h1>
        <p className="mt-1 text-sm text-text-secondary">Você não tem acesso a nenhum produto ainda.</p>
      </div>
    );
  }

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 90);

  const [{ data: report }, { data: events }, { data: endpoints }] = await Promise.all([
    supabase.rpc("tracking_campaign_report", {
      p_product_id: activeProduct.id,
      p_from: from.toISOString(),
      p_to: now.toISOString(),
    }),
    supabase
      .from("tracking_events")
      .select("id, event_type, source, email, amount_cents, currency, lead_id, occurred_at")
      .eq("product_id", activeProduct.id)
      .order("occurred_at", { ascending: false })
      .limit(50),
    isAdmin
      ? supabase
          .from("tracking_webhook_endpoints")
          .select("id, product_id, kind, platform, endpoint_slug, active, created_at")
          .eq("product_id", activeProduct.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Tracking</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Funil completo do lead: anúncio → landing → checkout → área de membros → corretora → depósito.
      </p>

      <TrackingClient
        productId={activeProduct.id}
        initialReport={report ?? []}
        initialEvents={events ?? []}
        initialEndpoints={endpoints ?? []}
        isAdmin={isAdmin}
      />
    </div>
  );
}
