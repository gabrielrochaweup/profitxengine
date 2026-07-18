import { redirect } from "next/navigation";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { ConfiguracoesClient } from "./configuracoes-client";
import { TradingPerformancePanel } from "./trading-performance-panel";

export default async function ConfiguracoesPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">Configurações da Plataforma</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Chaves de API (OpenAI/Anthropic), preferências de geração por módulo e performance de trading.
      </p>

      <ConfiguracoesClient isAdmin={profile.role === "admin"} />

      <div className="mt-10">
        <h2 className="text-base font-medium text-text-primary">Performance de Trading</h2>
        <p className="mt-1 text-sm text-text-muted">
          Números reais de Pepe/Live/Copy Trader por janela — usados nos cálculos das dinâmicas de
          Grupo e no contexto de geração do Direct.
        </p>
        <div className="mt-4">
          <TradingPerformancePanel canEdit={hasRole(profile.role, "editor")} />
        </div>
      </div>
    </div>
  );
}
