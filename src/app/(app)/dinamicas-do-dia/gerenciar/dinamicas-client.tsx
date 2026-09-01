"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewDynamicWizard } from "./components/new-dynamic-wizard";
import { DynamicSnapshotDetailModal } from "./components/dynamic-snapshot-detail-modal";
import type { Database } from "@/lib/supabase/types";

type MessageDynamic = Database["public"]["Tables"]["message_dynamics"]["Row"];
type DynamicSnapshot = Database["public"]["Tables"]["dynamic_snapshots"]["Row"];

interface DinamicasClientProps {
  initialDynamics: MessageDynamic[];
  slotCounts: Record<string, number>;
  initialSnapshots: DynamicSnapshot[];
  canEdit: boolean;
}

export function DinamicasClient({ initialDynamics, slotCounts, initialSnapshots, canEdit }: DinamicasClientProps) {
  const [dynamics, setDynamics] = useState(initialDynamics);
  const [snapshots] = useState(initialSnapshots);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [tab, setTab] = useState<"atuais" | "anteriores">("atuais");
  const [openSnapshot, setOpenSnapshot] = useState<DynamicSnapshot | null>(null);

  const batches = useMemo(() => {
    const byLabel = new Map<string, DynamicSnapshot[]>();
    for (const s of snapshots) {
      const list = byLabel.get(s.label) ?? [];
      list.push(s);
      byLabel.set(s.label, list);
    }
    return Array.from(byLabel.entries());
  }, [snapshots]);

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
        {canEdit && tab === "atuais" && (
          <Button type="button" onClick={() => setWizardOpen(true)}>
            <Plus size={16} />
            Nova dinâmica
          </Button>
        )}
      </div>

      <div className="mb-4 flex gap-1.5 rounded-button border border-border-strong p-0.5 w-fit">
        <TabButton active={tab === "atuais"} onClick={() => setTab("atuais")}>
          Dinâmicas
        </TabButton>
        <TabButton active={tab === "anteriores"} onClick={() => setTab("anteriores")}>
          Dinâmicas anteriores
        </TabButton>
      </div>

      <NewDynamicWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        dynamics={dynamics}
        onCreated={(dynamic) => setDynamics((prev) => [...prev, dynamic])}
      />

      {tab === "atuais" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dynamics.map((dynamic) => (
            <Link key={dynamic.id} href={`/dinamicas-do-dia/gerenciar/${dynamic.id}`}>
              <Card className="h-full p-5 transition-shadow hover:shadow-[0_0_0_2px_var(--accent)]">
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
      ) : batches.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">Nenhuma cópia salva ainda.</p>
      ) : (
        <div className="space-y-6">
          {batches.map(([label, items]) => (
            <div key={label}>
              <p className="mb-2 text-xs font-medium text-text-secondary">{label}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((snapshot) => (
                  <Card
                    key={snapshot.id}
                    className="h-full cursor-pointer p-5 text-left transition-shadow hover:shadow-[0_0_0_2px_var(--accent)]"
                    onClick={() => setOpenSnapshot(snapshot)}
                  >
                    <span className="text-2xl">{snapshot.dynamic_icon || "✨"}</span>
                    <h3 className="mt-2 text-sm font-medium text-text-primary">{snapshot.dynamic_name}</h3>
                    <p className="mt-3 text-xs text-text-secondary">{snapshot.slots.length} mensagens salvas</p>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <DynamicSnapshotDetailModal snapshot={openSnapshot} onClose={() => setOpenSnapshot(null)} />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-button px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-accent text-white" : "text-text-secondary hover:bg-card-hover"
      }`}
    >
      {children}
    </button>
  );
}
