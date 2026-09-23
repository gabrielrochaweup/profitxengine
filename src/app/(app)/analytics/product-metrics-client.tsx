"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { fromDateKey, toDateKey } from "../calendario/lib/date-utils";
import { SimpleBarChart, PIE_PALETTE } from "./components/charts";
import type { Database } from "@/lib/supabase/types";

type MetricField = Database["public"]["Tables"]["product_metric_fields"]["Row"];
type MetricEntry = Database["public"]["Tables"]["product_daily_metrics"]["Row"];

interface ProductMetricsClientProps {
  initialFields: MetricField[];
  initialEntries: MetricEntry[];
  productId: string | null;
  currentUserId: string;
}

type Period = "hoje" | "ontem" | "7d" | "30d" | "90d" | "mes" | "tudo";

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "ontem", label: "Ontem" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "mes", label: "Este mês" },
  { key: "tudo", label: "Tudo" },
];

function fmtValue(value: number, unit: string): string {
  if (unit === "moeda") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
  }
  return value.toLocaleString("pt-BR");
}

export function ProductMetricsClient({
  initialFields,
  initialEntries,
  productId,
  currentUserId,
}: ProductMetricsClientProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [fields, setFields] = useState<MetricField[]>(initialFields);
  const [entries, setEntries] = useState<MetricEntry[]>(initialEntries);
  const [period, setPeriod] = useState<Period>("30d");
  const [managingFields, setManagingFields] = useState(false);
  const [addingField, setAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldUnit, setNewFieldUnit] = useState<"numero" | "moeda">("numero");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const entriesByDate = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    entries.forEach((e) => {
      (map[e.metric_date] ??= {})[e.field_id] = e.value;
    });
    return map;
  }, [entries]);

  function openDate(date: string) {
    setSelectedDate(date);
    const existing = entriesByDate[date] ?? {};
    const next: Record<string, string> = {};
    fields.forEach((f) => {
      next[f.id] = existing[f.id] != null ? String(existing[f.id]) : "";
    });
    setFormValues(next);
  }

  const currentValues = useMemo(() => {
    const existing = entriesByDate[selectedDate] ?? {};
    const merged: Record<string, string> = {};
    fields.forEach((f) => {
      merged[f.id] = formValues[f.id] ?? (existing[f.id] != null ? String(existing[f.id]) : "");
    });
    return merged;
  }, [entriesByDate, selectedDate, fields, formValues]);

  async function handleSaveEntry() {
    if (!productId) return;
    setSaving(true);
    const supabase = createClient();
    const rows = fields.map((f) => ({
      product_id: productId,
      field_id: f.id,
      metric_date: selectedDate,
      value: Number(currentValues[f.id]) || 0,
      updated_by: currentUserId,
    }));
    const { data, error } = await supabase
      .from("product_daily_metrics")
      .upsert(rows, { onConflict: "field_id,metric_date" })
      .select();
    if (error || !data) {
      toast.error("Erro ao salvar o resultado do dia. Tente novamente.");
      setSaving(false);
      return;
    }
    setEntries((prev) => {
      const otherDates = prev.filter((e) => e.metric_date !== selectedDate);
      return [...otherDates, ...data];
    });
    setFormValues({});
    toast.success("Resultado do dia salvo.");
    setSaving(false);
  }

  async function handleAddField() {
    const label = newFieldLabel.trim();
    if (!label || !productId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("product_metric_fields")
      .insert({ product_id: productId, label, unit: newFieldUnit, position: fields.length, created_by: currentUserId })
      .select()
      .single();
    if (error || !data) {
      toast.error("Erro ao criar o campo. Tente novamente.");
      return;
    }
    setFields((prev) => [...prev, data]);
    setNewFieldLabel("");
    setNewFieldUnit("numero");
    setAddingField(false);
  }

  function startRename(field: MetricField) {
    setRenamingId(field.id);
    setRenameValue(field.label);
  }

  async function commitRename(field: MetricField) {
    const label = renameValue.trim();
    setRenamingId(null);
    if (!label || label === field.label) return;
    setFields((prev) => prev.map((f) => (f.id === field.id ? { ...f, label } : f)));
    const supabase = createClient();
    const { error } = await supabase.from("product_metric_fields").update({ label }).eq("id", field.id);
    if (error) {
      setFields((prev) => prev.map((f) => (f.id === field.id ? { ...f, label: field.label } : f)));
      toast.error("Erro ao renomear o campo. Tente novamente.");
    }
  }

  async function moveField(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    const withPositions = next.map((f, i) => ({ ...f, position: i }));
    setFields(withPositions);
    const supabase = createClient();
    const results = await Promise.all(
      withPositions.map((f) => supabase.from("product_metric_fields").update({ position: f.position }).eq("id", f.id))
    );
    if (results.some((r) => r.error)) toast.error("Erro ao reordenar os campos. Tente novamente.");
  }

  async function handleDeleteField(field: MetricField) {
    const ok = await confirm({
      title: `Excluir campo "${field.label}"`,
      description: "Apaga o campo e todos os valores já preenchidos com ele em qualquer dia. Ação irreversível.",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("product_metric_fields").delete().eq("id", field.id);
    if (error) {
      toast.error("Erro ao excluir o campo. Tente novamente.");
      return;
    }
    setFields((prev) => prev.filter((f) => f.id !== field.id));
    setEntries((prev) => prev.filter((e) => e.field_id !== field.id));
  }

  const filteredEntryDates = useMemo(() => {
    const dates = Object.keys(entriesByDate).sort((a, b) => (a < b ? 1 : -1));
    if (period === "tudo") return dates;
    const now = new Date();
    if (period === "hoje") return dates.filter((d) => d === toDateKey(now));
    if (period === "ontem") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return dates.filter((d) => d === toDateKey(y));
    }
    if (period === "mes") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return dates.filter((d) => fromDateKey(d) >= monthStart);
    }
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    return dates.filter((d) => fromDateKey(d) >= cutoff);
  }, [entriesByDate, period]);

  const kpis = useMemo(() => {
    return fields.map((f) => {
      const total = filteredEntryDates.reduce((acc, date) => acc + (entriesByDate[date]?.[f.id] ?? 0), 0);
      return { field: f, total };
    });
  }, [fields, filteredEntryDates, entriesByDate]);

  const chartSeriesByField = useMemo(() => {
    const sortedDates = [...filteredEntryDates].sort((a, b) => (a < b ? -1 : 1));
    return fields.map((f) => ({
      field: f,
      data: sortedDates.map((date) => ({
        label: date.slice(5).split("-").reverse().join("/"),
        value: entriesByDate[date]?.[f.id] ?? 0,
      })),
    }));
  }, [fields, filteredEntryDates, entriesByDate]);

  if (!productId) {
    return <p className="mt-4 text-sm text-text-muted">Nenhum produto ativo.</p>;
  }

  return (
    <div className="mt-4 space-y-4">
      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-text-primary">Preencher resultado do dia</h3>
          <button
            type="button"
            onClick={() => setManagingFields((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-accent-text hover:underline"
          >
            <Settings2 size={13} />
            {managingFields ? "Fechar gerenciar campos" : "Gerenciar campos"}
          </button>
        </div>

        {managingFields && (
          <div className="mb-4 space-y-1.5 rounded-lg bg-card-hover/50 p-2.5 shadow-card-sm">
            {fields.length === 0 && <p className="text-xs text-text-muted">Nenhum campo criado ainda.</p>}
            {fields.map((f, index) => (
              <div key={f.id} className="flex items-center gap-1.5 rounded-lg px-1 py-1">
                {renamingId === f.id ? (
                  <>
                    <Input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(f);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="h-7 flex-1 text-xs"
                    />
                    <IconButton onClick={() => commitRename(f)} label="Confirmar">
                      <Check size={13} />
                    </IconButton>
                    <IconButton onClick={() => setRenamingId(null)} label="Cancelar">
                      <X size={13} />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate text-xs text-text-primary">
                      {f.label} <span className="text-text-muted">({f.unit === "moeda" ? "R$" : "número"})</span>
                    </span>
                    <IconButton onClick={() => moveField(index, -1)} label="Mover pra cima">
                      <ChevronLeft size={13} />
                    </IconButton>
                    <IconButton onClick={() => moveField(index, 1)} label="Mover pra baixo">
                      <ChevronRight size={13} />
                    </IconButton>
                    <IconButton onClick={() => startRename(f)} label="Renomear">
                      <Pencil size={13} />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteField(f)} label="Excluir" danger>
                      <Trash2 size={13} />
                    </IconButton>
                  </>
                )}
              </div>
            ))}

            {addingField ? (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <Input
                  autoFocus
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="Nome do campo (ex: Unidades vendidas)"
                  className="h-8 flex-1 text-xs"
                />
                <Select
                  value={newFieldUnit}
                  onChange={(e) => setNewFieldUnit(e.target.value as "numero" | "moeda")}
                  className="h-8 w-28 text-xs"
                >
                  <option value="numero">Número</option>
                  <option value="moeda">R$ (moeda)</option>
                </Select>
                <Button type="button" size="sm" onClick={handleAddField}>
                  Criar
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setAddingField(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingField(true)}
                className="mt-1 flex items-center gap-1.5 text-xs text-accent-text hover:underline"
              >
                <Plus size={13} />
                Novo campo
              </button>
            )}
          </div>
        )}

        {fields.length === 0 ? (
          <p className="text-xs text-text-muted">
            Nenhum campo configurado ainda — clique em &quot;Gerenciar campos&quot; pra criar o primeiro.
          </p>
        ) : (
          <>
            <div className="mb-3 space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Data</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => openDate(e.target.value)}
                className="h-9 w-44"
              />
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map((f) => (
                <div key={f.id} className="space-y-1">
                  <label className="text-xs text-text-secondary">
                    {f.label} {f.unit === "moeda" && <span className="text-text-muted">(R$)</span>}
                  </label>
                  <Input
                    type="number"
                    step={f.unit === "moeda" ? "0.01" : "1"}
                    value={currentValues[f.id] ?? ""}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                    placeholder="0"
                    className="h-9"
                  />
                </div>
              ))}
            </div>

            <Button type="button" size="sm" className="mt-3" disabled={saving} onClick={handleSaveEntry}>
              {saving ? "Salvando..." : "Salvar resultado do dia"}
            </Button>
          </>
        )}
      </Card>

      {fields.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setPeriod(opt.key)}
                className={`rounded-button px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === opt.key
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:bg-card-hover"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {kpis.map(({ field, total }) => (
              <div key={field.id} className="rounded-xl bg-card-hover p-3">
                <p className="text-[11px] text-text-muted">{field.label}</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{fmtValue(total, field.unit)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {chartSeriesByField.map(({ field, data }, i) => (
              <Card key={field.id} className="p-5">
                <h3 className="mb-3 text-base font-semibold text-text-primary">{field.label} por dia</h3>
                <SimpleBarChart
                  data={data}
                  valueLabel={field.label}
                  isCurrency={field.unit === "moeda"}
                  color={PIE_PALETTE[i % PIE_PALETTE.length]}
                />
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <h3 className="mb-3 text-base font-semibold text-text-primary">
              Dias preenchidos no período ({filteredEntryDates.length})
            </h3>
            {filteredEntryDates.length === 0 ? (
              <p className="text-xs text-text-muted">Nenhum dia preenchido nesse período ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-text-muted">
                      <th className="py-2 pr-3 font-medium">Data</th>
                      {fields.map((f) => (
                        <th key={f.id} className="py-2 pr-3 font-medium">
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntryDates.map((date) => (
                      <tr
                        key={date}
                        onClick={() => openDate(date)}
                        className="cursor-pointer border-b border-border/50 text-text-secondary hover:bg-card-hover"
                      >
                        <td className="py-2 pr-3 whitespace-nowrap">{date.split("-").reverse().join("/")}</td>
                        {fields.map((f) => (
                          <td key={f.id} className="py-2 pr-3 whitespace-nowrap">
                            {fmtValue(entriesByDate[date]?.[f.id] ?? 0, f.unit)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function IconButton({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg hover:bg-card-hover ${
        danger ? "text-text-muted hover:text-danger" : "text-text-muted hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
