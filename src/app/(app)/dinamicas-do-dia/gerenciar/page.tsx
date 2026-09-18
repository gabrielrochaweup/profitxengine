import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { DinamicasClient } from "./dinamicas-client";
import { PageContainer, PageHeader } from "@/components/ui/page";

export default async function DinamicasPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const supabase = createClient();
  const { data: dynamics } = await supabase
    .from("message_dynamics")
    .select("*")
    .order("name");

  const { data: slots } = await supabase.from("message_dynamic_slots").select("dynamic_id");
  const slotCounts: Record<string, number> = {};
  (slots ?? []).forEach((s) => {
    slotCounts[s.dynamic_id] = (slotCounts[s.dynamic_id] ?? 0) + 1;
  });

  const { data: snapshots } = await supabase
    .from("dynamic_snapshots")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <PageContainer largura="padrao">
      <PageHeader
        titulo="Dinâmicas de Grupo"
        descricao="Temas de campanha do dia (Batalha, Bônus, Kamikaze...) com sua sequência de mensagens calculadas. Criação e edição restritas a administradores."
      />
      <DinamicasClient
        initialDynamics={dynamics ?? []}
        slotCounts={slotCounts}
        initialSnapshots={snapshots ?? []}
        canEdit={hasRole(profile.role, "admin")}
      />
    </PageContainer>
  );
}
