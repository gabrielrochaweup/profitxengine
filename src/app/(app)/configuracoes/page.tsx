import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { ConfiguracoesClient } from "./configuracoes-client";

export default async function ConfiguracoesPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Configurações</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Chaves de API (OpenAI/Anthropic) e preferências de geração por módulo.
      </p>

      <ConfiguracoesClient isAdmin={profile.role === "admin"} />
    </div>
  );
}
