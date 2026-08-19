import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { getActiveProduct } from "@/lib/products-server";
import { BibliotecaImagensClient } from "./biblioteca-imagens-client";

export default async function BibliotecaImagensPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const { data: profile } = await getProfile(user.id);
  const activeProduct = await getActiveProduct(user.id, profile?.role === "admin");

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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold text-text-primary">Biblioteca de Imagens</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Todas as imagens geradas por qualquer pessoa da equipe, em qualquer dispositivo — arraste pra
            dentro das pastas pra organizar do seu jeito.
          </p>
        </div>
        <Link
          href="/biblioteca-imagens/modelos-de-prompt"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-button border border-border-strong px-3 py-1.5 text-xs text-text-secondary hover:bg-card-hover"
        >
          <Settings2 size={13} />
          Modelos de prompt
        </Link>
      </div>

      <BibliotecaImagensClient
        key={activeProduct?.id ?? "none"}
        initialImages={images ?? []}
        initialFolders={folders ?? []}
        currentUserId={user.id}
        isAdmin={profile?.role === "admin"}
      />
    </div>
  );
}
