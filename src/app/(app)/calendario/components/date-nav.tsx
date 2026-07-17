"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => shiftDay(-1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-strong text-text-secondary hover:bg-card-hover"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="flex items-center gap-2 rounded-input border border-border bg-input px-3 py-2">
        <input
          type="date"
          value={dateKey}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="bg-transparent text-sm text-text-primary outline-none [color-scheme:dark]"
        />
        <span className="text-xs capitalize text-text-muted">{label}</span>
      </div>
      <button
        type="button"
        onClick={() => shiftDay(1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-strong text-text-secondary hover:bg-card-hover"
      >
        <ChevronRight size={16} />
      </button>
      <button
        type="button"
        onClick={() => onChange(toDateKey(new Date()))}
        className="rounded-button border border-border-strong px-3 py-2 text-xs text-text-secondary hover:bg-card-hover"
      >
        Hoje
      </button>
    </div>
  );
}
