import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { CriativosLivre } from "./components/criativos-livre";

export default async function GeradorDeCriativosPage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Gerador de Criativos</h1>
      <p className="mt-1 text-sm text-text-secondary">Gere criativos livres só com prompt.</p>

      <CriativosLivre />
    </div>
  );
}
