"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { useToast } from "@/components/ui/toast";
import type { Database, TradingProduct, TradingWindow } from "@/lib/supabase/types";

type StatsRow = Database["public"]["Tables"]["trading_performance_stats"]["Row"];
type ConfigRow = Database["public"]["Tables"]["trading_config"]["Row"];

const PRODUCTS: { key: TradingProduct; label: string; icon: string }[] = [
  { key: "pepe", label: "Pepe", icon: "🐸" },
  { key: "live", label: "Live", icon: "📺" },
  { key: "copy", label: "Copy Trader", icon: "💰" },
];
// "Total" não é editável: é calculado automaticamente a partir de
// Dia+Semana+Mês assim que essas três janelas são preenchidas.
const EDITABLE_WINDOWS: { key: Exclude<TradingWindow, "total">; label: string }[] = [
  { key: "dia", label: "Dia" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mês" },
];
const WINDOWS: { key: TradingWindow; label: string }[] = [...EDITABLE_WINDOWS, { key: "total", label: "Total" }];

type WindowStats = { acertoPct: number; wins: number; losses: number; rendimentoPct: number };
type StatsState = Record<TradingProduct, Record<TradingWindow, WindowStats>>;

function emptyStats(): StatsState {
  const empty = { acertoPct: 0, wins: 0, losses: 0, rendimentoPct: 0 };
  const perWindow = () => ({ dia: { ...empty }, semana: { ...empty }, mes: { ...empty }, total: { ...empty } });
  return { pepe: perWindow(), live: perWindow(), copy: perWindow() };
}

// Com placar preenchido (V+D > 0), o % de acerto é sempre derivado dele —
// não precisa mais digitar embaixo. Sem placar (0x0), cai de volta pro
// valor manual antigo, pra não travar quem ainda não usa placar nessa janela.
function computeAcerto(wins: number, losses: number, manualFallback: number): number {
  return wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : manualFallback;
}

function computeTotal(stats: StatsState[TradingProduct]): WindowStats {
  const wins = stats.dia.wins + stats.semana.wins + stats.mes.wins;
  const losses = stats.dia.losses + stats.semana.losses + stats.mes.losses;
  const rendimentoPct = stats.dia.rendimentoPct + stats.semana.rendimentoPct + stats.mes.rendimentoPct;
  return { wins, losses, acertoPct: computeAcerto(wins, losses, 0), rendimentoPct };
}

export function TradingPerformancePanel({ canEdit }: { canEdit: boolean }) {
  const toast = useToast();
  const [stats, setStats] = useState<StatsState>(emptyStats());
  const [config, setConfig] = useState<ConfigRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: statsRows }, { data: configRow }] = await Promise.all([
        supabase.from("trading_performance_stats").select("*"),
        supabase.from("trading_config").select("*").eq("id", 1).single(),
      ]);

      if (statsRows) {
        setStats(() => {
          const next = emptyStats();
          (statsRows as StatsRow[]).forEach((row) => {
            next[row.product][row.time_window] = {
              acertoPct: row.acerto_pct,
              wins: row.wins ?? 0,
              losses: row.losses ?? 0,
              rendimentoPct: row.rendimento_pct ?? 0,
            };
          });
          return next;
        });
      }
      if (configRow) setConfig(configRow);
      setLoading(false);
    }
    load();
  }, []);

  function updateStat(product: TradingProduct, window: TradingWindow, patch: Partial<WindowStats>) {
    setStats((prev) => ({
      ...prev,
      [product]: { ...prev[product], [window]: { ...prev[product][window], ...patch } },
    }));
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const statsPayload = PRODUCTS.flatMap(({ key: product }) =>
      WINDOWS.map(({ key: window }) => {
        const s = window === "total" ? computeTotal(stats[product]) : stats[product][window];
        const acertoPct = window === "total" ? s.acertoPct : computeAcerto(s.wins, s.losses, s.acertoPct);
        return {
          product,
          time_window: window,
          acerto_pct: acertoPct,
          wins: s.wins,
          losses: s.losses,
          rendimento_pct: product === "copy" ? s.rendimentoPct : null,
          updated_by: user?.id ?? null,
        };
      })
    );

    const { error: statsError } = await supabase
      .from("trading_performance_stats")
      .upsert(statsPayload, { onConflict: "product,time_window" });

    let configError = null;
    if (config) {
      const res = await supabase.from("trading_config").update(config).eq("id", 1);
      configError = res.error;
    }

    setSaving(false);
    if (statsError || configError) {
      toast.error("Erro ao salvar a performance. Tente novamente.");
      return;
    }
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2000);
  }

  if (loading) {
    return (
      <Card>
        <LoadingState message="Carregando performance..." />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-medium text-text-primary">Configuração global</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <ConfigField
            label="Cotação R$/USD"
            value={config?.cotacao ?? 5.5}
            disabled={!canEdit}
            onChange={(v) => setConfig((c) => (c ? { ...c, cotacao: v } : c))}
          />
          <ConfigField
            label="Payout Copy (%)"
            value={config?.payout_copy ?? 72}
            disabled={!canEdit}
            onChange={(v) => setConfig((c) => (c ? { ...c, payout_copy: v } : c))}
          />
          <ConfigField
            label="Payout Pepe/Live (%)"
            value={config?.payout_pepe_live ?? 72}
            disabled={!canEdit}
            onChange={(v) => setConfig((c) => (c ? { ...c, payout_pepe_live: v } : c))}
          />
          <ConfigField
            label="Banca Copy ($)"
            value={config?.banca_copy ?? 5000}
            disabled={!canEdit}
            onChange={(v) => setConfig((c) => (c ? { ...c, banca_copy: v } : c))}
          />
          <ConfigField
            label="Entrada Pepe ($)"
            value={config?.entrada_pepe ?? 10}
            disabled={!canEdit}
            onChange={(v) => setConfig((c) => (c ? { ...c, entrada_pepe: v } : c))}
          />
          <ConfigField
            label="Entrada Live ($)"
            value={config?.entrada_live ?? 50}
            disabled={!canEdit}
            onChange={(v) => setConfig((c) => (c ? { ...c, entrada_live: v } : c))}
          />
        </div>
      </Card>

      {PRODUCTS.map(({ key: product, label, icon }) => (
        <Card key={product} className="p-5">
          <h3 className="mb-3 text-sm font-medium text-text-primary">
            {icon} Resultados {label}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WINDOWS.map(({ key: window, label: windowLabel }) => {
              const isTotal = window === "total";
              const s = isTotal ? computeTotal(stats[product]) : stats[product][window];
              const fieldsDisabled = !canEdit || isTotal;
              const acertoFromPlacar = !isTotal && s.wins + s.losses > 0;
              const acertoDisplay = isTotal ? s.acertoPct : computeAcerto(s.wins, s.losses, s.acertoPct);
              return (
                <div key={window} className="rounded-xl border border-border p-3">
                  <p className="mb-2 text-xs font-medium text-text-secondary">
                    {windowLabel}
                    {isTotal && <span className="ml-1 font-normal text-text-muted">(automático)</span>}
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-[11px] text-text-secondary">Placar (V)</label>
                      <Input
                        type="number"
                        step="1"
                        disabled={fieldsDisabled}
                        value={s.wins}
                        onChange={(e) => updateStat(product, window, { wins: Number(e.target.value) || 0 })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[11px] text-text-secondary">Placar (D)</label>
                      <Input
                        type="number"
                        step="1"
                        disabled={fieldsDisabled}
                        value={s.losses}
                        onChange={(e) => updateStat(product, window, { losses: Number(e.target.value) || 0 })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <label className="text-[11px] text-text-secondary">
                      % de acerto
                      {acertoFromPlacar && <span className="ml-1 font-normal text-text-muted">(do placar)</span>}
                    </label>
                    <Input
                      type="number"
                      step="1"
                      disabled={fieldsDisabled || acertoFromPlacar}
                      value={acertoDisplay}
                      onChange={(e) => updateStat(product, window, { acertoPct: Number(e.target.value) || 0 })}
                      className="h-8 text-xs"
                    />
                  </div>
                  {product === "copy" && (
                    <div className="mt-2 space-y-1">
                      <label className="text-[11px] text-text-secondary">Rendimento (%)</label>
                      <Input
                        type="number"
                        step="0.1"
                        disabled={fieldsDisabled}
                        value={s.rendimentoPct}
                        onChange={(e) => updateStat(product, window, { rendimentoPct: Number(e.target.value) || 0 })}
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      {canEdit && (
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : savedAt ? "Salvo!" : "Salvar performance"}
        </Button>
      )}
    </div>
  );
}

function ConfigField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-text-secondary">{label}</label>
      <Input
        type="number"
        step="0.01"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-8 text-xs"
      />
    </div>
  );
}
