import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { createClient, getUser } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { BibliotecaImagensClient } from "./biblioteca-imagens-client";

export default async function BibliotecaImagensPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const activeProduct = await getActiveProduct(user.id);

  const [{ data: images }, { data: folders }] = await Promise.all([
    activeProduct
      ? supabase
          .from("generated_images")
          .select("*")
          .eq("product_id", activeProduct.id)
          .order("created_at", { ascending: false })
          .limit(1000)
      : Promise.resolve({ data: [] }),
    activeProduct
      ? supabase.from("image_folders").select("*").eq("product_id", activeProduct.id).order("position")
      : Promise.resolve({ data: [] }),
  ]);

  return (
    // Galeria: quanto mais colunas de miniatura couberem, melhor.
    <PageContainer largura="amplo">
      <PageHeader
        titulo="Biblioteca de Imagens"
        descricao="Todas as imagens geradas por qualquer pessoa da equipe, em qualquer dispositivo — arraste pra dentro das pastas pra organizar do seu jeito."
        acoes={
          <Link
            href="/biblioteca-imagens/modelos-de-prompt"
            className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-button border border-border bg-card-hover px-2.5 text-xs font-medium text-text-primary transition-colors duration-150 hover:border-border-strong hover:bg-input"
          >
            <Settings2 size={13} />
            Modelos de prompt
          </Link>
        }
      />
      <BibliotecaImagensClient
        key={activeProduct?.id ?? "none"}
        initialImages={images ?? []}
        initialFolders={folders ?? []}
        currentUserId={user.id}

      />
    </PageContainer>
  );
}
