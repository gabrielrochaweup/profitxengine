"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { CLIENT_LOCALES, CLIENT_LOCALE_SHORT_LABELS, CLIENT_LOCALE_LABELS } from "@/lib/supabase/types";
import type { ClientLocale } from "@/lib/supabase/types";

interface LocaleCarouselProps {
  active: ClientLocale;
  onChange: (locale: ClientLocale) => void;
}

export function LocaleCarousel({ active, onChange }: LocaleCarouselProps) {
  const index = CLIENT_LOCALES.indexOf(active);

  function go(direction: -1 | 1) {
    const next = (index + direction + CLIENT_LOCALES.length) % CLIENT_LOCALES.length;
    onChange(CLIENT_LOCALES[next]);
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => go(-1)}
        title="Idioma anterior"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-card-hover"
      >
        <ChevronLeft size={13} />
      </button>

      <div className="flex items-center gap-1">
        {CLIENT_LOCALES.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => onChange(loc)}
            title={CLIENT_LOCALE_LABELS[loc]}
            className={`rounded-button px-1.5 py-1 text-[10px] font-medium transition-colors ${
              loc === active ? "bg-accent text-white" : "text-text-secondary hover:bg-card-hover"
            }`}
          >
            {CLIENT_LOCALE_SHORT_LABELS[loc]}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => go(1)}
        title="Próximo idioma"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-card-hover"
      >
        <ChevronRight size={13} />
      </button>
    </div>
  );
}
