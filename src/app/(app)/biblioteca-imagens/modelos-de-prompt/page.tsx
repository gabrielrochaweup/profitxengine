import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { ModelosPromptClient } from "./modelos-prompt-client";
import { PageContainer, PageHeader } from "@/components/ui/page";

export default async function ModelosDePromptPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await getProfile(user.id);
  const activeProduct = await getActiveProduct(user.id, profile?.role === "admin");

  const emptyResult = Promise.resolve({ data: [] });
  const [{ data: templates }, { data: characters }, { data: tones }, { data: ctas }] = await Promise.all([
    activeProduct
      ? supabase.from("image_prompt_templates").select("*").eq("product_id", activeProduct.id).order("position")
      : emptyResult,
    activeProduct
      ? supabase.from("image_prompt_characters").select("*").eq("product_id", activeProduct.id).order("position")
      : emptyResult,
    activeProduct
      ? supabase.from("image_prompt_tones").select("*").eq("product_id", activeProduct.id).order("position")
      : emptyResult,
    activeProduct
      ? supabase.from("image_prompt_ctas").select("*").eq("product_id", activeProduct.id).order("position")
      : emptyResult,
  ]);

  return (
    <PageContainer largura="padrao">
      <PageHeader
        titulo="Modelos de Prompt (Imagem)"
        descricao={
          <>
            Templates com variáveis pra montar prompts de imagem sem reescrever tudo — combine um modelo com um
            personagem e um tom. Usado no &ldquo;Prompt pré-definido&rdquo; do gerador de imagens.
          </>
        }
      />
      <ModelosPromptClient
        key={activeProduct?.id ?? "none"}
        initialTemplates={templates ?? []}
        initialCharacters={characters ?? []}
        initialTones={tones ?? []}
        initialCtas={ctas ?? []}
        currentUserId={user.id}
        isAdmin={profile?.role === "admin"}
      />
    </PageContainer>
  );
}
