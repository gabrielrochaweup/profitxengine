"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

interface ApprovalWindow {
  total: number;
  funcionou: number;
  pct: number;
}
interface ApprovalContext {
  dia: ApprovalWindow;
  semana: ApprovalWindow;
  mes: ApprovalWindow;
  geral: ApprovalWindow;
}

const LABELS: { key: keyof ApprovalContext; label: string }[] = [
  { key: "dia", label: "Dia" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mês" },
  { key: "geral", label: "Geral" },
];

export function ApprovalContextPanel({ scope }: { scope: "grupo" | "direct" }) {
  const [context, setContext] = useState<ApprovalContext | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/performance/approval?scope=${scope}`)
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled && body.context) setContext(body.context);
      });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  if (!context || context.geral.total === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card-hover p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
        <TrendingUp size={13} />
        Performance de aprovação (funcionou vs. não funcionou)
      </p>
      <div className="grid grid-cols-4 gap-2">
        {LABELS.map(({ key, label }) => {
          const w = context[key];
          return (
            <div key={key} className="rounded-lg bg-card px-2 py-1.5 text-center">
              <p className="text-[10px] text-text-muted">{label}</p>
              <p className="text-sm font-semibold text-accent">{w.total > 0 ? `${w.pct}%` : "—"}</p>
              <p className="text-[9px] text-text-muted">{w.total} msgs</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
