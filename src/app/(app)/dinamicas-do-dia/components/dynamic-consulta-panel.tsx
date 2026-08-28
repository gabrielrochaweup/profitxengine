"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading-state";
import {
  calcularMelhorCenario,
  calcularMelhorCenarioCopy,
  calcularMelhorCenarioTriad,
  sortearDepoimento,
  type Depoimento,
  type MelhorCenario,
} from "@/lib/dynamics/calc-engine";
import { type ProductStatsByWindow } from "@/lib/dynamics/render-message";
import { DynamicMessagesBoard } from "./dynamic-messages-board";
import type { Database, Top5Config, TradingWindow } from "@/lib/supabase/types";

type MessageDynamic = Database["public"]["Tables"]["message_dynamics"]["Row"];
type MessageDynamicSlot = Database["public"]["Tables"]["message_dynamic_slots"]["Row"];

function emptyStatsByWindow(): Record<TradingWindow, number> {
  return { dia: 0, semana: 0, mes: 0, total: 0 };
}

/**
 * Visualização somente-leitura de qualquer dinâmica salva — pra conferir as
 * mensagens (ex: revisar um texto, ver como ficou o TOP 5) sem precisar
 * trocar a dinâmica de hoje. Nada aqui é persistido: trocar a fonte ou gerar
 * uma variação de texto só existe localmente nesta tela.
 */
export function DynamicConsultaPanel() {
  const [dynamics, setDynamics] = useState<MessageDynamic[]>([]);
  const [selectedDynamicId, setSelectedDynamicId] = useState<string>("");
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
  });
  const [top5, setTop5] = useState<Top5Config>({ enabled: false, values: [0, 0, 0, 0, 0] });
  const [fonteOverrides, setFonteOverrides] = useState<Record<string, TradingWindow>>({});
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>({});
  const [depoimento, setDepoimento] = useState<Depoimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const [{ data: dyns }, { data: statsRows }, { data: configRow }, { data: top5Row }] = await Promise.all([
        supabase.from("message_dynamics").select("*").eq("active", true).order("name"),
        supabase.from("trading_performance_stats").select("*"),
        supabase.from("trading_config").select("*").eq("id", 1).single(),
        supabase.from("top5_stats").select("*").eq("id", 1).single(),
      ]);

      setDynamics(dyns ?? []);

      if (statsRows) {
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
        setStats(next);
      }

      if (top5Row) setTop5({ enabled: top5Row.enabled, values: top5Row.values });

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

      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedDynamicId) {
      setSlots([]);
      setFonteOverrides({});
      setTextOverrides({});
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
      setFonteOverrides({});
      setTextOverrides({});

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
  const melhorTriad: MelhorCenario | null = useMemo(
    () => calcularMelhorCenarioTriad(stats.pepe, stats.live, stats.copy, stats.copyRendimento),
    [stats.pepe, stats.live, stats.copy, stats.copyRendimento]
  );

  function handleFonteChange(msgKey: string, fonte: TradingWindow) {
    setFonteOverrides((prev) => ({ ...prev, [msgKey]: fonte }));
  }

  function handleUseVariant(msgKey: string, text: string) {
    setTextOverrides((prev) => ({ ...prev, [msgKey]: text }));
  }

  function handleRestoreOriginal(msgKey: string) {
    setTextOverrides((prev) => {
      const next = { ...prev };
      delete next[msgKey];
      return next;
    });
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-input border border-dashed border-border-strong bg-card-hover px-3 py-2">
        <Eye size={14} className="shrink-0 text-text-muted" />
        <p className="text-xs text-text-muted">
          Só pra conferência — nada aqui muda a dinâmica agendada para hoje.
        </p>
      </div>

      <Select value={selectedDynamicId} onChange={(e) => setSelectedDynamicId(e.target.value)} className="max-w-sm">
        <option value="">Selecione uma dinâmica pra visualizar...</option>
        {dynamics.map((d) => (
          <option key={d.id} value={d.id}>
            {d.icon} {d.name}
          </option>
        ))}
      </Select>

      {selectedDynamic && (
        <DynamicMessagesBoard
          selectedDynamic={selectedDynamic}
          slots={slots}
          stats={stats}
          config={config}
          top5={top5}
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
