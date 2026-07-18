"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewDynamicWizard } from "./components/new-dynamic-wizard";
import type { Database } from "@/lib/supabase/types";

type MessageDynamic = Database["public"]["Tables"]["message_dynamics"]["Row"];

interface DinamicasClientProps {
  initialDynamics: MessageDynamic[];
  slotCounts: Record<string, number>;
  canEdit: boolean;
}

export function DinamicasClient({ initialDynamics, slotCounts, canEdit }: DinamicasClientProps) {
  const [dynamics, setDynamics] = useState(initialDynamics);
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/dinamicas-do-dia"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={14} />
          Voltar pra Dinâmicas do Dia
        </Link>
        {canEdit && (
          <Button type="button" onClick={() => setWizardOpen(true)}>
            <Plus size={16} />
            Nova dinâmica
          </Button>
        )}
      </div>

      <NewDynamicWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        dynamics={dynamics}
        onCreated={(dynamic) => setDynamics((prev) => [...prev, dynamic])}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dynamics.map((dynamic) => (
          <Link key={dynamic.id} href={`/dinamicas-do-dia/gerenciar/${dynamic.id}`}>
            <Card className="h-full p-5 transition-colors hover:border-accent">
              <div className="flex items-start justify-between">
                <span className="text-2xl">{dynamic.icon || "✨"}</span>
                {!dynamic.active && <Badge tone="neutral">Inativa</Badge>}
              </div>
              <h3 className="mt-2 text-sm font-medium text-text-primary">{dynamic.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-text-muted">{dynamic.subtitle}</p>
              <p className="mt-3 text-xs text-text-secondary">{slotCounts[dynamic.id] ?? 0} mensagens</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
