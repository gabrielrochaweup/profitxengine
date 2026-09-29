"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import {
  calcularMelhorCenario,
  calcularMelhorCenarioCopy,
  calcularMelhorCenarioTriad,
  sortearDepoimento,
  type Depoimento,
  type MelhorCenario,
} from "@/lib/dynamics/calc-engine";
import {
  acertosConsolidadosPorJanela,
  rendimentosCopyEfetivos,
  type ProductStatsByWindow,
} from "@/lib/dynamics/render-message";
import { DynamicMessagesBoard } from "./dynamic-messages-board";
import { ResultadosSync } from "./resultados-sync";
import type { Database, TradingWindow } from "@/lib/supabase/types";

type MessageDynamic = Database["public"]["Tables"]["message_dynamics"]["Row"];
type MessageDynamicSlot = Database["public"]["Tables"]["message_dynamic_slots"]["Row"];

interface DynamicDayTableProps {
  dateKey: string;
  currentUserId: string;
}

function emptyStatsByWindow(): Record<TradingWindow, number> {
  return { dia: 0, semana: 0, mes: 0, total: 0 };
}

type StatsRow = Database["public"]["Tables"]["trading_performance_stats"]["Row"];

// Fora do componente pra servir tanto ao carregamento inicial quanto ao
// botão "Atualizar resultados", que recarrega só os números (sem piscar a
// tela inteira nem perder a dinâmica escolhida).
function montarStats(statsRows: StatsRow[]): ProductStatsByWindow {
  const next: ProductStatsByWindow = {
    pepe: emptyStatsByWindow(),
    live: emptyStatsByWindow(),
    copy: emptyStatsByWindow(),
    copyRendimento: { dia: 0, semana: 0, mes: 0, total: 0 },
    pepeWins: emptyStatsByWindow(),
    pepeLosses: emptyStatsByWindow(),
    liveWins: emptyStatsByWindow(),
    liveLosses: emptyStatsByWindow(),
    copyWins: emptyStatsByWindow(),
    copyLosses: emptyStatsByWindow(),
  };
  statsRows.forEach((row) => {
    next[row.product][row.time_window] = row.acerto_pct;
    if (row.product === "copy") next.copyRendimento[row.time_window] = row.rendimento_pct ?? 0;
    next[`${row.product}Wins`][row.time_window] = row.wins ?? 0;
    next[`${row.product}Losses`][row.time_window] = row.losses ?? 0;
  });
  return next;
}

export function DynamicDayTable({ dateKey, currentUserId }: DynamicDayTableProps) {
  const [dynamics, setDynamics] = useState<MessageDynamic[]>([]);
  const [selectedDynamicId, setSelectedDynamicId] = useState<string>("");
  const [changingDynamic, setChangingDynamic] = useState(false);
  const [pendingDynamicId, setPendingDynamicId] = useState<string>("");
  const [slots, setSlots] = useState<MessageDynamicSlot[]>([]);
  const [stats, setStats] = useState<ProductStatsByWindow>({
    pepe: emptyStatsByWindow(),
    live: emptyStatsByWindow(),
    copy: emptyStatsByWindow(),
    copyRendimento: { dia: 0, semana: 0, mes: 0, total: 0 },
    pepeWins: emptyStatsByWindow(),
    pepeLosses: emptyStatsByWindow(),
    liveWins: emptyStatsByWindow(),
    liveLosses: emptyStatsByWindow(),
    copyWins: emptyStatsByWindow(),
    copyLosses: emptyStatsByWindow(),
  });
  const [config, setConfig] = useState({
    cotacao: 5.5,
    payoutCopy: 72,
    payoutPepeLive: 72,
    bancaCopy: 5000,
    entradaPepe: 10,
    entradaLive: 50,
    entradaCopyPct: 1,
  });
  const [numeroAlavancagem, setNumeroAlavancagem] = useState<string | null>(null);
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

      if (statsRows) setStats(montarStats(statsRows));

      if (configRow) {
        setConfig({
          cotacao: configRow.cotacao,
          payoutCopy: configRow.payout_copy,
          payoutPepeLive: configRow.payout_pepe_live,
          bancaCopy: configRow.banca_copy,
          entradaPepe: configRow.entrada_pepe,
          entradaLive: configRow.entrada_live,
          entradaCopyPct: configRow.entrada_copy_pct ?? 1,
        });
        setNumeroAlavancagem(configRow.numero_alavancagem_override);
      }

      const dynamicId = selection?.dynamic_id ?? "";
      setSelectedDynamicId(dynamicId);
      setPendingDynamicId(dynamicId);
      setChangingDynamic(false);
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
  // Rendimento do Copy já ligado ao placar e % consolidado somando os três
  // placares — os MESMOS que o renderSlot usa nas mensagens.
  const rendimentoCopy = useMemo(() => rendimentosCopyEfetivos(stats, config), [stats, config]);
  const melhorCopy: MelhorCenario | null = useMemo(
    () => calcularMelhorCenarioCopy(stats.copy, rendimentoCopy),
    [stats.copy, rendimentoCopy]
  );
  const melhorTriad: MelhorCenario | null = useMemo(
    () =>
      calcularMelhorCenarioTriad(stats.pepe, stats.live, stats.copy, rendimentoCopy, acertosConsolidadosPorJanela(stats)),
    [stats, rendimentoCopy]
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

  function handleConfirmDynamic() {
    if (!pendingDynamicId) return;
    setSelectedDynamicId(pendingDynamicId);
    setFonteOverrides({});
    setTextOverrides({});
    setChangingDynamic(false);
    persistSelection({ dynamicId: pendingDynamicId, fonteOverrides: {}, textOverrides: {} });
  }

  function handleStartChange() {
    setPendingDynamicId(selectedDynamicId);
    setChangingDynamic(true);
  }

  function handleCancelChange() {
    setPendingDynamicId(selectedDynamicId);
    setChangingDynamic(false);
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

  async function recarregarStats() {
    const supabase = createClient();
    const { data } = await supabase.from("trading_performance_stats").select("*");
    if (data) setStats(montarStats(data));
  }

  if (loading) {
    return <LoadingState />;
  }

  const isLocked = !!selectedDynamicId && !changingDynamic;

  return (
    <div className="space-y-4">
      <ResultadosSync onAtualizado={recarregarStats} />

      {isLocked && selectedDynamic ? (
        <div className="flex flex-wrap items-center gap-2 rounded-input border border-success/40 bg-success/10 px-3 py-2">
          <Check size={16} className="shrink-0 text-success" />
          <span className="text-sm text-text-secondary">
            Dinâmica de hoje: <strong className="text-text-primary">{selectedDynamic.icon} {selectedDynamic.name}</strong>
          </span>
          <Button type="button" variant="secondary" size="sm" className="ml-auto" onClick={handleStartChange}>
            <Pencil size={13} />
            Alterar dinâmica
          </Button>
          {saving && <span className="text-xs text-text-muted">salvando...</span>}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Select value={pendingDynamicId} onChange={(e) => setPendingDynamicId(e.target.value)} className="flex-1 max-w-sm">
            <option value="">Selecione a dinâmica do dia...</option>
            {dynamics.map((d) => (
              <option key={d.id} value={d.id}>
                {d.icon} {d.name}
              </option>
            ))}
          </Select>
          <Button type="button" size="sm" disabled={!pendingDynamicId} onClick={handleConfirmDynamic}>
            <Check size={14} />
            Usar esta dinâmica
          </Button>
          {selectedDynamicId && (
            <Button type="button" variant="ghost" size="sm" onClick={handleCancelChange}>
              Cancelar
            </Button>
          )}
        </div>
      )}

      {selectedDynamic && (
        <DynamicMessagesBoard
          selectedDynamic={selectedDynamic}
          slots={slots}
          dateKey={dateKey}
          stats={stats}
          config={config}
          numeroAlavancagem={numeroAlavancagem}
          depoimento={depoimento}
          fonteOverrides={fonteOverrides}
          textOverrides={textOverrides}
          onFonteChange={handleFonteChange}
          onUseVariant={handleUseVariant}
          onRestoreOriginal={handleRestoreOriginal}
          melhorPepe={melhorPepe}
          melhorLive={melhorLive}
          melhorCopy={melhorCopy}
          melhorTriad={melhorTriad}
          rulesOpen={rulesOpen}
          onToggleRules={() => setRulesOpen((v) => !v)}
        />
      )}
    </div>
  );
}
