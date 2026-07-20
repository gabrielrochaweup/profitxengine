"use client";

import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMonthMatrix, toDateKey, MONTH_LABELS, WEEKDAY_LABELS } from "../lib/date-utils";

export interface DayIndicator {
  grupoCount: number;
  directCount: number;
  hasDynamic: boolean;
  dynamicName?: string | null;
  dynamicIcon?: string | null;
  concluded?: boolean;
}

interface CalendarGridProps {
  year: number;
  month: number;
  onNavigate: (direction: -1 | 1) => void;
  indicatorsByDate: Record<string, DayIndicator>;
  selectedDate: string | null;
  onSelectDay: (dateKey: string) => void;
}

export function CalendarGrid({
  year,
  month,
  onNavigate,
  indicatorsByDate,
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
          if (!date) return <div key={index} className="h-16" />;

          const dateKey = toDateKey(date);
          const indicator = indicatorsByDate[dateKey];
          const isSelected = selectedDate === dateKey;
          const isToday = dateKey === todayKey;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectDay(dateKey)}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 rounded-xl border text-sm transition-colors",
                isSelected
                  ? "border-accent bg-accent/15 text-text-primary"
                  : "border-transparent text-text-secondary hover:bg-card-hover",
                isToday && !isSelected && "border-border-strong"
              )}
            >
              <span className="flex items-center gap-1">
                {date.getDate()}
                {indicator?.hasDynamic &&
                  (indicator.dynamicIcon ? (
                    <span className="text-[11px] leading-none">{indicator.dynamicIcon}</span>
                  ) : (
                    <Sparkles size={10} className="text-accent" />
                  ))}
                {indicator?.concluded && <span className="text-[9px] leading-none text-success">✓</span>}
              </span>
              {((indicator?.grupoCount ?? 0) > 0 || (indicator?.directCount ?? 0) > 0) && (
                <div className="flex items-center gap-1">
                  {indicator.grupoCount > 0 && (
                    <span className="flex items-center gap-0.5 rounded-button bg-accent/20 px-1 text-[9px] font-medium text-accent">
                      G{indicator.grupoCount}
                    </span>
                  )}
                  {indicator.directCount > 0 && (
                    <span className="flex items-center gap-0.5 rounded-button bg-accent-pink/20 px-1 text-[9px] font-medium text-accent-pink">
                      D{indicator.directCount}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
