"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Trash2, Plus, Copy } from "@/components/ui/icones";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PromptPicker } from "@/components/prompt-picker";
import { ImageGenerationPanel } from "@/components/image-generation-panel";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ContentGrid, EmptyState, Field, Section } from "@/components/ui/page";
import { DateNav } from "../calendario/components/date-nav";
import { DayNewsPreview } from "../calendario/components/day-news-preview";
import { toDateKey } from "../calendario/lib/date-utils";
import type { Database, EmailStatus } from "@/lib/supabase/types";

type EmailCampaign = Database["public"]["Tables"]["email_campaigns"]["Row"];

interface EmailsClientProps {
  initialCampaigns: EmailCampaign[];
  currentUserId: string;
}

const STATUS_LABEL: Record<EmailStatus, string> = {
  rascunho: "Rascunho",
  pronto: "Pronto",
  enviado: "Enviado",
};

const STATUS_TONE: Record<EmailStatus, "neutral" | "warning" | "success"> = {
  rascunho: "neutral",
  pronto: "warning",
  enviado: "success",
};

const EMAIL_SYSTEM_PROMPT = `Você é um redator de e-mail marketing para uma escola de trading. Gere um e-mail completo respondendo SOMENTE neste formato exato, sem markdown, sem comentários extras:
ASSUNTO: <linha única, chamativa, até 60 caracteres>
PREVIEW: <texto de preview/preheader, até 100 caracteres>
CORPO:
<corpo do e-mail em HTML simples, com parágrafos <p>, pode usar <strong>, <a>, <ul>/<li>>`;

const EMPTY_FORM = {
  id: null as string | null,
  subject: "",
  previewText: "",
  bodyHtml: "",
  newsReference: "",
  tema: "",
  status: "rascunho" as EmailStatus,
  promptId: null as string | null,
  prompt: "",
};

function parseGeneratedEmail(raw: string) {
  const subjectMatch = raw.match(/ASSUNTO:\s*(.+)/i);
  const previewMatch = raw.match(/PREVIEW:\s*(.+)/i);
  const bodyMatch = raw.match(/CORPO:\s*([\s\S]*)/i);
  return {
    subject: subjectMatch?.[1]?.trim() ?? "",
    preview: previewMatch?.[1]?.trim() ?? "",
    body: bodyMatch?.[1]?.trim() ?? raw.trim(),
  };
}

export function EmailsClient({ initialCampaigns, currentUserId }: EmailsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const confirm = useConfirm();

  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [dateKey, setDateKey] = useState(searchParams.get("data") || toDateKey(new Date()));
  const [form, setForm] = useState(EMPTY_FORM);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const campaignsForDate = campaigns.filter((c) => c.scheduled_date === dateKey);

  function updateDate(next: string) {
    setDateKey(next);
    setForm(EMPTY_FORM);
    setBannerUrl(null);
    router.replace(`/emails?data=${next}`);
  }

  function loadIntoForm(campaign: EmailCampaign) {
    setForm({
      id: campaign.id,
      subject: campaign.subject ?? "",
      previewText: campaign.preview_text ?? "",
      bodyHtml: campaign.body_html ?? "",
      newsReference: campaign.news_reference ?? "",
      tema: campaign.tema ?? "",
      status: campaign.status,
      promptId: campaign.prompt_id,
      prompt: "",
    });
    setBannerUrl(null);
  }

  function jumpToCampaign(campaign: EmailCampaign) {
    setDateKey(campaign.scheduled_date);
    loadIntoForm(campaign);
    router.replace(`/emails?data=${campaign.scheduled_date}`);
  }

  function handleSaved(campaign: EmailCampaign) {
    setCampaigns((prev) => {
      const exists = prev.some((c) => c.id === campaign.id);
      return exists ? prev.map((c) => (c.id === campaign.id ? campaign : c)) : [campaign, ...prev];
    });
  }

  function handleDeleted(id: string) {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleGenerateEmail() {
    if (!form.prompt.trim()) {
      setGenError("Escreva ou selecione um prompt para gerar o e-mail.");
      return;
    }
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/ai/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "email",
          prompt: form.prompt,
          system: EMAIL_SYSTEM_PROMPT,
          promptId: form.promptId ?? undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erro ao gerar e-mail.");
      const parsed = parseGeneratedEmail(body.text);
      setForm((prev) => ({
        ...prev,
        subject: parsed.subject || prev.subject,
        previewText: parsed.preview || prev.previewText,
        bodyHtml: parsed.body || prev.bodyHtml,
      }));
    } catch (error) {
      setGenError(error instanceof Error ? error.message : "Erro ao gerar e-mail.");
    } finally {
      setGenerating(false);
    }
  }

  function handleInsertBanner() {
    if (!bannerUrl) return;
    setForm((prev) => ({
      ...prev,
      bodyHtml: `<img src="${bannerUrl}" alt="" style="max-width:100%;border-radius:8px;" />\n\n${prev.bodyHtml}`,
    }));
  }

  async function handleCopy() {
    if (!form.bodyHtml) return;
    await navigator.clipboard.writeText(form.bodyHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      scheduled_date: dateKey,
      subject: form.subject || null,
      preview_text: form.previewText || null,
      body_html: form.bodyHtml || null,
      news_reference: form.newsReference || null,
      prompt_id: form.promptId,
      tema: form.tema || null,
      status: form.status,
      created_by: currentUserId,
    };

    if (form.id) {
      const { data, error } = await supabase
        .from("email_campaigns")
        .update(payload)
        .eq("id", form.id)
        .select()
        .single();
      if (!error && data) {
        handleSaved(data);
        toast.success("Campanha salva.");
      } else {
        toast.error("Erro ao salvar a campanha. Tente novamente.");
      }
    } else {
      const { data, error } = await supabase.from("email_campaigns").insert(payload).select().single();
      if (!error && data) {
        handleSaved(data);
        setForm((prev) => ({ ...prev, id: data.id }));
        toast.success("Campanha salva.");
      } else {
        toast.error("Erro ao salvar a campanha. Tente novamente.");
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!form.id) return;
    const ok = await confirm({
      title: "Excluir campanha",
      description: "Excluir esta campanha de e-mail?",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("email_campaigns").delete().eq("id", form.id);
    if (!error) {
      handleDeleted(form.id);
      setForm(EMPTY_FORM);
    } else {
      toast.error("Erro ao excluir a campanha. Tente novamente.");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <DateNav dateKey={dateKey} onChange={updateDate} />
        <Button type="button" variant="secondary" size="sm" onClick={() => { setForm(EMPTY_FORM); setBannerUrl(null); }}>
          <Plus size={14} />
          Nova campanha
        </Button>
      </div>

      {campaignsForDate.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {campaignsForDate.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => loadIntoForm(c)}
              className={`rounded-button px-2.5 py-1 text-xs transition-shadow ${
                form.id === c.id
                  ? "bg-accent-soft text-text-primary shadow-[0_0_0_1px_var(--accent)]"
                  : "bg-card-hover text-text-secondary shadow-card-sm hover:brightness-95"
              }`}
            >
              {c.subject || c.tema || "Sem assunto"}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* A coluna da esquerda é uma sequência de etapas: o que aconteceu no
            dia, o briefing, o texto, o banner. Antes eram doze blocos com o
            mesmo peso empilhados a 16px um do outro — nada dizia onde uma
            etapa terminava e a outra começava. */}
        <div>
          <Section titulo="Notícias do dia" descricao="O gancho da campanha costuma sair daqui.">
            <Card className="p-4">
              <DayNewsPreview dateKey={dateKey} />
            </Card>
          </Section>

          <Section titulo="Briefing" descricao="O que a IA precisa saber antes de escrever.">
            <ContentGrid>
              <Field label="Tema/tag" span={6}>
                <Input
                  value={form.tema}
                  onChange={(e) => setForm((prev) => ({ ...prev, tema: e.target.value }))}
                  placeholder="promoção, resultado, novidade..."
                />
              </Field>
              <Field label="Referência de notícia" span={6}>
                <Input
                  value={form.newsReference}
                  onChange={(e) => setForm((prev) => ({ ...prev, newsReference: e.target.value }))}
                  placeholder="Cole um título/gancho da lista acima"
                />
              </Field>
            </ContentGrid>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="block text-[11px] font-medium text-text-secondary">Prompt do e-mail</label>
                <PromptPicker
                  preferredSlug="email"
                  onSelect={(p) => setForm((prev) => ({ ...prev, prompt: p.content, promptId: p.id }))}
                />
              </div>
              <Textarea
                value={form.prompt}
                onChange={(e) => setForm((prev) => ({ ...prev, prompt: e.target.value, promptId: null }))}
                rows={4}
                placeholder="Descreva o objetivo do e-mail (ex: divulgar resultado da semana, convite pra live...)"
              />

              {genError && <p className="mt-2 text-sm text-danger">{genError}</p>}

              {/* O botão tem teto: texto longo merece a largura toda, ação não. */}
              <Button
                type="button"
                onClick={handleGenerateEmail}
                disabled={generating}
                className="mt-3 w-full max-w-[280px]"
              >
                <Sparkles size={16} />
                {generating ? "Gerando e-mail..." : "Gerar assunto + corpo"}
              </Button>
            </div>
          </Section>

          <Section titulo="Conteúdo" descricao="Sai preenchido pela IA, mas é aqui que você ajusta.">
            <ContentGrid>
              <Field label="Assunto" span={12}>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Assunto do e-mail"
                />
              </Field>
              <Field label="Preview/preheader" hint="(a linha embaixo do assunto na caixa de entrada)" span={12}>
                <Input
                  value={form.previewText}
                  onChange={(e) => setForm((prev) => ({ ...prev, previewText: e.target.value }))}
                  placeholder="Texto que aparece na prévia da caixa de entrada"
                />
              </Field>
            </ContentGrid>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="block text-[11px] font-medium text-text-secondary">Corpo do e-mail (HTML)</label>
                <Button type="button" variant="ghost" size="sm" onClick={handleCopy} className="h-6 px-2 text-[11px]">
                  <Copy size={12} />
                  {copied ? "Copiado!" : "Copiar HTML"}
                </Button>
              </div>
              <Textarea
                value={form.bodyHtml}
                onChange={(e) => setForm((prev) => ({ ...prev, bodyHtml: e.target.value }))}
                rows={10}
                placeholder="Corpo do e-mail em HTML"
              />
            </div>
          </Section>

          <Section titulo="Banner" descricao="Opcional — uma imagem de topo pro e-mail.">
            <ImageGenerationPanel
              contextType="email"
              contextId={form.id}
              value={bannerUrl}
              onChange={setBannerUrl}
              label="Prompt do banner"
              placeholder="Prompt para gerar um banner de topo"
              rows={2}
            />
            {bannerUrl && (
              <Button type="button" size="sm" className="mt-3" onClick={handleInsertBanner}>
                Inserir no corpo do e-mail
              </Button>
            )}
          </Section>

          {/* Fecha o fluxo: em que estado essa campanha fica e o que salvar. */}
          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
            <div className="w-40">
              <label className="mb-1.5 block text-[11px] font-medium text-text-secondary">Status</label>
              <Select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as EmailStatus }))}
              >
                <option value="rascunho">Rascunho</option>
                <option value="pronto">Pronto</option>
                <option value="enviado">Enviado</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              {form.id && (
                <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
                  <Trash2 size={14} />
                  Excluir
                </Button>
              )}
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : form.id ? "Salvar alterações" : "Salvar campanha"}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-medium text-text-secondary">Como chega na caixa de entrada</p>
            </div>
            <div className="bg-white p-5 text-black">
              <p className="text-sm font-semibold">{form.subject || "(sem assunto)"}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{form.previewText || "(sem preview)"}</p>
              <div
                className="prose prose-sm mt-4 max-w-none"
                dangerouslySetInnerHTML={{ __html: form.bodyHtml || "<p style='color:#999'>Corpo vazio</p>" }}
              />
            </div>
          </Card>

          <Card className="p-4">
            <p className="mb-3 text-xs font-medium text-text-secondary">Histórico de campanhas</p>
            {campaigns.length === 0 ? (
              <EmptyState
                titulo="Nenhuma campanha ainda"
                descricao="A primeira que você salvar aparece aqui, com a data e o status."
                className="px-4 py-6"
              />
            ) : (
              <div className="max-h-96 space-y-1.5 overflow-y-auto">
                {campaigns.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => jumpToCampaign(c)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-shadow ${
                      c.id === form.id
                        ? "bg-accent-soft shadow-[0_0_0_1px_var(--accent)]"
                        : "bg-card-hover shadow-card-sm hover:shadow-[0_0_0_1px_var(--accent)]"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-text-primary">{c.subject || c.tema || "Sem assunto"}</span>
                      <span className="text-[11px] text-text-tertiary">
                        {new Date(`${c.scheduled_date}T00:00:00`).toLocaleDateString("pt-BR")}
                      </span>
                    </span>
                    <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
