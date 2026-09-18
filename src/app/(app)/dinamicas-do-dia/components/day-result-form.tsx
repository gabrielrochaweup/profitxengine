"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import type { Database } from "@/lib/supabase/types";

type DailyDynamicSelection = Database["public"]["Tables"]["daily_dynamic_selection"]["Row"];

interface DayResultFormProps {
  dateKey: string;
  currentUserId: string;
  /** Preencher/concluir é restrito a editor+/admin — mesma regra da
   * Performance de Trading. Ver (Analytics e este card) é liberado pra
   * todo mundo, já que os números são globais, não por usuário. */
  canEdit: boolean;
}

const EMPTY_FORM = {
  pepePessoas: "",
  pepeValor: "",
  livePessoas: "",
  liveValor: "",
  copyPessoas: "",
  copyValor: "",
  depositosValor: "",
  depositosQtd: "",
  faturamentoBruto: "",
  faturamentoLiquido: "",
  observacoes: "",
};

type FormState = typeof EMPTY_FORM;

function numToStr(n: number | null): string {
  return n === null || n === undefined ? "" : String(n);
}

function strToNum(s: string): number | null {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

export function DayResultForm({ dateKey, currentUserId, canEdit }: DayResultFormProps) {
  const toast = useToast();
  const [row, setRow] = useState<DailyDynamicSelection | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("daily_dynamic_selection")
        .select("*")
        .eq("scheduled_date", dateKey)
        .maybeSingle();
      if (cancelled) return;
      setRow(data);
      setForm({
        pepePessoas: numToStr(data?.pepe_pessoas ?? null),
        pepeValor: numToStr(data?.pepe_valor ?? null),
        livePessoas: numToStr(data?.live_pessoas ?? null),
        liveValor: numToStr(data?.live_valor ?? null),
        copyPessoas: numToStr(data?.copy_pessoas ?? null),
        copyValor: numToStr(data?.copy_valor ?? null),
        depositosValor: numToStr(data?.depositos_valor ?? null),
        depositosQtd: numToStr(data?.depositos_qtd ?? null),
        faturamentoBruto: numToStr(data?.faturamento_bruto ?? null),
        faturamentoLiquido: numToStr(data?.faturamento_liquido ?? null),
        observacoes: data?.observacoes ?? "",
      });
      setOpen(!!data?.concluded === false && !!data);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  function update(patch: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function persist(concluded: boolean) {
    setSaving(true);
    const supabase = createClient();
    // Não reenvia dynamic_id/fonte_overrides/text_overrides: se a linha já
    // existe, deixa esses campos como estão (evita sobrescrever com uma
    // foto antiga se o usuário mudar a dinâmica em outro componente da
    // mesma página entre o fetch inicial e este save); se a linha ainda
    // não existe, essas colunas têm default no banco (null/'{}'::jsonb).
    const payload = {
      scheduled_date: dateKey,
      created_by: row?.created_by ?? currentUserId,
      updated_at: new Date().toISOString(),
      pepe_pessoas: strToNum(form.pepePessoas),
      pepe_valor: strToNum(form.pepeValor),
      live_pessoas: strToNum(form.livePessoas),
      live_valor: strToNum(form.liveValor),
      copy_pessoas: strToNum(form.copyPessoas),
      copy_valor: strToNum(form.copyValor),
      depositos_valor: strToNum(form.depositosValor),
      depositos_qtd: strToNum(form.depositosQtd),
      faturamento_bruto: strToNum(form.faturamentoBruto),
      faturamento_liquido: strToNum(form.faturamentoLiquido),
      observacoes: form.observacoes || null,
      concluded,
      concluded_at: concluded ? new Date().toISOString() : row?.concluded_at ?? null,
      concluded_by: concluded ? currentUserId : row?.concluded_by ?? null,
    };
    const { data, error } = await supabase
      .from("daily_dynamic_selection")
      .upsert(payload, { onConflict: "scheduled_date" })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar o resultado do dia. Tente novamente.");
      return;
    }
    setRow(data);
    toast.success(concluded ? "Dia marcado como concluído." : "Resultado do dia salvo.");
  }

  if (loading) return null;

  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-text-primary">
            Resultado do dia <span className="text-text-muted">— {dateKey.split("-").reverse().join("/")}</span>
          </h3>
          {row?.concluded && (
            <Badge tone="success" className="flex items-center gap-1">
              <CheckCircle2 size={11} />
              Concluído
            </Badge>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FieldGroup label="🐸 Pepe">
              <NumberField label="Pessoas" value={form.pepePessoas} onChange={(v) => update({ pepePessoas: v })} disabled={!canEdit} />
              <NumberField label="Valor (R$)" value={form.pepeValor} onChange={(v) => update({ pepeValor: v })} disabled={!canEdit} />
            </FieldGroup>
            <FieldGroup label="📺 Live">
              <NumberField label="Pessoas" value={form.livePessoas} onChange={(v) => update({ livePessoas: v })} disabled={!canEdit} />
              <NumberField label="Valor (R$)" value={form.liveValor} onChange={(v) => update({ liveValor: v })} disabled={!canEdit} />
            </FieldGroup>
            <FieldGroup label="💰 Copy">
              <NumberField label="Pessoas" value={form.copyPessoas} onChange={(v) => update({ copyPessoas: v })} disabled={!canEdit} />
              <NumberField label="Valor (R$)" value={form.copyValor} onChange={(v) => update({ copyValor: v })} disabled={!canEdit} />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <NumberField
              label="Valor dos depósitos (R$)"
              value={form.depositosValor}
              onChange={(v) => update({ depositosValor: v })}
              disabled={!canEdit}
            />
            <NumberField
              label="Qtd. depósitos/pessoas"
              value={form.depositosQtd}
              onChange={(v) => update({ depositosQtd: v })}
              disabled={!canEdit}
            />
            <NumberField
              label="Faturamento bruto (R$)"
              value={form.faturamentoBruto}
              onChange={(v) => update({ faturamentoBruto: v })}
              disabled={!canEdit}
            />
            <NumberField
              label="Faturamento líquido (R$)"
              value={form.faturamentoLiquido}
              onChange={(v) => update({ faturamentoLiquido: v })}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-text-secondary">Observações</label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => update({ observacoes: e.target.value })}
              rows={2}
              placeholder="Algo que valha registrar sobre o dia..."
              className="text-xs"
              disabled={!canEdit}
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
            {row?.concluded_at && (
              <span className="mr-auto text-[11px] text-text-muted">
                Concluído em {new Date(row.concluded_at).toLocaleString("pt-BR")}
              </span>
            )}
            {canEdit && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={saving}
                  onClick={() => persist(row?.concluded ?? false)}
                >
                  {saving ? "Salvando..." : "Salvar resultado"}
                </Button>
                <Button type="button" size="sm" disabled={saving} onClick={() => persist(true)}>
                  <CheckCircle2 size={14} />
                  Marcar como concluído
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="mb-2 text-xs font-medium text-text-secondary">{label}</p>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-text-secondary">{label}</label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-8 text-xs"
      />
    </div>
  );
}
