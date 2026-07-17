"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/supabase/types";

type MessageDynamic = Database["public"]["Tables"]["message_dynamics"]["Row"];

interface DinamicasClientProps {
  initialDynamics: MessageDynamic[];
  slotCounts: Record<string, number>;
  canEdit: boolean;
}

export function DinamicasClient({ initialDynamics, slotCounts, canEdit }: DinamicasClientProps) {
  const router = useRouter();
  const [dynamics, setDynamics] = useState(initialDynamics);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    const name = prompt("Nome da nova dinâmica (ex: Relâmpago):");
    if (!name) return;
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    setCreating(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("message_dynamics")
      .insert({
        slug: slug || `dinamica-${Date.now()}`,
        name,
        icon: "✨",
        subtitle: "",
        rules: [],
        vagas_config: { mode: "none" },
        rotating_banks: {},
        extra_vars: { link: "", linkU: "", linkL: "" },
        top5_config: null,
        active: true,
        created_by: user?.id ?? null,
      })
      .select()
      .single();

    setCreating(false);
    if (!error && data) {
      setDynamics((prev) => [...prev, data]);
      router.push(`/calendario/dinamicas/${data.id}`);
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/calendario"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={14} />
          Voltar ao Calendário
        </Link>
        {canEdit && (
          <Button type="button" onClick={handleCreate} disabled={creating}>
            <Plus size={16} />
            Nova dinâmica
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dynamics.map((dynamic) => (
          <Link key={dynamic.id} href={`/calendario/dinamicas/${dynamic.id}`}>
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
