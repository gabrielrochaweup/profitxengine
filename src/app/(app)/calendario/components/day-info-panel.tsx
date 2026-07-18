"use client";

import Link from "next/link";
import { Sparkles, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DayNewsPreview } from "./day-news-preview";
import type { DayIndicator } from "./calendar-grid";

interface DayInfoPanelProps {
  dateKey: string;
  indicator?: DayIndicator;
}

export function DayInfoPanel({ dateKey, indicator }: DayInfoPanelProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
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
        <DayNewsPreview dateKey={dateKey} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        <Link href={`/dinamicas-do-dia?data=${dateKey}`}>
          <Button type="button" size="sm">
            Ver/criar Dinâmica do Dia
          </Button>
        </Link>
        <Link href={`/dinamicas-do-dia?data=${dateKey}&mode=livre`}>
          <Button type="button" variant="secondary" size="sm">
            Gerar mensagem livre com IA
          </Button>
        </Link>
        <Link href={`/mensagens-x1?data=${dateKey}`}>
          <Button type="button" variant="secondary" size="sm">
            Criar Mensagem X1
          </Button>
        </Link>
      </div>
    </div>
  );
}
