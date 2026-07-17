"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { CalendarGrid, type DayIndicator } from "./components/calendar-grid";
import { DayPanel } from "./components/day-panel";
import { DirectPanel } from "./components/direct-panel";
import { DirectHistoryPanel } from "./components/direct-history-panel";
import { AnalyticsPanel } from "./components/analytics-panel";
import type { Database } from "@/lib/supabase/types";

type EngagementMessage = Database["public"]["Tables"]["engagement_messages"]["Row"];
type DirectMessage = Database["public"]["Tables"]["direct_messages"]["Row"];
type DynamicSelection = { scheduled_date: string; dynamic_id: string | null };

interface CalendarioClientProps {
  initialMessages: EngagementMessage[];
  initialDirectMessages: DirectMessage[];
  initialDynamicSelections: DynamicSelection[];
  currentUserId: string;
}

export function CalendarioClient({
  initialMessages,
  initialDirectMessages,
  initialDynamicSelections,
  currentUserId,
}: CalendarioClientProps) {
  const [messages, setMessages] = useState<EngagementMessage[]>(initialMessages);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(initialDirectMessages);
  const [dynamicSelections] = useState<DynamicSelection[]>(initialDynamicSelections);

  const [subModule, setSubModule] = useState<"grupo" | "direct">("grupo");
  const [grupoTab, setGrupoTab] = useState<"calendario" | "analytics">("calendario");
  const [directTab, setDirectTab] = useState<"calendario" | "historico">("calendario");

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const messagesByDate = useMemo(() => {
    const map: Record<string, EngagementMessage[]> = {};
    messages.forEach((m) => {
      map[m.scheduled_date] = [...(map[m.scheduled_date] ?? []), m];
    });
    return map;
  }, [messages]);

  const directByDate = useMemo(() => {
    const map: Record<string, DirectMessage[]> = {};
    directMessages.forEach((m) => {
      map[m.scheduled_date] = [...(map[m.scheduled_date] ?? []), m];
    });
    return map;
  }, [directMessages]);

  const dynamicDates = useMemo(
    () => new Set(dynamicSelections.filter((d) => d.dynamic_id).map((d) => d.scheduled_date)),
    [dynamicSelections]
  );

  const indicatorsByDate = useMemo(() => {
    const map: Record<string, DayIndicator> = {};
    const allDates = new Set([
      ...Object.keys(messagesByDate),
      ...Object.keys(directByDate),
      ...Array.from(dynamicDates),
    ]);
    allDates.forEach((date) => {
      map[date] = {
        grupoCount: messagesByDate[date]?.length ?? 0,
        directCount: directByDate[date]?.length ?? 0,
        hasDynamic: dynamicDates.has(date),
      };
    });
    return map;
  }, [messagesByDate, directByDate, dynamicDates]);

  function handleNavigate(direction: -1 | 1) {
    const next = new Date(year, month + direction, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  function handleSavedGrupo(message: EngagementMessage) {
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === message.id);
      return exists ? prev.map((m) => (m.id === message.id ? message : m)) : [message, ...prev];
    });
  }
  function handleDeletedGrupo(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  function handleSavedDirect(message: DirectMessage) {
    setDirectMessages((prev) => {
      const exists = prev.some((m) => m.id === message.id);
      return exists ? prev.map((m) => (m.id === message.id ? message : m)) : [message, ...prev];
    });
  }
  function handleDeletedDirect(id: string) {
    setDirectMessages((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <TabButton active={subModule === "grupo"} onClick={() => setSubModule("grupo")}>
            Grupo
          </TabButton>
          <TabButton active={subModule === "direct"} onClick={() => setSubModule("direct")}>
            Direct (Alunos)
          </TabButton>
        </div>

        {subModule === "grupo" && (
          <Link
            href="/calendario/dinamicas"
            className="inline-flex items-center gap-1.5 rounded-button border border-border-strong px-3 py-1.5 text-xs text-text-secondary hover:bg-card-hover"
          >
            <Settings2 size={13} />
            Gerenciar dinâmicas
          </Link>
        )}
      </div>

      <div className="mt-3 flex gap-1.5">
        {subModule === "grupo" ? (
          <>
            <SubTabButton active={grupoTab === "calendario"} onClick={() => setGrupoTab("calendario")}>
              Calendário
            </SubTabButton>
            <SubTabButton active={grupoTab === "analytics"} onClick={() => setGrupoTab("analytics")}>
              Analytics
            </SubTabButton>
          </>
        ) : (
          <>
            <SubTabButton active={directTab === "calendario"} onClick={() => setDirectTab("calendario")}>
              Calendário
            </SubTabButton>
            <SubTabButton active={directTab === "historico"} onClick={() => setDirectTab("historico")}>
              Histórico
            </SubTabButton>
          </>
        )}
      </div>

      {subModule === "grupo" && grupoTab === "analytics" && (
        <div className="mt-4">
          <AnalyticsPanel messages={messages} />
        </div>
      )}

      {subModule === "direct" && directTab === "historico" && <DirectHistoryPanel messages={directMessages} />}

      {((subModule === "grupo" && grupoTab === "calendario") ||
        (subModule === "direct" && directTab === "calendario")) && (
        <div className="mt-4 max-w-2xl rounded-card border border-border bg-card p-5">
          <CalendarGrid
            year={year}
            month={month}
            onNavigate={handleNavigate}
            indicatorsByDate={indicatorsByDate}
            selectedDate={selectedDate}
            onSelectDay={setSelectedDate}
          />
          <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-text-muted">
            <LegendBadge color="bg-accent/20 text-accent" label="G = mensagens de Grupo" />
            <LegendBadge color="bg-accent-pink/20 text-accent-pink" label="D = mensagens de Direct" />
            <span className="flex items-center gap-1.5">✨ dinâmica ativa no dia</span>
          </div>
        </div>
      )}

      {selectedDate && subModule === "grupo" && (
        <DayPanel
          open={!!selectedDate}
          dateKey={selectedDate}
          messages={messagesByDate[selectedDate] ?? []}
          currentUserId={currentUserId}
          onClose={() => setSelectedDate(null)}
          onSaved={handleSavedGrupo}
          onDeleted={handleDeletedGrupo}
        />
      )}

      {selectedDate && subModule === "direct" && (
        <DirectPanel
          open={!!selectedDate}
          dateKey={selectedDate}
          messages={directByDate[selectedDate] ?? []}
          currentUserId={currentUserId}
          onClose={() => setSelectedDate(null)}
          onSaved={handleSavedDirect}
          onDeleted={handleDeletedDirect}
        />
      )}
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
      className={`rounded-button px-4 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-accent text-white" : "border border-border-strong text-text-secondary hover:bg-card-hover"
      }`}
    >
      {children}
    </button>
  );
}

function SubTabButton({
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
      className={`rounded-button px-3 py-1 text-xs font-medium transition-colors ${
        active ? "bg-card-hover text-text-primary" : "text-text-muted hover:text-text-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function LegendBadge({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`rounded-button px-1.5 py-0.5 text-[9px] font-medium ${color}`}>●</span>
      {label}
    </span>
  );
}
