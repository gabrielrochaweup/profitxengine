"use client";

import { ChevronLeft, ChevronRight } from "@/components/ui/icones";
import { toDateKey } from "../lib/date-utils";

interface DateNavProps {
  dateKey: string;
  onChange: (dateKey: string) => void;
}

export function DateNav({ dateKey, onChange }: DateNavProps) {
  function shiftDay(delta: number) {
    const date = new Date(`${dateKey}T00:00:00`);
    date.setDate(date.getDate() + delta);
    onChange(toDateKey(date));
  }

  const label = new Date(`${dateKey}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => shiftDay(-1)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-card-hover"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="flex min-w-0 items-center gap-2 rounded-input bg-input px-3 py-2">
        <input
          type="date"
          value={dateKey}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="min-w-0 bg-transparent text-sm text-text-primary outline-none [color-scheme:dark]"
        />
        <span className="hidden truncate text-xs capitalize text-text-muted sm:inline">{label}</span>
      </div>
      <button
        type="button"
        onClick={() => shiftDay(1)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-card-hover"
      >
        <ChevronRight size={16} />
      </button>
      <button
        type="button"
        onClick={() => onChange(toDateKey(new Date()))}
        className="shrink-0 rounded-button bg-card-hover px-3 py-2 text-xs text-text-secondary shadow-card-sm hover:brightness-95"
      >
        Hoje
      </button>
    </div>
  );
}
