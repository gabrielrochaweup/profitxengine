"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Database, VagasConfig } from "@/lib/supabase/types";
import { SlotsEditor } from "./slots-editor";

type MessageDynamic = Database["public"]["Tables"]["message_dynamics"]["Row"];
type MessageDynamicSlot = Database["public"]["Tables"]["message_dynamic_slots"]["Row"];

interface DynamicEditorClientProps {
  initialDynamic: MessageDynamic;
  initialSlots: MessageDynamicSlot[];
  canEdit: boolean;
}

export function DynamicEditorClient({ initialDynamic, initialSlots, canEdit }: DynamicEditorClientProps) {
  const router = useRouter();
  const [dynamic, setDynamic] = useState(initialDynamic);
  const [rulesText, setRulesText] = useState((initialDynamic.rules ?? []).join("\n"));
  const [banks, setBanks] = useState<{ name: string; items: string }[]>(
    Object.entries(initialDynamic.rotating_banks ?? {}).map(([name, items]) => ({
      name,
      items: (items as string[]).join("\n"),
    }))
  );
  const [extraVars, setExtraVars] = useState<{ key: string; value: string }[]>(
    Object.entries(initialDynamic.extra_vars ?? {}).map(([key, value]) => ({ key, value: value as string }))
  );
  const [slots, setSlots] = useState(initialSlots);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);

  const vagas: VagasConfig = dynamic.vagas_config ?? { mode: "none" };

  function updateVagas(patch: Partial<VagasConfig>) {
    setDynamic((d) => ({ ...d, vagas_config: { ...vagas, ...patch } }));
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const rotating_banks = Object.fromEntries(
      banks
        .filter((b) => b.name.trim())
        .map((b) => [b.name.trim(), b.items.split("\n").map((s) => s.trim()).filter(Boolean)])
    );
    const extra_vars = Object.fromEntries(
      extraVars.filter((v) => v.key.trim()).map((v) => [v.key.trim(), v.value])
    );
    const rules = rulesText.split("\n").map((s) => s.trim()).filter(Boolean);

    await supabase
      .from("message_dynamics")
      .update({
        name: dynamic.name,
        icon: dynamic.icon,
        subtitle: dynamic.subtitle,
        active: dynamic.active,
        vagas_config: dynamic.vagas_config,
        rotating_banks,
        extra_vars,
        rules,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dynamic.id);

    setSaving(false);
    setSavedAt(true);
    setTimeout(() => setSavedAt(false), 2000);
  }

  async function handleDelete() {
    if (!confirm(`Excluir a dinâmica "${dynamic.name}" e todas as suas ${slots.length} mensagens?`)) return;
    const supabase = createClient();
    await supabase.from("message_dynamics").delete().eq("id", dynamic.id);
    router.push("/calendario/dinamicas");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link
          href="/calendario/dinamicas"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={14} />
          Dinâmicas
        </Link>
        {canEdit && (
          <div className="flex gap-2">
            <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 size={14} />
              Excluir dinâmica
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
              <Save size={14} />
              {saving ? "Salvando..." : savedAt ? "Salvo!" : "Salvar"}
            </Button>
          </div>
        )}
      </div>

      <h1 className="mt-4 text-[28px] font-semibold text-text-primary">
        {dynamic.icon} {dynamic.name}
      </h1>

      <div className="mt-6 space-y-6">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-medium text-text-primary">Metadados</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Ícone</label>
              <Input
                value={dynamic.icon ?? ""}
                disabled={!canEdit}
                onChange={(e) => setDynamic((d) => ({ ...d, icon: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <label className="text-xs text-text-muted">Nome</label>
              <Input
                value={dynamic.name}
                disabled={!canEdit}
                onChange={(e) => setDynamic((d) => ({ ...d, name: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <label className="text-xs text-text-muted">Subtítulo</label>
            <Input
              value={dynamic.subtitle ?? ""}
              disabled={!canEdit}
              onChange={(e) => setDynamic((d) => ({ ...d, subtitle: e.target.value }))}
            />
          </div>
          <div className="mt-3 space-y-1">
            <label className="text-xs text-text-muted">Regras universais (uma por linha)</label>
            <Textarea rows={6} value={rulesText} disabled={!canEdit} onChange={(e) => setRulesText(e.target.value)} />
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={dynamic.active}
              disabled={!canEdit}
              onChange={(e) => setDynamic((d) => ({ ...d, active: e.target.checked }))}
            />
            Dinâmica ativa (aparece no seletor do dia)
          </label>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-medium text-text-primary">Vagas por faixa</h3>
          <div className="mb-3 space-y-1">
            <label className="text-xs text-text-muted">Modo</label>
            <Select
              value={vagas.mode ?? "none"}
              disabled={!canEdit}
              onChange={(e) => updateVagas({ mode: e.target.value as VagasConfig["mode"] })}
              className="w-48"
            >
              <option value="none">Sem vagas (ex: Kamikaze)</option>
              <option value="tiered">Faixas (Turbo/Suprema/Lendária/Galáctica)</option>
            </Select>
          </div>
          {vagas.mode === "tiered" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <VagasField label="Ignição" value={vagas.ignicao ?? 0} disabled={!canEdit} onChange={(v) => updateVagas({ ignicao: v })} />
              <VagasField label="Turbo" value={vagas.turbo ?? 0} disabled={!canEdit} onChange={(v) => updateVagas({ turbo: v })} />
              <VagasField label="Suprema" value={vagas.suprema ?? 0} disabled={!canEdit} onChange={(v) => updateVagas({ suprema: v })} />
              <VagasField label="Lendária" value={vagas.lendaria ?? 0} disabled={!canEdit} onChange={(v) => updateVagas({ lendaria: v })} />
              <VagasField label="Galáctica" value={vagas.galactica ?? 0} disabled={!canEdit} onChange={(v) => updateVagas({ galactica: v })} />
              <div className="space-y-1">
                <label className="text-xs text-text-muted">Curva</label>
                <Select
                  value={vagas.curva ?? "linear"}
                  disabled={!canEdit}
                  onChange={(e) => updateVagas({ curva: e.target.value as VagasConfig["curva"] })}
                  className="h-8 text-xs"
                >
                  <option value="linear">Linear</option>
                  <option value="agressiva">Agressiva</option>
                  <option value="suave">Suave</option>
                </Select>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">Bancos rotativos de texto</h3>
            {canEdit && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setBanks((prev) => [...prev, { name: "", items: "" }])}
              >
                <Plus size={14} />
                Adicionar banco
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {banks.map((bank, index) => (
              <div key={index} className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={bank.name}
                    disabled={!canEdit}
                    placeholder="nome (ex: cta, urgS, headerRot)"
                    onChange={(e) =>
                      setBanks((prev) => prev.map((b, i) => (i === index ? { ...b, name: e.target.value } : b)))
                    }
                    className="h-8 w-56 text-xs"
                  />
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setBanks((prev) => prev.filter((_, i) => i !== index))}
                      className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-card-hover hover:text-danger"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <Textarea
                  value={bank.items}
                  disabled={!canEdit}
                  rows={3}
                  placeholder="Um item por linha"
                  onChange={(e) =>
                    setBanks((prev) => prev.map((b, i) => (i === index ? { ...b, items: e.target.value } : b)))
                  }
                  className="mt-2 text-xs"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">Variáveis extras (links, cláusulas fixas)</h3>
            {canEdit && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setExtraVars((prev) => [...prev, { key: "", value: "" }])}
              >
                <Plus size={14} />
                Adicionar
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {extraVars.map((v, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={v.key}
                  disabled={!canEdit}
                  placeholder="chave (ex: link)"
                  onChange={(e) =>
                    setExtraVars((prev) => prev.map((item, i) => (i === index ? { ...item, key: e.target.value } : item)))
                  }
                  className="h-8 w-40 text-xs"
                />
                <Input
                  value={v.value}
                  disabled={!canEdit}
                  placeholder="valor"
                  onChange={(e) =>
                    setExtraVars((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, value: e.target.value } : item))
                    )
                  }
                  className="h-8 flex-1 text-xs"
                />
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setExtraVars((prev) => prev.filter((_, i) => i !== index))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-card-hover hover:text-danger"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <SlotsEditor dynamicId={dynamic.id} slots={slots} onSlotsChange={setSlots} canEdit={canEdit} />
      </div>
    </div>
  );
}

function VagasField({
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
      <label className="text-xs text-text-muted">{label}</label>
      <Input
        type="number"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-8 text-xs"
      />
    </div>
  );
}
