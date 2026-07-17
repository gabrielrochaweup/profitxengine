"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import type { Database, StudentSegment } from "@/lib/supabase/types";

type DirectMessage = Database["public"]["Tables"]["direct_messages"]["Row"];

const SEGMENT_LABEL: Record<StudentSegment, string> = {
  iniciante: "Iniciante",
  avancado: "Avançado",
  inativo: "Inativo",
};

export function DirectHistoryPanel({ messages }: { messages: DirectMessage[] }) {
  const [segmentFilter, setSegmentFilter] = useState("todos");
  const [temaFilter, setTemaFilter] = useState("todos");

  const temas = useMemo(() => {
    const set = new Set(messages.map((m) => m.tema).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [messages]);

  const filtered = useMemo(
    () =>
      messages
        .filter((m) => segmentFilter === "todos" || m.student_segment === segmentFilter)
        .filter((m) => temaFilter === "todos" || m.tema === temaFilter)
        .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date)),
    [messages, segmentFilter, temaFilter]
  );

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <Select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value)} className="w-48">
          <option value="todos">Todos os segmentos</option>
          {Object.entries(SEGMENT_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Select value={temaFilter} onChange={(e) => setTemaFilter(e.target.value)} className="w-48">
          <option value="todos">Todos os temas</option>
          {temas.map((tema) => (
            <option key={tema} value={tema}>
              {tema}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="mt-4 px-6 py-16 text-center text-sm text-text-muted">Nenhuma mensagem encontrada.</Card>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{m.scheduled_date.split("-").reverse().join("/")}</span>
                <Badge>{SEGMENT_LABEL[(m.student_segment as StudentSegment) ?? "iniciante"]}</Badge>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-text-primary">{m.generated_text || "Sem texto gerado"}</p>
              {m.tema && <p className="mt-2 text-[11px] text-text-muted">#{m.tema}</p>}
              {m.result && (
                <span
                  className={`mt-2 inline-block rounded-button px-2 py-0.5 text-[11px] ${
                    m.result === "funcionou" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                  }`}
                >
                  {m.result === "funcionou" ? "Funcionou" : "Não funcionou"}
                </span>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
