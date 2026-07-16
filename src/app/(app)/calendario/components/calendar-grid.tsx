"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMonthMatrix, toDateKey, MONTH_LABELS, WEEKDAY_LABELS } from "../lib/date-utils";
import type { Database } from "@/lib/supabase/types";

type EngagementMessage = Database["public"]["Tables"]["engagement_messages"]["Row"];

interface CalendarGridProps {
  year: number;
  month: number;
  onNavigate: (direction: -1 | 1) => void;
  messagesByDate: Record<string, EngagementMessage[]>;
  selectedDate: string | null;
  onSelectDay: (dateKey: string) => void;
}

const STATUS_DOT: Record<string, string> = {
  rascunho: "bg-text-muted",
  aprovada: "bg-warning",
  enviada: "bg-success",
};

export function CalendarGrid({
  year,
  month,
  onNavigate,
  messagesByDate,
  selectedDate,
  onSelectDay,
}: CalendarGridProps) {
  const weeks = getMonthMatrix(year, month);
  const todayKey = toDateKey(new Date());

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-medium text-text-primary">
          {MONTH_LABELS[month]} {year}
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onNavigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-card-hover"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => onNavigate(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-card-hover"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-text-muted">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((date, index) => {
          if (!date) return <div key={index} className="aspect-square" />;

          const dateKey = toDateKey(date);
          const dayMessages = messagesByDate[dateKey] ?? [];
          const isSelected = selectedDate === dateKey;
          const isToday = dateKey === todayKey;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectDay(dateKey)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-sm transition-colors",
                isSelected
                  ? "border-accent bg-accent/15 text-text-primary"
                  : "border-transparent text-text-secondary hover:bg-card-hover",
                isToday && !isSelected && "border-border-strong"
              )}
            >
              <span>{date.getDate()}</span>
              {dayMessages.length > 0 && (
                <div className="flex gap-0.5">
                  {dayMessages.slice(0, 3).map((m) => (
                    <span key={m.id} className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[m.status])} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
