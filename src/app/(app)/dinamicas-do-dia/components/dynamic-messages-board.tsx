"use client";

import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { isResultBlocked, type Depoimento, type MelhorCenario } from "@/lib/dynamics/calc-engine";
import { renderSlot, type ProductStatsByWindow } from "@/lib/dynamics/render-message";
import { MessageRow } from "./message-row";
import type { Database, TradingWindow } from "@/lib/supabase/types";

type MessageDynamic = Database["public"]["Tables"]["message_dynamics"]["Row"];
type MessageDynamicSlot = Database["public"]["Tables"]["message_dynamic_slots"]["Row"];

const PERIODS: { key: string; label: string }[] = [
  { key: "manha", label: "Manhã" },
  { key: "tarde", label: "Tarde" },
  { key: "noite", label: "Noite" },
];

function periodForTimeLabel(timeLabel: string | null): string {
  const hour = parseInt(timeLabel ?? "", 10);
  if (Number.isNaN(hour)) return "manha";
  if (hour < 12) return "manha";
  if (hour < 18) return "tarde";
  return "noite";
}

// A Maratona roda em 2 dias (sáb+dom) — cada slot já tem o dia no próprio
// time_label ("sáb 08h", "dom 08h"), então agrupamos por dia em vez de
// período pra não misturar sábado e domingo na mesma coluna.
const DAY_GROUPS: { key: string; label: string }[] = [
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

function dayGroupForTimeLabel(timeLabel: string | null): string {
  return timeLabel?.toLowerCase().startsWith("dom") ? "domingo" : "sabado";
}

export interface DynamicMessagesBoardProps {
  selectedDynamic: MessageDynamic;
  slots: MessageDynamicSlot[];
  dateKey: string;
  stats: ProductStatsByWindow;
  config: {
    cotacao: number;
    payoutCopy: number;
    payoutPepeLive: number;
    bancaCopy: number;
    entradaPepe: number;
    entradaLive: number;
    entradaCopyPct: number;
  };
  /** trading_config.numero_alavancagem_override — ver render-message.ts. */
  numeroAlavancagem: string | null;
  depoimento: Depoimento | null;
  fonteOverrides: Record<string, TradingWindow>;
  textOverrides: Record<string, string>;
  onFonteChange: (msgKey: string, fonte: TradingWindow) => void;
  onUseVariant: (msgKey: string, text: string) => void;
  onRestoreOriginal: (msgKey: string) => void;
  melhorPepe: MelhorCenario | null;
  melhorLive: MelhorCenario | null;
  melhorCopy: MelhorCenario | null;
  melhorTriad: MelhorCenario | null;
  rulesOpen: boolean;
  onToggleRules: () => void;
}

/**
 * Renderiza as mensagens de uma dinâmica já selecionada, agrupadas por
 * período (ou por dia, na Maratona). Compartilhado entre a aba "Hoje"
 * (persiste a escolha do dia) e "Consultar dinâmicas" (só visualização,
 * nada é salvo) — a diferença fica inteira nos handlers que cada uma passa.
 */
export function DynamicMessagesBoard({
  selectedDynamic,
  slots,
  dateKey,
  stats,
  config,
  numeroAlavancagem,
  depoimento,
  fonteOverrides,
  textOverrides,
  onFonteChange,
  onUseVariant,
  onRestoreOriginal,
  melhorPepe,
  melhorLive,
  melhorCopy,
  melhorTriad,
  rulesOpen,
  onToggleRules,
}: DynamicMessagesBoardProps) {
  const isMaratona = selectedDynamic.slug === "maratona";
  const groups = isMaratona ? DAY_GROUPS : PERIODS;
  const groupForSlot = isMaratona ? dayGroupForTimeLabel : periodForTimeLabel;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {melhorTriad && <MelhorBadge label="Usando" cenario={melhorTriad} triad />}
        {melhorPepe && <MelhorBadge label="Pepe" cenario={melhorPepe} />}
        {melhorLive && <MelhorBadge label="Live" cenario={melhorLive} />}
        {melhorCopy && <MelhorBadge label="Copy" cenario={melhorCopy} />}
        {selectedDynamic.rules.length > 0 && (
          <button
            type="button"
            onClick={onToggleRules}
            className="ml-auto flex items-center gap-1 rounded-button border border-border-strong px-2.5 py-1 text-[11px] text-text-secondary hover:bg-card-hover"
          >
            Regras universais
            {rulesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {rulesOpen && (
        <Card className="border-l-4 border-accent p-3">
          <ul className="space-y-0.5">
            {selectedDynamic.rules.map((rule, i) => (
              <li key={i} className="text-xs text-text-secondary">
                ✓ {rule}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className={`grid gap-4 ${isMaratona ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
        {groups.map((group) => {
          const periodSlots = slots.filter((slot) => groupForSlot(slot.time_label) === group.key);
          if (periodSlots.length === 0) return null;

          return (
            <div key={group.key} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{group.label}</h3>
              <div className="space-y-2">
                {periodSlots.map((slot, index) => {
                  // Prioridade: escolha manual do admin pra essa msg > melhor
                  // cenário calculado em tempo real (Pepe+Live+Copy juntos,
                  // não só Pepe) > default estático da msg (herdado de quando
                  // essa coluna era digitada à mão) > "semana" como último
                  // fallback. O default estático fica DEPOIS do cálculo ao
                  // vivo de propósito — antes ele vinha primeiro e deixava o
                  // "melhor cenário" morto (sempre "semana" fixo).
                  const fonte =
                    fonteOverrides[slot.msg_key] ??
                    melhorTriad?.fonte ??
                    (slot.fonte_default as TradingWindow) ??
                    "semana";
                  const { text, computedValues } = renderSlot({
                    template: slot.template,
                    position: slot.position,
                    totalSlots: slots.length,
                    fonte,
                    rotatingBanks: selectedDynamic.rotating_banks,
                    extraVars: selectedDynamic.extra_vars,
                    numeroAlavancagem,
                    vagasConfig: selectedDynamic.vagas_config,
                    stats,
                    config,
                    depoimento,
                    isWeekend: isMaratona,
                    dateKey,
                    dynamicSlug: selectedDynamic.slug,
                  });
                  const override = textOverrides[slot.msg_key];
                  const blocked = !override && isResultBlocked(text, computedValues);

                  return (
                    <MessageRow
                      key={slot.id}
                      slot={slot}
                      computedText={text}
                      overrideText={override}
                      blocked={blocked}
                      needsRealtimeUpdate={slot.needs_realtime_update}
                      alt={index % 2 === 1}
                      fonte={fonte}
                      onFonteChange={(f) => onFonteChange(slot.msg_key, f)}
                      onUseVariant={(variantText) => onUseVariant(slot.msg_key, variantText)}
                      onRestoreOriginal={() => onRestoreOriginal(slot.msg_key)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function MelhorBadge({ label, cenario, triad }: { label: string; cenario: MelhorCenario; triad?: boolean }) {
  return (
    <Badge tone={triad ? "warning" : "success"} className="flex items-center gap-1">
      <Trophy size={11} />
      {label}: {cenario.fonte} ({cenario.acerto}%)
    </Badge>
  );
}
