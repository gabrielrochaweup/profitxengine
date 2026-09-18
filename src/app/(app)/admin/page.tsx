import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { UsersManager } from "./components/users-manager";
import { UsageLogPanel } from "./components/usage-log-panel";
import { ProductManager } from "./components/product-manager";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await getProfile(user.id);

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const [{ data: users }, { data: usageLog }, { data: products }, { data: productAccess }] = await Promise.all([
    supabase.rpc("admin_list_users"),
    supabase.from("ai_usage_log").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("products").select("*").order("position"),
    supabase.from("product_access").select("*"),
  ]);

  const creatorIds = Array.from(
    new Set((usageLog ?? []).map((log) => log.created_by).filter((id): id is string => Boolean(id)))
  );
  const { data: creators } = creatorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", creatorIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const creatorNames = Object.fromEntries((creators ?? []).map((c) => [c.id, c.full_name]));

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShieldCheck size={22} className="text-accent" />
        <h1 className="text-[22px] font-semibold leading-tight text-text-primary">Admin</h1>
      </div>
      <p className="mt-1 max-w-[70ch] text-[13px] text-text-secondary">
        Aprove cadastros novos e gerencie os papéis da equipe.
      </p>

      <Card className="mt-6 p-5">
        <UsersManager initialUsers={users ?? []} currentUserId={user.id} />
      </Card>

      <Card className="mt-6 p-5">
        <ProductManager
          initialProducts={products ?? []}
          initialAccess={productAccess ?? []}
          users={users ?? []}
          currentUserId={user.id}
        />
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 text-sm font-medium text-text-primary">Uso de IA</h2>
        <UsageLogPanel logs={usageLog ?? []} creatorNames={creatorNames} />
      </Card>
    </div>
  );
}
