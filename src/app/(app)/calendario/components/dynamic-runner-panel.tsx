"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  calcularMelhorCenario,
  calcularMelhorCenarioCopy,
  charCountLevel,
  isResultBlocked,
  sortearDepoimento,
  type Depoimento,
  type MelhorCenario,
} from "@/lib/dynamics/calc-engine";
import { renderSlot, type ProductStatsByWindow } from "@/lib/dynamics/render-message";
import type { Database, TradingWindow } from "@/lib/supabase/types";

type MessageDynamic = Database["public"]["Tables"]["message_dynamics"]["Row"];
type MessageDynamicSlot = Database["public"]["Tables"]["message_dynamic_slots"]["Row"];

interface DynamicRunnerPanelProps {
  dateKey: string;
  currentUserId: string;
}

const WINDOWS: TradingWindow[] = ["dia", "semana", "mes", "total"];

function emptyStatsByWindow(): Record<TradingWindow, { wins: number; losses: number }> {
  return { dia: { wins: 0, losses: 0 }, semana: { wins: 0, losses: 0 }, mes: { wins: 0, losses: 0 }, total: { wins: 0, losses: 0 } };
}

export function DynamicRunnerPanel({ dateKey, currentUserId }: DynamicRunnerPanelProps) {
  const [dynamics, setDynamics] = useState<MessageDynamic[]>([]);
  const [selectedDynamicId, setSelectedDynamicId] = useState<string>("");
  const [slots, setSlots] = useState<MessageDynamicSlot[]>([]);
  const [stats, setStats] = useState<ProductStatsByWindow>({
    pepe: emptyStatsByWindow(),
    live: emptyStatsByWindow(),
    copy: emptyStatsByWindow(),
    copyRendimento: { dia: 0, semana: 0, mes: 0, total: 0 },
  });
  const [config, setConfig] = useState({
    cotacao: 5.5,
    payoutCopy: 72,
    payoutPepeLive: 72,
    bancaCopy: 5000,
    entradaPepe: 10,
    entradaLive: 50,
  });
  const [fonteOverrides, setFonteOverrides] = useState<Record<string, TradingWindow>>({});
  const [depoimento, setDepoimento] = useState<Depoimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: dyns }, { data: statsRows }, { data: configRow }, { data: selection }] = await Promise.all([
        supabase.from("message_dynamics").select("*").eq("active", true).order("name"),
        supabase.from("trading_performance_stats").select("*"),
        supabase.from("trading_config").select("*").eq("id", 1).single(),
        supabase.from("daily_dynamic_selection").select("*").eq("scheduled_date", dateKey).maybeSingle(),
      ]);

      setDynamics(dyns ?? []);

      if (statsRows) {
        const next: ProductStatsByWindow = {
          pepe: emptyStatsByWindow(),
          live: emptyStatsByWindow(),
          copy: emptyStatsByWindow(),
          copyRendimento: { dia: 0, semana: 0, mes: 0, total: 0 },
        };
        statsRows.forEach((row) => {
          next[row.product][row.time_window] = { wins: row.wins, losses: row.losses };
          if (row.product === "copy") next.copyRendimento[row.time_window] = row.rendimento_pct ?? 0;
        });
        setStats(next);
      }

      if (configRow) {
        setConfig({
          cotacao: configRow.cotacao,
          payoutCopy: configRow.payout_copy,
          payoutPepeLive: configRow.payout_pepe_live,
          bancaCopy: configRow.banca_copy,
          entradaPepe: configRow.entrada_pepe,
          entradaLive: configRow.entrada_live,
        });
      }

      if (selection?.dynamic_id) {
        setSelectedDynamicId(selection.dynamic_id);
        setFonteOverrides((selection.fonte_overrides as Record<string, TradingWindow>) ?? {});
      }

      setLoading(false);
    }
    load();
  }, [dateKey]);

  useEffect(() => {
    if (!selectedDynamicId) {
      setSlots([]);
      return;
    }
    async function loadSlots() {
      const supabase = createClient();
      const { data } = await supabase
        .from("message_dynamic_slots")
        .select("*")
        .eq("dynamic_id", selectedDynamicId)
        .order("position");
      setSlots(data ?? []);

      const dynamic = dynamics.find((d) => d.id === selectedDynamicId);
      const banks = dynamic?.rotating_banks ?? {};
      const dep = sortearDepoimento(banks.BANCO_NOMES ?? [], banks.BANCO_VALORES ?? [], banks.BANCO_SITUACOES ?? []);
      setDepoimento(dep);
    }
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDynamicId]);

  const selectedDynamic = dynamics.find((d) => d.id === selectedDynamicId) ?? null;

  const melhorPepe: MelhorCenario | null = useMemo(() => calcularMelhorCenario(stats.pepe), [stats.pepe]);
  const melhorLive: MelhorCenario | null = useMemo(() => calcularMelhorCenario(stats.live), [stats.live]);
  const melhorCopy: MelhorCenario | null = useMemo(
    () => calcularMelhorCenarioCopy(stats.copy, stats.copyRendimento),
    [stats.copy, stats.copyRendimento]
  );

  async function persistSelection(dynamicId: string, overrides: Record<string, TradingWindow>) {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("daily_dynamic_selection").upsert(
      {
        scheduled_date: dateKey,
        dynamic_id: dynamicId,
        fonte_overrides: overrides,
        created_by: currentUserId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "scheduled_date" }
    );
    setSaving(false);
  }

  function handleSelectDynamic(id: string) {
    setSelectedDynamicId(id);
    setFonteOverrides({});
    if (id) persistSelection(id, {});
  }

  function handleFonteChange(msgKey: string, fonte: TradingWindow) {
    const next = { ...fonteOverrides, [msgKey]: fonte };
    setFonteOverrides(next);
    persistSelection(selectedDynamicId, next);
  }

  async function handleCopy(text: string, msgKey: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(msgKey);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-text-muted">Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={selectedDynamicId} onChange={(e) => handleSelectDynamic(e.target.value)} className="flex-1">
          <option value="">Selecione a dinâmica do dia...</option>
          {dynamics.map((d) => (
            <option key={d.id} value={d.id}>
              {d.icon} {d.name}
            </option>
          ))}
        </Select>
        {saving && <span className="text-xs text-text-muted">salvando...</span>}
      </div>

      {selectedDynamic && (
        <>
          <div className="flex flex-wrap gap-2">
            {melhorPepe && <MelhorBadge label="Pepe" cenario={melhorPepe} />}
            {melhorLive && <MelhorBadge label="Live" cenario={melhorLive} />}
            {melhorCopy && <MelhorBadge label="Copy" cenario={melhorCopy} />}
          </div>

          {selectedDynamic.rules.length > 0 && (
            <div className="rounded-xl border-l-4 border-accent bg-card-hover p-3">
              <p className="mb-1.5 text-xs font-semibold uppercase text-text-secondary">Regras universais</p>
              <ul className="space-y-0.5">
                {selectedDynamic.rules.map((rule, i) => (
                  <li key={i} className="text-xs text-text-secondary">
                    ✓ {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {slots.map((slot) => {
              const fonte = fonteOverrides[slot.msg_key] ?? (slot.fonte_default as TradingWindow) ?? melhorPepe?.fonte ?? "semana";
              const { text, computedValues } = renderSlot({
                template: slot.template,
                position: slot.position,
                totalSlots: slots.length,
                fonte,
                rotatingBanks: selectedDynamic.rotating_banks,
                extraVars: selectedDynamic.extra_vars,
                vagasConfig: selectedDynamic.vagas_config,
                stats,
                config,
                depoimento,
              });
              const blocked = isResultBlocked(text, computedValues);
              const { chars, level } = charCountLevel(text);

              return (
                <div
                  key={slot.id}
                  className={`rounded-xl border p-3 ${
                    blocked ? "border-danger bg-danger/10" : "border-border"
                  }`}
                >
                  {blocked && (
                    <p className="mb-2 rounded-lg bg-danger px-2 py-1.5 text-center text-[11px] font-bold text-white">
                      ⚠️ RESULTADO NEGATIVO — NÃO ENVIAR ESTA MENSAGEM
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-button bg-card-hover px-2 py-0.5 text-[11px] text-text-muted">
                        {slot.time_label}
                      </span>
                      <span className="text-xs text-text-secondary">{slot.role_label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.has_fonte_selector && (
                        <Select
                          value={fonte}
                          onChange={(e) => handleFonteChange(slot.msg_key, e.target.value as TradingWindow)}
                          className="h-7 w-28 text-[11px]"
                        >
                          {WINDOWS.map((w) => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                        </Select>
                      )}
                      <span
                        className={`rounded-button px-2 py-0.5 text-[10px] ${
                          level === "veryhigh"
                            ? "bg-danger/20 text-danger"
                            : level === "high"
                              ? "bg-warning/20 text-warning"
                              : "bg-card-hover text-text-muted"
                        }`}
                      >
                        {chars} chars
                      </span>
                    </div>
                  </div>

                  <p
                    className={`mt-2 whitespace-pre-wrap rounded-lg bg-card-hover p-3 text-xs text-text-primary ${
                      blocked ? "opacity-50 grayscale" : ""
                    }`}
                  >
                    {text}
                  </p>

                  {slot.media_suggestion && (
                    <p className="mt-2 rounded-lg border-l-2 border-accent-pink bg-accent-pink/10 px-2 py-1.5 text-[11px] text-text-secondary">
                      🎬 {slot.media_suggestion}
                    </p>
                  )}
                  {slot.expert_hint && (
                    <p className="mt-1.5 rounded-lg border-l-2 border-accent bg-accent/10 px-2 py-1.5 text-[11px] text-text-secondary">
                      🎙️ {slot.expert_hint}
                    </p>
                  )}

                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant={blocked ? "secondary" : "primary"}
                      size="sm"
                      disabled={blocked}
                      onClick={() => handleCopy(text, slot.msg_key)}
                    >
                      <Copy size={12} />
                      {blocked ? "Bloqueado" : copiedKey === slot.msg_key ? "Copiado!" : "Copiar"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function MelhorBadge({ label, cenario }: { label: string; cenario: MelhorCenario }) {
  return (
    <Badge tone="success" className="flex items-center gap-1">
      <Trophy size={11} />
      {label}: {cenario.fonte} ({cenario.acerto}%)
    </Badge>
  );
}
