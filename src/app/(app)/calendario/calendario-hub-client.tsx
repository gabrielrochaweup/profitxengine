"use client";

import { useMemo, useState } from "react";
import { CalendarGrid, type DayIndicator } from "./components/calendar-grid";
import { DayInfoPanel } from "./components/day-info-panel";
import { Modal } from "@/components/ui/modal";
import type { Database } from "@/lib/supabase/types";

type EngagementMessage = Database["public"]["Tables"]["engagement_messages"]["Row"];
type DirectMessage = Database["public"]["Tables"]["direct_messages"]["Row"];
type DynamicSelection = { scheduled_date: string; dynamic_id: string | null };

interface CalendarioHubClientProps {
  initialMessages: EngagementMessage[];
  initialDirectMessages: DirectMessage[];
  initialDynamicSelections: DynamicSelection[];
}

export function CalendarioHubClient({
  initialMessages,
  initialDirectMessages,
  initialDynamicSelections,
}: CalendarioHubClientProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const messagesByDate = useMemo(() => {
    const map: Record<string, EngagementMessage[]> = {};
    initialMessages.forEach((m) => {
      map[m.scheduled_date] = [...(map[m.scheduled_date] ?? []), m];
    });
    return map;
  }, [initialMessages]);

  const directByDate = useMemo(() => {
    const map: Record<string, DirectMessage[]> = {};
    initialDirectMessages.forEach((m) => {
      map[m.scheduled_date] = [...(map[m.scheduled_date] ?? []), m];
    });
    return map;
  }, [initialDirectMessages]);

  const dynamicDates = useMemo(
    () => new Set(initialDynamicSelections.filter((d) => d.dynamic_id).map((d) => d.scheduled_date)),
    [initialDynamicSelections]
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

  const selectedDateLabel = selectedDate ? selectedDate.split("-").reverse().join("/") : "";

  return (
    <div className="mt-4">
      <div className="w-full rounded-card border border-border bg-card p-5">
        <CalendarGrid
          year={year}
          month={month}
          onNavigate={handleNavigate}
          indicatorsByDate={indicatorsByDate}
          selectedDate={selectedDate}
          onSelectDay={setSelectedDate}
        />
        <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="rounded-button bg-accent/20 px-1.5 py-0.5 text-[9px] font-medium text-accent">G</span>
            mensagens livres de Grupo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="rounded-button bg-accent-pink/20 px-1.5 py-0.5 text-[9px] font-medium text-accent-pink">
              D
            </span>
            mensagens X1
          </span>
          <span className="flex items-center gap-1.5">✨ dinâmica ativa no dia</span>
        </div>
      </div>

      <Modal open={!!selectedDate} onClose={() => setSelectedDate(null)} title={selectedDateLabel}>
        {selectedDate && <DayInfoPanel dateKey={selectedDate} indicator={indicatorsByDate[selectedDate]} />}
      </Modal>
    </div>
  );
}
