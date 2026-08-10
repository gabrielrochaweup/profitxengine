import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { GeradorDeCriativosClient } from "./gerador-de-criativos-client";

export default async function GeradorDeCriativosPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const [{ data: posts }, { data: templates }, { data: carousels }] = await Promise.all([
    supabase.from("fake_posts").select("*").order("created_at", { ascending: false }),
    supabase.from("post_prompt_templates").select("*").order("position"),
    supabase.from("fake_carousels").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Gerador de Criativos</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Monte posts de rede social prontos pra baixar, ou gere criativos livres só com prompt.
      </p>

      <GeradorDeCriativosClient
        initialPosts={posts ?? []}
        initialTemplates={templates ?? []}
        initialCarousels={carousels ?? []}
        currentUserId={user.id}
      />
    </div>
  );
}
