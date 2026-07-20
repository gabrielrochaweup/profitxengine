"use client";

import { useMemo, useState } from "react";
import { CalendarGrid, type DayIndicator } from "./components/calendar-grid";
import { DayInfoPanel } from "./components/day-info-panel";
import { Modal } from "@/components/ui/modal";
import type { Database } from "@/lib/supabase/types";

type EngagementMessage = Database["public"]["Tables"]["engagement_messages"]["Row"];
type DirectMessage = Database["public"]["Tables"]["direct_messages"]["Row"];
type DynamicSelection = { scheduled_date: string; dynamic_id: string | null; concluded: boolean };
type DynamicMeta = { id: string; name: string; icon: string | null };

interface CalendarioHubClientProps {
  initialMessages: EngagementMessage[];
  initialDirectMessages: DirectMessage[];
  initialDynamicSelections: DynamicSelection[];
  dynamics: DynamicMeta[];
}

export function CalendarioHubClient({
  initialMessages,
  initialDirectMessages,
  initialDynamicSelections,
  dynamics,
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

  const dynamicsById = useMemo(() => {
    const map: Record<string, DynamicMeta> = {};
    dynamics.forEach((d) => {
      map[d.id] = d;
    });
    return map;
  }, [dynamics]);

  const dynamicByDate = useMemo(() => {
    const map: Record<string, DynamicSelection> = {};
    initialDynamicSelections.forEach((d) => {
      if (d.dynamic_id) map[d.scheduled_date] = d;
    });
    return map;
  }, [initialDynamicSelections]);

  const indicatorsByDate = useMemo(() => {
    const map: Record<string, DayIndicator> = {};
    const allDates = new Set([
      ...Object.keys(messagesByDate),
      ...Object.keys(directByDate),
      ...Object.keys(dynamicByDate),
    ]);
    allDates.forEach((date) => {
      const selection = dynamicByDate[date];
      const dynamic = selection?.dynamic_id ? dynamicsById[selection.dynamic_id] : null;
      map[date] = {
        grupoCount: messagesByDate[date]?.length ?? 0,
        directCount: directByDate[date]?.length ?? 0,
        hasDynamic: !!selection,
        dynamicName: dynamic?.name ?? null,
        dynamicIcon: dynamic?.icon ?? null,
        concluded: selection?.concluded ?? false,
      };
    });
    return map;
  }, [messagesByDate, directByDate, dynamicByDate, dynamicsById]);

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
