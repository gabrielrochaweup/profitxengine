"use client";

import { useMemo, useState } from "react";
import { CalendarGrid } from "./components/calendar-grid";
import { DayPanel } from "./components/day-panel";
import { AnalyticsPanel } from "./components/analytics-panel";
import type { Database } from "@/lib/supabase/types";

type EngagementMessage = Database["public"]["Tables"]["engagement_messages"]["Row"];

interface CalendarioClientProps {
  initialMessages: EngagementMessage[];
  currentUserId: string;
}

export function CalendarioClient({ initialMessages, currentUserId }: CalendarioClientProps) {
  const [messages, setMessages] = useState<EngagementMessage[]>(initialMessages);
  const [tab, setTab] = useState<"calendario" | "analytics">("calendario");
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

  function handleNavigate(direction: -1 | 1) {
    const next = new Date(year, month + direction, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  function handleSaved(message: EngagementMessage) {
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === message.id);
      return exists ? prev.map((m) => (m.id === message.id ? message : m)) : [message, ...prev];
    });
  }

  function handleDeleted(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="mt-6">
      <div className="flex gap-1.5">
        <TabButton active={tab === "calendario"} onClick={() => setTab("calendario")}>
          Calendário
        </TabButton>
        <TabButton active={tab === "analytics"} onClick={() => setTab("analytics")}>
          Analytics
        </TabButton>
      </div>

      {tab === "calendario" ? (
        <div className="mt-4 max-w-2xl rounded-card border border-border bg-card p-5">
          <CalendarGrid
            year={year}
            month={month}
            onNavigate={handleNavigate}
            messagesByDate={messagesByDate}
            selectedDate={selectedDate}
            onSelectDay={setSelectedDate}
          />
          <div className="mt-4 flex gap-4 text-[11px] text-text-muted">
            <LegendDot color="bg-text-muted" label="Rascunho" />
            <LegendDot color="bg-warning" label="Aprovada" />
            <LegendDot color="bg-success" label="Enviada" />
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <AnalyticsPanel messages={messages} />
        </div>
      )}

      {selectedDate && (
        <DayPanel
          open={!!selectedDate}
          dateKey={selectedDate}
          messages={messagesByDate[selectedDate] ?? []}
          currentUserId={currentUserId}
          onClose={() => setSelectedDate(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
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

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
