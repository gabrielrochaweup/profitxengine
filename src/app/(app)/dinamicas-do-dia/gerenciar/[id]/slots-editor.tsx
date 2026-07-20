"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { Database, TradingWindow } from "@/lib/supabase/types";

type MessageDynamicSlot = Database["public"]["Tables"]["message_dynamic_slots"]["Row"];

interface SlotsEditorProps {
  dynamicId: string;
  slots: MessageDynamicSlot[];
  onSlotsChange: (slots: MessageDynamicSlot[]) => void;
  canEdit: boolean;
}

const VAR_LEGEND =
  "Variáveis disponíveis: ${acertoP} ${entradaP} · ${acertoL} ${entradaL} · ${acertoC} ${rendimentoCopyR} ${bancaCopy} · ${acertoT} · ${vagasT} ${vagasS} ${vagasL} ${vagasG} ${vagasI} ${vagasTotais} · ${cta} ${ctaP} ${ctaU} ${link} ${linkU} ${linkL} ${urgS} ${vagN2} · ${fontePlacar} ${fonteLucro} · ${depNome} ${depValor} ${depSituacao} · + qualquer banco rotativo cadastrado abaixo (ex: ${headerRot})";

export function SlotsEditor({ dynamicId, slots, onSlotsChange, canEdit }: SlotsEditorProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [expanded, setExpanded] = useState<string | null>(null);

  function updateSlot(id: string, patch: Partial<MessageDynamicSlot>) {
    onSlotsChange(slots.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slots.length) return;
    const next = [...slots];
    [next[index], next[target]] = [next[target], next[index]];
    const withPositions = next.map((s, i) => ({ ...s, position: i + 1 }));
    onSlotsChange(withPositions);
  }

  async function addSlot() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("message_dynamic_slots")
      .insert({
        dynamic_id: dynamicId,
        position: slots.length + 1,
        msg_key: String(slots.length + 1),
        time_label: "",
        role_label: "",
        cta_tags: [],
        template: "",
        media_suggestion: null,
        expert_hint: null,
        has_fonte_selector: false,
        fonte_default: null,
      })
      .select()
      .single();
    if (!error && data) {
      onSlotsChange([...slots, data]);
      setExpanded(data.id);
    } else {
      toast.error("Erro ao adicionar a mensagem. Tente novamente.");
    }
  }

  async function deleteSlot(id: string) {
    const ok = await confirm({
      title: "Excluir mensagem",
      description: "Excluir esta mensagem da dinâmica?",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("message_dynamic_slots").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir a mensagem. Tente novamente.");
      return;
    }
    onSlotsChange(slots.filter((s) => s.id !== id));
  }

  async function saveSlot(slot: MessageDynamicSlot) {
    const supabase = createClient();
    const { error } = await supabase
      .from("message_dynamic_slots")
      .update({
        position: slot.position,
        msg_key: slot.msg_key,
        time_label: slot.time_label,
        role_label: slot.role_label,
        cta_tags: slot.cta_tags,
        template: slot.template,
        media_suggestion: slot.media_suggestion,
        expert_hint: slot.expert_hint,
        has_fonte_selector: slot.has_fonte_selector,
        fonte_default: slot.fonte_default,
      })
      .eq("id", slot.id);
    if (error) toast.error("Erro ao salvar a mensagem. Tente novamente.");
  }

  async function savePositions() {
    const supabase = createClient();
    const results = await Promise.all(
      slots.map((s) => supabase.from("message_dynamic_slots").update({ position: s.position }).eq("id", s.id))
    );
    if (results.some((r) => r.error)) toast.error("Erro ao salvar a nova ordem. Tente novamente.");
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">Mensagens ({slots.length})</h3>
        {canEdit && (
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={savePositions}>
              Salvar ordem
            </Button>
            <Button type="button" size="sm" onClick={addSlot}>
              <Plus size={14} />
              Nova mensagem
            </Button>
          </div>
        )}
      </div>

      <p className="mb-3 text-[11px] text-text-muted">{VAR_LEGEND}</p>

      <div className="space-y-2">
        {slots.map((slot, index) => {
          const isOpen = expanded === slot.id;
          return (
            <div key={slot.id} className="rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : slot.id)}
                className="flex w-full items-center gap-3 p-3 text-left"
              >
                <span className="rounded-button bg-card-hover px-2 py-0.5 text-[11px] text-text-muted">
                  #{slot.position}
                </span>
                <span className="text-xs font-medium text-text-primary">{slot.time_label || "—"}</span>
                <span className="flex-1 truncate text-xs text-text-secondary">{slot.role_label}</span>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {isOpen && (
                <div className="space-y-3 border-t border-border p-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="space-y-1">
                      <label className="text-[11px] text-text-muted">Chave (msg_key)</label>
                      <Input
                        value={slot.msg_key}
                        disabled={!canEdit}
                        onChange={(e) => updateSlot(slot.id, { msg_key: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-text-muted">Horário</label>
                      <Input
                        value={slot.time_label ?? ""}
                        disabled={!canEdit}
                        onChange={(e) => updateSlot(slot.id, { time_label: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] text-text-muted">Papel/descrição</label>
                      <Input
                        value={slot.role_label ?? ""}
                        disabled={!canEdit}
                        onChange={(e) => updateSlot(slot.id, { role_label: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-text-muted">Tags de CTA (separadas por vírgula)</label>
                      <Input
                        value={(slot.cta_tags ?? []).join(", ")}
                        disabled={!canEdit}
                        onChange={(e) =>
                          updateSlot(slot.id, {
                            cta_tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex items-end gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <input
                          type="checkbox"
                          checked={slot.has_fonte_selector}
                          disabled={!canEdit}
                          onChange={(e) => updateSlot(slot.id, { has_fonte_selector: e.target.checked })}
                        />
                        Tem seletor de fonte
                      </label>
                      {slot.has_fonte_selector && (
                        <Select
                          value={slot.fonte_default ?? "semana"}
                          disabled={!canEdit}
                          onChange={(e) => updateSlot(slot.id, { fonte_default: e.target.value as TradingWindow })}
                          className="h-8 w-32 text-xs"
                        >
                          <option value="dia">Dia</option>
                          <option value="semana">Semana</option>
                          <option value="mes">Mês</option>
                          <option value="total">Total</option>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-text-muted">Template da mensagem</label>
                    <Textarea
                      value={slot.template}
                      disabled={!canEdit}
                      rows={8}
                      onChange={(e) => updateSlot(slot.id, { template: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-text-muted">Sugestão de mídia</label>
                      <Textarea
                        value={slot.media_suggestion ?? ""}
                        disabled={!canEdit}
                        rows={2}
                        onChange={(e) => updateSlot(slot.id, { media_suggestion: e.target.value || null })}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-text-muted">Sugestão pro expert (vídeo/áudio)</label>
                      <Textarea
                        value={slot.expert_hint ?? ""}
                        disabled={!canEdit}
                        rows={2}
                        onChange={(e) => updateSlot(slot.id, { expert_hint: e.target.value || null })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <div className="flex gap-1">
                        <IconButton label="Mover para cima" onClick={() => move(index, -1)}>
                          <ArrowUp size={14} />
                        </IconButton>
                        <IconButton label="Mover para baixo" onClick={() => move(index, 1)}>
                          <ArrowDown size={14} />
                        </IconButton>
                        <IconButton label="Excluir" danger onClick={() => deleteSlot(slot.id)}>
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                      <Button type="button" variant="secondary" size="sm" onClick={() => saveSlot(slot)}>
                        Salvar mensagem
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
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
      className={`flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-card-hover ${
        danger ? "hover:text-danger" : "hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
