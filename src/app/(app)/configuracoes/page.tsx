import { redirect } from "next/navigation";
import { getSessionProfile, hasRole } from "@/lib/auth";
import { ConfiguracoesClient } from "./configuracoes-client";
import { TradingPerformancePanel } from "./trading-performance-panel";
import { EgiConfigPanel } from "./egi-config-panel";
import { PageContainer, PageHeader, Section } from "@/components/ui/page";

export default async function ConfiguracoesPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  return (
    <PageContainer largura="padrao">
      <PageHeader
        titulo="Configurações da Plataforma"
        descricao="Chaves de API (OpenAI/Anthropic), preferências de geração por módulo e performance de trading."
      />

      <ConfiguracoesClient isAdmin={profile.role === "admin"} />

      <Section
        className="mt-10"
        titulo="Egi — IA de atendimento"
        descricao="O prompt e os arquivos que guiam a Egi. O provedor e o modelo dela ficam em Provedor por tipo de tarefa, acima."
      >
        <EgiConfigPanel isAdmin={profile.role === "admin"} />
      </Section>

      <Section
        className="mt-10"
        titulo="Performance de Trading"
        descricao="Números reais de Pepe/Live/Copy Trader por janela — usados nos cálculos das dinâmicas de Grupo e no contexto de geração do Direct."
      >
        <TradingPerformancePanel canEdit={hasRole(profile.role, "editor")} />
      </Section>
    </PageContainer>
  );
}
