import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <PlaceholderPage
      title="Admin"
      description="Gestão de usuários, papéis, status das conexões de IA e log de uso."
      icon={ShieldCheck}
      phase="Fase 6"
    />
  );
}
