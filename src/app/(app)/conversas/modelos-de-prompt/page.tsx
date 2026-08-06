import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { ModelosPromptClient } from "./modelos-prompt-client";

export default async function ModelosDePromptConversasPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const [{ data: templates }, { data: styles }, { data: variations }, { data: imageVariants }, { data: profile }] =
    await Promise.all([
      supabase.from("testimonial_prompt_templates").select("*").order("position"),
      supabase.from("testimonial_prompt_styles").select("*").order("position"),
      supabase.from("testimonial_prompt_variations").select("*").order("position"),
      supabase.from("testimonial_prompt_image_variants").select("*").order("position"),
      getProfile(user.id),
    ]);

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Modelos de Prompt (Depoimentos)</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Cenários com variáveis pra montar prompts de depoimento de cliente sem reescrever tudo — combine um
        cenário com um estilo de português, uma variação de interação e a presença ou não de imagem. Usado no
        &ldquo;Prompt pré-definido&rdquo; do gerador de conversas.
      </p>

      <ModelosPromptClient
        initialTemplates={templates ?? []}
        initialStyles={styles ?? []}
        initialVariations={variations ?? []}
        initialImageVariants={imageVariants ?? []}
        currentUserId={user.id}
        isAdmin={profile?.role === "admin"}
      />
    </div>
  );
}
