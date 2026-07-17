import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ApprovalWindow {
  total: number;
  funcionou: number;
  pct: number;
}

export interface ApprovalContext {
  dia: ApprovalWindow;
  semana: ApprovalWindow;
  mes: ApprovalWindow;
  geral: ApprovalWindow;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function windowStats(rows: { scheduled_date: string; result: string | null }[], sinceDate: string | null): ApprovalWindow {
  const filtered = sinceDate ? rows.filter((r) => r.scheduled_date >= sinceDate) : rows;
  const total = filtered.length;
  const funcionou = filtered.filter((r) => r.result === "funcionou").length;
  return { total, funcionou, pct: total > 0 ? Math.round((funcionou / total) * 100) : 0 };
}

export async function getApprovalContext(scope: "grupo" | "direct"): Promise<ApprovalContext> {
  const admin = createAdminClient();
  const table = scope === "grupo" ? "engagement_messages" : "direct_messages";
  const { data } = await admin.from(table).select("scheduled_date, result").not("result", "is", null);
  const rows = data ?? [];

  const now = new Date();
  const since = (days: number) => toDateKey(new Date(now.getTime() - days * 86400000));

  return {
    dia: windowStats(rows, since(1)),
    semana: windowStats(rows, since(7)),
    mes: windowStats(rows, since(30)),
    geral: windowStats(rows, null),
  };
}

export function formatApprovalContext(ctx: ApprovalContext): string {
  if (ctx.geral.total === 0) return "";

  const line = (label: string, w: ApprovalWindow) =>
    w.total > 0 ? `${label}: ${w.pct}% de aprovação (${w.funcionou}/${w.total} mensagens)` : `${label}: sem dados ainda`;

  return [
    "Contexto de performance das mensagens anteriores (baseado em resultado marcado como funcionou/não funcionou):",
    line("Dia", ctx.dia),
    line("Semana", ctx.semana),
    line("Mês", ctx.mes),
    line("Geral", ctx.geral),
    "Priorize abordagens/padrões que estão performando melhor e evite repetir os que performaram pior.",
  ].join("\n");
}
