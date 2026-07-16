import { Library } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function PromptsPage() {
  return (
    <PlaceholderPage
      title="Biblioteca de Prompts"
      description="Meus prompts salvos, reutilizáveis entre os módulos de conversas, mensagens e e-mails."
      icon={Library}
      phase="Fase 2"
    />
  );
}
