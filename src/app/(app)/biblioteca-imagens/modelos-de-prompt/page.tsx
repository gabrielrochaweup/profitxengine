import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { ModelosPromptClient } from "./modelos-prompt-client";

export default async function ModelosDePromptPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const [{ data: templates }, { data: characters }, { data: tones }, { data: profile }] = await Promise.all([
    supabase.from("image_prompt_templates").select("*").order("position"),
    supabase.from("image_prompt_characters").select("*").order("position"),
    supabase.from("image_prompt_tones").select("*").order("position"),
    getProfile(user.id),
  ]);

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Modelos de Prompt (Imagem)</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Templates com variáveis pra montar prompts de imagem sem reescrever tudo — combine um modelo com um
        personagem e um tom. Usado no &ldquo;Prompt pré-definido&rdquo; do gerador de imagens.
      </p>

      <ModelosPromptClient
        initialTemplates={templates ?? []}
        initialCharacters={characters ?? []}
        initialTones={tones ?? []}
        currentUserId={user.id}
        isAdmin={profile?.role === "admin"}
      />
    </div>
  );
}
