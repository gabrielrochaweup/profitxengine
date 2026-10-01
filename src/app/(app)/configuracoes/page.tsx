import { redirect } from "next/navigation";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { ConfiguracoesClient } from "./configuracoes-client";
import { TradingPerformancePanel } from "./trading-performance-panel";
import { EgiConfigPanel } from "./egi-config-panel";
import { ConfiguracoesAreas } from "./configuracoes-areas";
import { PageContainer, PageHeader } from "@/components/ui/page";

export default async function ConfiguracoesPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const isAdmin = profile.role === "admin";

  return (
    <PageContainer largura="amplo">
      <PageHeader
        titulo="Configurações da Plataforma"
        descricao="Performance de trading, chaves de IA, modelos por tarefa e a Egi."
      />

      <ConfiguracoesAreas
        trading={<TradingPerformancePanel canEdit={hasRole(profile.role, "editor")} />}
        chaves={<ConfiguracoesClient isAdmin={isAdmin} secao="chaves" />}
        modelos={<ConfiguracoesClient isAdmin={isAdmin} secao="modelos" />}
        egi={<EgiConfigPanel isAdmin={isAdmin} />}
      />
    </PageContainer>
  );
}
