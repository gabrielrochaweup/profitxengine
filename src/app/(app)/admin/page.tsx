import { redirect } from "next/navigation";
import { ShieldCheck } from "@/components/ui/icones";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { UsersManager } from "./components/users-manager";
import { PageContainer, PageHeader, Section } from "@/components/ui/page";
import { AdminAreas } from "./admin-areas";
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

  const [{ data: users }, { data: usageLog }, { data: products }] = await Promise.all([
    supabase.rpc("admin_list_users"),
    supabase.from("ai_usage_log").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("products").select("*").order("position"),
  ]);

  const creatorIds = Array.from(
    new Set((usageLog ?? []).map((log) => log.created_by).filter((id): id is string => Boolean(id)))
  );
  const { data: creators } = creatorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", creatorIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const creatorNames = Object.fromEntries((creators ?? []).map((c) => [c.id, c.full_name]));

  return (
    <PageContainer largura="amplo">
      <PageHeader
        titulo={
          <span className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-accent-text" />
            Admin
          </span>
        }
        descricao="Equipe, produtos e uso de IA."
      />

      <AdminAreas
        pendentes={(users ?? []).filter((u) => u.status === "pending").length}
        equipe={
          <Section>
            <UsersManager initialUsers={users ?? []} currentUserId={user.id} />
          </Section>
        }
        produtos={
          <Section>
            <ProductManager initialProducts={products ?? []} users={users ?? []} />
          </Section>
        }
        uso={
          <Section>
            <UsageLogPanel logs={usageLog ?? []} creatorNames={creatorNames} />
          </Section>
        }
      />
    </PageContainer>
  );
}
