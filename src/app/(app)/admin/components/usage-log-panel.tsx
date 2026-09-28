import { Badge } from "@/components/ui/badge";
import type { AiModule, Database } from "@/lib/supabase/types";

type UsageLogRow = Database["public"]["Tables"]["ai_usage_log"]["Row"];

interface UsageLogPanelProps {
  logs: UsageLogRow[];
  creatorNames: Record<string, string | null>;
}

const MODULE_LABEL: Record<AiModule, string> = {
  conversa: "Conversa",
  mensagem: "Mensagem",
  imagem: "Imagem",
  email: "E-mail",
  blog: "Blog",
  egi: "Egi (atendimento)",
};

const PROVIDER_LABEL: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
};

export function UsageLogPanel({ logs, creatorNames }: UsageLogPanelProps) {
  const totalsByProvider = logs.reduce<Record<string, number>>((acc, log) => {
    if (!log.provider) return acc;
    acc[log.provider] = (acc[log.provider] ?? 0) + 1;
    return acc;
  }, {});

  if (logs.length === 0) {
    return <p className="text-xs text-text-muted">Nenhum uso de IA registrado ainda.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(totalsByProvider).map(([provider, count]) => (
          <Badge key={provider} tone="neutral">
            {PROVIDER_LABEL[provider] ?? provider}: {count}
          </Badge>
        ))}
      </div>

      <div className="mt-4 max-h-96 overflow-y-auto rounded-lg border border-border">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border text-text-muted">
              <th className="px-3 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">Usuário</th>
              <th className="px-3 py-2 font-medium">Módulo</th>
              <th className="px-3 py-2 font-medium">Provedor</th>
              <th className="px-3 py-2 font-medium">Modelo</th>
              <th className="px-3 py-2 font-medium">Tokens</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-text-secondary">
                  {new Date(log.created_at).toLocaleString("pt-BR")}
                </td>
                <td className="px-3 py-2 text-text-secondary">
                  {(log.created_by && creatorNames[log.created_by]) || "—"}
                </td>
                <td className="px-3 py-2 text-text-secondary">{MODULE_LABEL[log.module]}</td>
                <td className="px-3 py-2 text-text-secondary">
                  {log.provider ? PROVIDER_LABEL[log.provider] ?? log.provider : "—"}
                </td>
                <td className="px-3 py-2 text-text-secondary">{log.model ?? "—"}</td>
                <td className="px-3 py-2 text-text-secondary">{log.tokens_used ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
