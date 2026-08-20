import { useEffect, useState } from "react";

export type UrgencyLevel = "none" | "ok" | "soon" | "urgent";

// Verde enquanto sobra tempo tranquilo, amarelo a partir de 2h antes do
// prazo, vermelho a partir de 1h antes (inclui atrasada). Tarefa concluída
// ou sem prazo definido não tem cor de urgência.
export function getUrgencyLevel(dueAt: string | null, completed: boolean): UrgencyLevel {
  if (completed || !dueAt) return "none";
  const diffHours = (new Date(dueAt).getTime() - Date.now()) / (1000 * 60 * 60);
  if (diffHours <= 1) return "urgent";
  if (diffHours <= 2) return "soon";
  return "ok";
}

export const URGENCY_TEXT_CLASS: Record<UrgencyLevel, string> = {
  none: "text-text-muted",
  ok: "text-success",
  soon: "text-warning",
  urgent: "text-danger",
};

export const URGENCY_DOT_CLASS: Record<UrgencyLevel, string> = {
  none: "bg-text-muted",
  ok: "bg-success",
  soon: "bg-warning",
  urgent: "bg-danger",
};

export function urgencyLabel(dueAt: string | null, completed: boolean): string | null {
  if (completed || !dueAt) return null;
  const diffMs = new Date(dueAt).getTime() - Date.now();
  if (diffMs < 0) return "Atrasada";
  const totalMinutes = Math.round(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `Faltam ${hours}h${minutes > 0 ? ` ${minutes}min` : ""}`;
  return `Faltam ${minutes}min`;
}

export function formatDueAt(dueAt: string): string {
  const date = new Date(dueAt);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
}

/** Força um re-render a cada minuto — usado pra cor de urgência acompanhar
 * o relógio sem precisar recarregar a tela. */
export function useMinuteTick(): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
}
