"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { MessageRow } from "./message-row";
import type { Database, TradingWindow } from "@/lib/supabase/types";

type MessageDynamic = Database["public"]["Tables"]["message_dynamics"]["Row"];
type MessageDynamicSlot = Database["public"]["Tables"]["message_dynamic_slots"]["Row"];

interface DynamicDayTableProps {
  dateKey: string;
  currentUserId: string;
}

function emptyStatsByWindow(): Record<TradingWindow, { wins: number; losses: number }> {
  return {
    dia: { wins: 0, losses: 0 },
    semana: { wins: 0, losses: 0 },
    mes: { wins: 0, losses: 0 },
    total: { wins: 0, losses: 0 },
  };
}

export function DynamicDayTable({ dateKey, currentUserId }: DynamicDayTableProps) {
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
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>({});
  const [depoimento, setDepoimento] = useState<Depoimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
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

      setSelectedDynamicId(selection?.dynamic_id ?? "");
      setFonteOverrides((selection?.fonte_overrides as Record<string, TradingWindow>) ?? {});
      setTextOverrides((selection?.text_overrides as Record<string, string>) ?? {});
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

  async function persistSelection(patch: {
    dynamicId?: string;
    fonteOverrides?: Record<string, TradingWindow>;
    textOverrides?: Record<string, string>;
  }) {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("daily_dynamic_selection").upsert(
      {
        scheduled_date: dateKey,
        dynamic_id: patch.dynamicId ?? selectedDynamicId,
        fonte_overrides: patch.fonteOverrides ?? fonteOverrides,
        text_overrides: patch.textOverrides ?? textOverrides,
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
    setTextOverrides({});
    if (id) persistSelection({ dynamicId: id, fonteOverrides: {}, textOverrides: {} });
  }

  function handleFonteChange(msgKey: string, fonte: TradingWindow) {
    const next = { ...fonteOverrides, [msgKey]: fonte };
    setFonteOverrides(next);
    persistSelection({ fonteOverrides: next });
  }

  function handleUseVariant(msgKey: string, text: string) {
    const next = { ...textOverrides, [msgKey]: text };
    setTextOverrides(next);
    persistSelection({ textOverrides: next });
  }

  function handleRestoreOriginal(msgKey: string) {
    const next = { ...textOverrides };
    delete next[msgKey];
    setTextOverrides(next);
    persistSelection({ textOverrides: next });
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-text-muted">Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={selectedDynamicId} onChange={(e) => handleSelectDynamic(e.target.value)} className="flex-1 max-w-sm">
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
          <div className="flex flex-wrap items-center gap-2">
            {melhorPepe && <MelhorBadge label="Pepe" cenario={melhorPepe} />}
            {melhorLive && <MelhorBadge label="Live" cenario={melhorLive} />}
            {melhorCopy && <MelhorBadge label="Copy" cenario={melhorCopy} />}
            {selectedDynamic.rules.length > 0 && (
              <button
                type="button"
                onClick={() => setRulesOpen((v) => !v)}
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

          <div className="space-y-1.5">
            {slots.map((slot) => {
              const fonte =
                fonteOverrides[slot.msg_key] ?? (slot.fonte_default as TradingWindow) ?? melhorPepe?.fonte ?? "semana";
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
              const override = textOverrides[slot.msg_key];
              const blocked = !override && isResultBlocked(text, computedValues);
              const { chars, level } = charCountLevel(override ?? text);

              return (
                <MessageRow
                  key={slot.id}
                  slot={slot}
                  computedText={text}
                  overrideText={override}
                  blocked={blocked}
                  chars={chars}
                  charLevel={level}
                  fonte={fonte}
                  onFonteChange={(f) => handleFonteChange(slot.msg_key, f)}
                  onUseVariant={(variantText) => handleUseVariant(slot.msg_key, variantText)}
                  onRestoreOriginal={() => handleRestoreOriginal(slot.msg_key)}
                />
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
