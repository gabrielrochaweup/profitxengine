"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DateNav } from "../calendario/components/date-nav";
import { DirectHistoryPanel } from "./components/direct-history-panel";
import { X1Form } from "./components/x1-form";
import { toDateKey } from "../calendario/lib/date-utils";
import type { Database } from "@/lib/supabase/types";

type DirectMessage = Database["public"]["Tables"]["direct_messages"]["Row"];

interface X1ClientProps {
  initialMessages: DirectMessage[];
  currentUserId: string;
}

type InnerTab = "hoje" | "historico";

export function X1Client({ initialMessages, currentUserId }: X1ClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState(initialMessages);
  const [dateKey, setDateKey] = useState(searchParams.get("data") || toDateKey(new Date()));
  const [innerTab, setInnerTab] = useState<InnerTab>("hoje");

  const messagesForDate = useMemo(() => messages.filter((m) => m.scheduled_date === dateKey), [messages, dateKey]);

  function updateDate(next: string) {
    setDateKey(next);
    router.replace(`/mensagens-x1?data=${next}`);
  }

  function handleSaved(message: DirectMessage) {
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
      <DateNav dateKey={dateKey} onChange={updateDate} />

      <div className="mt-4 flex gap-1.5">
        <InnerTabButton active={innerTab === "hoje"} onClick={() => setInnerTab("hoje")}>
          Hoje
        </InnerTabButton>
        <InnerTabButton active={innerTab === "historico"} onClick={() => setInnerTab("historico")}>
          Histórico
        </InnerTabButton>
      </div>

      <div className="mt-4">
        {innerTab === "historico" ? (
          <DirectHistoryPanel messages={messages} />
        ) : (
          <X1Form
            dateKey={dateKey}
            messages={messagesForDate}
            currentUserId={currentUserId}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
          />
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
