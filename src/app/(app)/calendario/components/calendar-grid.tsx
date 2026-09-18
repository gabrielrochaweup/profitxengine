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
        <h2 className="text-base font-semibold text-text-primary">
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

      {/* Os nomes dos dias estavam em "muted", o nivel reservado pro que e
          apagado de proposito. Sao o cabecalho da tabela: quem le "ter" pra
          se achar na grade precisa enxergar. */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1.5">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
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
                // Todo dia tem superficie propria. Antes so o selecionado
                // tinha fundo, e o resto era um numero solto: nao dava pra ver
                // onde comecava e terminava a area clicavel.
                "flex h-16 flex-col items-center justify-center gap-1 rounded-xl text-sm transition-colors duration-150",
                isSelected
                  ? "bg-accent-soft text-text-primary shadow-[0_0_0_1.5px_var(--accent)]"
                  : "bg-card-hover text-text-primary hover:bg-input",
                // Hoje se anuncia pela cor do numero, nao por um fio de 1px
                // que se perde no meio de 30 celulas.
                isToday && !isSelected && "shadow-[0_0_0_1px_var(--accent)]"
              )}
            >
              <span className={cn("flex items-center gap-1 font-medium", isToday && !isSelected && "text-accent-text")}>
                {date.getDate()}
                {indicator?.hasDynamic &&
                  (indicator.dynamicIcon ? (
                    <span className="text-[11px] leading-none">{indicator.dynamicIcon}</span>
                  ) : (
                    <Sparkles size={10} className="text-accent-text" />
                  ))}
                {indicator?.concluded && <span className="text-[10px] leading-none text-success">✓</span>}
              </span>
              {((indicator?.grupoCount ?? 0) > 0 || (indicator?.directCount ?? 0) > 0) && (
                <div className="flex items-center gap-1">
                  {indicator.grupoCount > 0 && (
                    <span className="flex items-center gap-0.5 rounded-button bg-accent/20 px-1 text-[10px] font-medium text-accent-text">
                      G{indicator.grupoCount}
                    </span>
                  )}
                  {indicator.directCount > 0 && (
                    <span className="flex items-center gap-0.5 rounded-button bg-accent-pink/20 px-1 text-[10px] font-medium text-accent-pink">
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
