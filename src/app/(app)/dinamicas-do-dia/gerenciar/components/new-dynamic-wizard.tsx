"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Sparkles, ArrowLeft, ArrowRight, Copy, FilePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { Database } from "@/lib/supabase/types";

type MessageDynamic = Database["public"]["Tables"]["message_dynamics"]["Row"];

interface NewDynamicWizardProps {
  open: boolean;
  onClose: () => void;
  dynamics: MessageDynamic[];
  onCreated: (dynamic: MessageDynamic) => void;
}

type Period = "manha" | "tarde" | "noite";

const PERIOD_STEPS: { key: Period; label: string; hint: string }[] = [
  { key: "manha", label: "Mensagens da manhã", hint: "Ex: abertura, aquecimento, sessão ao vivo" },
  { key: "tarde", label: "Mensagens da tarde", hint: "Ex: retomada, prova social, urgência" },
  { key: "noite", label: "Mensagens da noite", hint: "Ex: última chance, encerramento" },
];

interface DraftSlot {
  id: string;
  timeLabel: string;
  roleLabel: string;
  prompt: string;
  template: string;
  generating: boolean;
}

function emptyDraftSlot(): DraftSlot {
  return { id: crypto.randomUUID(), timeLabel: "", roleLabel: "", prompt: "", template: "", generating: false };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type Step = "choose" | "duplicate" | "new-name" | `new-${Period}` | "new-review";

export function NewDynamicWizard({ open, onClose, dynamics, onCreated }: NewDynamicWizardProps) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>("choose");
  const [saving, setSaving] = useState(false);

  // Modo "duplicar"
  const [sourceId, setSourceId] = useState("");
  const [duplicateName, setDuplicateName] = useState("");

  // Modo "criar do zero"
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✨");
  const [slotsByPeriod, setSlotsByPeriod] = useState<Record<Period, DraftSlot[]>>({
    manha: [],
    tarde: [],
    noite: [],
  });

  function reset() {
    setStep("choose");
    setSourceId("");
    setDuplicateName("");
    setName("");
    setIcon("✨");
    setSlotsByPeriod({ manha: [], tarde: [], noite: [] });
  }

  function handleClose() {
    if (saving) return;
    reset();
    onClose();
  }

  function addSlot(period: Period) {
    setSlotsByPeriod((prev) => ({ ...prev, [period]: [...prev[period], emptyDraftSlot()] }));
  }

  function updateSlot(period: Period, id: string, patch: Partial<DraftSlot>) {
    setSlotsByPeriod((prev) => ({
      ...prev,
      [period]: prev[period].map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }

  function removeSlot(period: Period, id: string) {
    setSlotsByPeriod((prev) => ({ ...prev, [period]: prev[period].filter((s) => s.id !== id) }));
  }

  async function generateForSlot(period: Period, id: string) {
    const slot = slotsByPeriod[period].find((s) => s.id === id);
    if (!slot || !slot.prompt.trim()) return;
    updateSlot(period, id, { generating: true });
    try {
      const contextBits = [
        slot.roleLabel ? `papel/função: "${slot.roleLabel}"` : null,
        slot.timeLabel ? `horário aproximado: ${slot.timeLabel}` : null,
      ]
        .filter(Boolean)
        .join(", ");
      const res = await fetch("/api/ai/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "mensagem",
          prompt: `Escreva uma mensagem de WhatsApp para engajamento de um grupo de trading${
            contextBits ? ` (${contextBits})` : ""
          }. ${slot.prompt}`,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erro ao gerar mensagem.");
      updateSlot(period, id, { template: body.text, generating: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar mensagem.");
      updateSlot(period, id, { generating: false });
    }
  }

  async function handleDuplicate() {
    if (!sourceId || !duplicateName.trim()) return;
    const source = dynamics.find((d) => d.id === sourceId);
    if (!source) return;

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: dynamic, error: dynError } = await supabase
      .from("message_dynamics")
      .insert({
        slug: slugify(duplicateName) || `dinamica-${Date.now()}`,
        name: duplicateName,
        icon: source.icon,
        subtitle: source.subtitle,
        rules: source.rules,
        vagas_config: source.vagas_config,
        rotating_banks: source.rotating_banks,
        extra_vars: source.extra_vars,
        active: true,
        created_by: user?.id ?? null,
      })
      .select()
      .single();

    if (dynError || !dynamic) {
      toast.error("Erro ao duplicar a dinâmica. Tente novamente.");
      setSaving(false);
      return;
    }

    const { data: sourceSlots } = await supabase
      .from("message_dynamic_slots")
      .select("*")
      .eq("dynamic_id", sourceId)
      .order("position");

    if (sourceSlots && sourceSlots.length > 0) {
      const rows = sourceSlots.map((s) => ({
        dynamic_id: dynamic.id,
        position: s.position,
        msg_key: s.msg_key,
        time_label: s.time_label,
        role_label: s.role_label,
        cta_tags: s.cta_tags,
        template: s.template,
        media_suggestion: s.media_suggestion,
        expert_hint: s.expert_hint,
        has_fonte_selector: s.has_fonte_selector,
        fonte_default: s.fonte_default,
        needs_realtime_update: s.needs_realtime_update,
      }));
      const { error: slotsError } = await supabase.from("message_dynamic_slots").insert(rows);
      if (slotsError) toast.error("Dinâmica duplicada, mas houve erro ao copiar as mensagens.");
    }

    setSaving(false);
    onCreated(dynamic);
    reset();
    onClose();
    router.push(`/dinamicas-do-dia/gerenciar/${dynamic.id}`);
  }

  async function handleCreateFromScratch() {
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: dynamic, error: dynError } = await supabase
      .from("message_dynamics")
      .insert({
        slug: slugify(name) || `dinamica-${Date.now()}`,
        name,
        icon: icon || "✨",
        subtitle: "",
        rules: [],
        vagas_config: { mode: "none" },
        rotating_banks: {},
        extra_vars: { link: "", linkU: "", linkL: "" },
        active: true,
        created_by: user?.id ?? null,
      })
      .select()
      .single();

    if (dynError || !dynamic) {
      toast.error("Erro ao criar a dinâmica. Tente novamente.");
      setSaving(false);
      return;
    }

    const allSlots = [...slotsByPeriod.manha, ...slotsByPeriod.tarde, ...slotsByPeriod.noite];
    if (allSlots.length > 0) {
      const rows = allSlots.map((slot, i) => ({
        dynamic_id: dynamic.id,
        position: i + 1,
        msg_key: String(i + 1),
        time_label: slot.timeLabel || null,
        role_label: slot.roleLabel || null,
        cta_tags: [],
        template: slot.template,
        media_suggestion: null,
        expert_hint: null,
        has_fonte_selector: false,
        fonte_default: null,
      }));
      const { error: slotsError } = await supabase.from("message_dynamic_slots").insert(rows);
      if (slotsError) toast.error("Dinâmica criada, mas houve erro ao salvar as mensagens. Adicione no editor.");
    }

    setSaving(false);
    onCreated(dynamic);
    reset();
    onClose();
    router.push(`/dinamicas-do-dia/gerenciar/${dynamic.id}`);
  }

  const periodIndex = step.startsWith("new-") && step !== "new-name" && step !== "new-review"
    ? PERIOD_STEPS.findIndex((p) => `new-${p.key}` === step)
    : -1;
  const totalMessages = slotsByPeriod.manha.length + slotsByPeriod.tarde.length + slotsByPeriod.noite.length;

  return (
    <Modal open={open} onClose={handleClose} title="Nova dinâmica" className="max-w-2xl">
      {step === "choose" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setStep("duplicate")}
            className="flex flex-col items-start gap-2 rounded-card border border-border p-4 text-left transition-colors hover:border-accent hover:bg-card-hover"
          >
            <Copy size={20} className="text-accent-text" />
            <span className="text-sm font-medium text-text-primary">Duplicar uma existente</span>
            <span className="text-xs text-text-muted">
              Copia todas as mensagens de uma dinâmica pronta pra você ajustar a partir dela.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStep("new-name")}
            className="flex flex-col items-start gap-2 rounded-card border border-border p-4 text-left transition-colors hover:border-accent hover:bg-card-hover"
          >
            <FilePlus size={20} className="text-accent-text" />
            <span className="text-sm font-medium text-text-primary">Criar do zero</span>
            <span className="text-xs text-text-muted">
              Monta as mensagens por etapa (manhã, tarde, noite), com geração por IA.
            </span>
          </button>
        </div>
      )}

      {step === "duplicate" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Dinâmica a duplicar</label>
            <Select
              value={sourceId}
              onChange={(e) => {
                setSourceId(e.target.value);
                const source = dynamics.find((d) => d.id === e.target.value);
                if (source) setDuplicateName(`${source.name} (cópia)`);
              }}
            >
              <option value="">Selecione...</option>
              {dynamics.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.icon} {d.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Nome da nova dinâmica</label>
            <Input value={duplicateName} onChange={(e) => setDuplicateName(e.target.value)} placeholder="Ex: Relâmpago" />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep("choose")}>
              <ArrowLeft size={14} />
              Voltar
            </Button>
            <Button type="button" disabled={!sourceId || !duplicateName.trim() || saving} onClick={handleDuplicate}>
              {saving ? "Duplicando..." : "Duplicar dinâmica"}
            </Button>
          </div>
        </div>
      )}

      {step === "new-name" && (
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_80px] gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Nome da dinâmica</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Relâmpago" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Ícone</label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="✨" className="text-center" />
            </div>
          </div>
          <p className="text-xs text-text-muted">
            Na próxima etapa você monta as mensagens, período por período. Dá pra pular qualquer etapa e completar
            depois no editor.
          </p>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep("choose")}>
              <ArrowLeft size={14} />
              Voltar
            </Button>
            <Button type="button" disabled={!name.trim()} onClick={() => setStep("new-manha")}>
              Continuar
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {periodIndex >= 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted">Etapa {periodIndex + 2} de 5</p>
              <h3 className="text-sm font-medium text-text-primary">{PERIOD_STEPS[periodIndex].label}</h3>
            </div>
            <span className="rounded-button bg-card-hover px-2 py-1 text-[11px] text-text-muted">
              {slotsByPeriod[PERIOD_STEPS[periodIndex].key].length} mensagens
            </span>
          </div>

          <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
            {slotsByPeriod[PERIOD_STEPS[periodIndex].key].map((slot) => (
              <div key={slot.id} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={slot.timeLabel}
                    onChange={(e) => updateSlot(PERIOD_STEPS[periodIndex].key, slot.id, { timeLabel: e.target.value })}
                    placeholder="Horário (ex: 08h)"
                    className="w-32 text-xs"
                  />
                  <Input
                    value={slot.roleLabel}
                    onChange={(e) => updateSlot(PERIOD_STEPS[periodIndex].key, slot.id, { roleLabel: e.target.value })}
                    placeholder="Papel (ex: Abertura)"
                    className="flex-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeSlot(PERIOD_STEPS[periodIndex].key, slot.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-card-hover hover:text-danger"
                    aria-label="Remover mensagem"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex gap-2">
                  <Textarea
                    value={slot.prompt}
                    onChange={(e) => updateSlot(PERIOD_STEPS[periodIndex].key, slot.id, { prompt: e.target.value })}
                    rows={2}
                    placeholder={`O que essa mensagem deve dizer? ${PERIOD_STEPS[periodIndex].hint}`}
                    className="flex-1 text-xs"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={!slot.prompt.trim() || slot.generating}
                    onClick={() => generateForSlot(PERIOD_STEPS[periodIndex].key, slot.id)}
                  >
                    <Sparkles size={13} />
                    {slot.generating ? "..." : "Gerar"}
                  </Button>
                </div>

                <Textarea
                  value={slot.template}
                  onChange={(e) => updateSlot(PERIOD_STEPS[periodIndex].key, slot.id, { template: e.target.value })}
                  rows={3}
                  placeholder="Mensagem final (gerada por IA ou escrita à mão)..."
                  className="w-full text-xs"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => addSlot(PERIOD_STEPS[periodIndex].key)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-strong py-2.5 text-xs text-text-secondary hover:bg-card-hover"
            >
              <Plus size={13} />
              Adicionar mensagem
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep(periodIndex === 0 ? "new-name" : `new-${PERIOD_STEPS[periodIndex - 1].key}`)}
            >
              <ArrowLeft size={14} />
              Voltar
            </Button>
            <Button
              type="button"
              onClick={() =>
                setStep(periodIndex === PERIOD_STEPS.length - 1 ? "new-review" : `new-${PERIOD_STEPS[periodIndex + 1].key}`)
              }
            >
              Continuar
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {step === "new-review" && (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-text-muted">Etapa 5 de 5</p>
            <h3 className="text-sm font-medium text-text-primary">Revisão</h3>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-text-primary">
              {icon} {name}
            </p>
            <div className="mt-2 space-y-1 text-xs text-text-secondary">
              {PERIOD_STEPS.map((p) => (
                <p key={p.key}>
                  {p.label}: {slotsByPeriod[p.key].length} mensagem(ns)
                </p>
              ))}
              <p className="font-medium text-text-primary">Total: {totalMessages} mensagem(ns)</p>
            </div>
          </div>

          <p className="text-xs text-text-muted">
            Regras universais, vagas e bancos rotativos ficam com os padrões — dá pra ajustar tudo isso no editor
            completo logo depois de criar.
          </p>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep("new-noite")}>
              <ArrowLeft size={14} />
              Voltar
            </Button>
            <Button type="button" disabled={saving} onClick={handleCreateFromScratch}>
              {saving ? "Criando..." : "Criar dinâmica"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
