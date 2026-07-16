import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function ConfiguracoesPage() {
  return (
    <PlaceholderPage
      title="Configurações"
      description="Chaves de API (OpenAI/Anthropic) e preferências de geração por módulo."
      icon={Settings}
      phase="Fase 2"
    />
  );
}
