import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { DynamicEditorClient } from "./dynamic-editor-client";

export default async function DynamicEditorPage({ params }: { params: { id: string } }) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const supabase = createClient();
  const [{ data: dynamic }, { data: slots }] = await Promise.all([
    supabase.from("message_dynamics").select("*").eq("id", params.id).single(),
    supabase
      .from("message_dynamic_slots")
      .select("*")
      .eq("dynamic_id", params.id)
      .order("position", { ascending: true }),
  ]);

  if (!dynamic) notFound();

  return (
    <DynamicEditorClient
      initialDynamic={dynamic}
      initialSlots={slots ?? []}
      canEdit={hasRole(profile.role, "admin")}
    />
  );
}
