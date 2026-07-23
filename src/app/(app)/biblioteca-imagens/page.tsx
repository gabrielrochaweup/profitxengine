import { redirect } from "next/navigation";
import { createClient, getUser, getProfile } from "@/lib/supabase/server";
import { BibliotecaImagensClient } from "./biblioteca-imagens-client";

export default async function BibliotecaImagensPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const [{ data: images }, { data: profile }] = await Promise.all([
    supabase.from("generated_images").select("*").order("created_at", { ascending: false }).limit(1000),
    getProfile(user.id),
  ]);

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Biblioteca de Imagens</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Todas as imagens geradas por qualquer pessoa da equipe, em qualquer dispositivo — organizadas em
        pastas de acordo com onde foram criadas.
      </p>

      <BibliotecaImagensClient
        initialImages={images ?? []}
        currentUserId={user.id}
        isAdmin={profile?.role === "admin"}
      />
    </div>
  );
}
