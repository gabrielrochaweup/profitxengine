import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: string;
}

export function PlaceholderPage({ title, description, icon: Icon, phase }: PlaceholderPageProps) {
  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary">{title}</h1>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>

      <Card className="mt-6 flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card-hover text-text-secondary">
          <Icon size={22} strokeWidth={1.75} />
        </div>
        <p className="text-sm font-medium text-text-primary">Ainda não implementado</p>
        <p className="max-w-sm text-sm text-text-muted">
          Este módulo será construído na {phase} do plano.
        </p>
      </Card>
    </div>
  );
}
