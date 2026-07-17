"use client";

import Link from "next/link";
import { Sparkles, Users, MessageCircle, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DayNewsPreview } from "./day-news-preview";
import type { DayIndicator } from "./calendar-grid";

interface DayInfoPanelProps {
  dateKey: string;
  indicator?: DayIndicator;
  onClose: () => void;
}

export function DayInfoPanel({ dateKey, indicator, onClose }: DayInfoPanelProps) {
  const dateLabel = dateKey.split("-").reverse().join("/");

  return (
    <Card className="mt-4 max-w-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-text-primary">{dateLabel}</h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-card-hover"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-secondary">
        {indicator?.hasDynamic ? (
          <span className="flex items-center gap-1 rounded-button bg-accent/15 px-2 py-1 text-accent">
            <Sparkles size={12} />
            Dinâmica ativa nesse dia
          </span>
        ) : (
          <span className="rounded-button bg-card-hover px-2 py-1 text-text-muted">Nenhuma dinâmica rodou ainda</span>
        )}
        <span className="flex items-center gap-1 rounded-button bg-card-hover px-2 py-1">
          <Users size={12} />
          {indicator?.directCount ?? 0} mensagens X1
        </span>
        <span className="flex items-center gap-1 rounded-button bg-card-hover px-2 py-1">
          <MessageCircle size={12} />
          {indicator?.grupoCount ?? 0} mensagens livres de Grupo
        </span>
      </div>

      <div className="mt-4">
        <DayNewsPreview />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        <Link href={`/calendario/dinamicas-do-dia?date=${dateKey}`}>
          <Button type="button" size="sm">
            Ver/criar Dinâmica do Dia
          </Button>
        </Link>
        <Link href={`/calendario/dinamicas-do-dia?date=${dateKey}&mode=livre`}>
          <Button type="button" variant="secondary" size="sm">
            Gerar mensagem livre com IA
          </Button>
        </Link>
        <Link href={`/calendario/x1?date=${dateKey}`}>
          <Button type="button" variant="secondary" size="sm">
            Criar Mensagem X1
          </Button>
        </Link>
      </div>
    </Card>
  );
}
