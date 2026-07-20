"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { DateNav } from "../calendario/components/date-nav";
import { AnalyticsPanel } from "./components/analytics-panel";
import { DynamicDayTable } from "./components/dynamic-day-table";
import { LivreGenerator } from "./components/livre-generator";
import { DayResultForm } from "./components/day-result-form";
import { toDateKey } from "../calendario/lib/date-utils";
import type { Database } from "@/lib/supabase/types";

type EngagementMessage = Database["public"]["Tables"]["engagement_messages"]["Row"];

interface DinamicasDoDiaClientProps {
  initialMessages: EngagementMessage[];
  currentUserId: string;
}

type Mode = "dinamica" | "livre";
type InnerTab = "hoje" | "analytics";

export function DinamicasDoDiaClient({ initialMessages, currentUserId }: DinamicasDoDiaClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState(initialMessages);
  const [dateKey, setDateKey] = useState(searchParams.get("data") || toDateKey(new Date()));
  const [mode, setMode] = useState<Mode>((searchParams.get("mode") as Mode) || "dinamica");
  const [innerTab, setInnerTab] = useState<InnerTab>("hoje");

  const messagesForDate = useMemo(() => messages.filter((m) => m.scheduled_date === dateKey), [messages, dateKey]);

  function updateDate(next: string) {
    setDateKey(next);
    router.replace(`/dinamicas-do-dia?data=${next}${mode === "livre" ? "&mode=livre" : ""}`);
  }

  function updateMode(next: Mode) {
    setMode(next);
    router.replace(`/dinamicas-do-dia?data=${dateKey}${next === "livre" ? "&mode=livre" : ""}`);
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateNav dateKey={dateKey} onChange={updateDate} />
        <Link
          href="/dinamicas-do-dia/gerenciar"
          className="inline-flex items-center gap-1.5 rounded-button border border-border-strong px-3 py-1.5 text-xs text-text-secondary hover:bg-card-hover"
        >
          <Settings2 size={13} />
          Gerenciar dinâmicas
        </Link>
      </div>

      <div className="mt-4 flex gap-1.5">
        <InnerTabButton active={innerTab === "hoje"} onClick={() => setInnerTab("hoje")}>
          Hoje
        </InnerTabButton>
        <InnerTabButton active={innerTab === "analytics"} onClick={() => setInnerTab("analytics")}>
          Analytics
        </InnerTabButton>
      </div>

      <div className="mt-4">
        {innerTab === "analytics" ? (
          <AnalyticsPanel messages={messages} />
        ) : (
          <>
            <div className="mb-4 flex gap-1.5">
              <ModeButton active={mode === "dinamica"} onClick={() => updateMode("dinamica")}>
                Usar dinâmica
              </ModeButton>
              <ModeButton active={mode === "livre"} onClick={() => updateMode("livre")}>
                Gerar livre com IA
              </ModeButton>
            </div>

            <div className="mb-4">
              <DayResultForm dateKey={dateKey} currentUserId={currentUserId} />
            </div>

            {mode === "dinamica" ? (
              <DynamicDayTable dateKey={dateKey} currentUserId={currentUserId} />
            ) : (
              <LivreGenerator
                dateKey={dateKey}
                messages={messagesForDate}
                currentUserId={currentUserId}
                onSaved={handleSaved}
                onDeleted={handleDeleted}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InnerTabButton({
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

function ModeButton({
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
      className={`rounded-button px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-accent text-white" : "border border-border-strong text-text-secondary hover:bg-card-hover"
      }`}
    >
      {children}
    </button>
  );
}
