"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Trash2, Plus, Copy } from "lucide-react";
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
    if (!confirm("Excluir esta campanha de e-mail?")) return;
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateNav dateKey={dateKey} onChange={updateDate} />
        <Button type="button" variant="secondary" size="sm" onClick={() => { setForm(EMPTY_FORM); setBannerUrl(null); }}>
          <Plus size={14} />
          Nova campanha
        </Button>
      </div>

      {campaignsForDate.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {campaignsForDate.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => loadIntoForm(c)}
              className={`rounded-button border px-2.5 py-1 text-xs ${
                form.id === c.id
                  ? "border-accent bg-accent/15 text-text-primary"
                  : "border-border-strong text-text-secondary hover:bg-card-hover"
              }`}
            >
              {c.subject || c.tema || "Sem assunto"}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <DayNewsPreview dateKey={dateKey} />
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Tema/tag</label>
              <Input
                value={form.tema}
                onChange={(e) => setForm((prev) => ({ ...prev, tema: e.target.value }))}
                placeholder="promoção, resultado, novidade..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Referência de notícia</label>
              <Input
                value={form.newsReference}
                onChange={(e) => setForm((prev) => ({ ...prev, newsReference: e.target.value }))}
                placeholder="Cole um título/gancho da lista acima"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-secondary">Prompt do e-mail</label>
              <PromptPicker
                category="email"
                onSelect={(p) => setForm((prev) => ({ ...prev, prompt: p.content, promptId: p.id }))}
              />
            </div>
            <Textarea
              value={form.prompt}
              onChange={(e) => setForm((prev) => ({ ...prev, prompt: e.target.value, promptId: null }))}
              rows={4}
              placeholder="Descreva o objetivo do e-mail (ex: divulgar resultado da semana, convite pra live...)"
            />
          </div>

          {genError && <p className="text-sm text-danger">{genError}</p>}

          <Button type="button" onClick={handleGenerateEmail} disabled={generating} className="w-full">
            <Sparkles size={16} />
            {generating ? "Gerando e-mail..." : "Gerar assunto + corpo com IA"}
          </Button>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Assunto</label>
            <Input
              value={form.subject}
              onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="Assunto do e-mail"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Preview/preheader</label>
            <Input
              value={form.previewText}
              onChange={(e) => setForm((prev) => ({ ...prev, previewText: e.target.value }))}
              placeholder="Texto que aparece na prévia da caixa de entrada"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-secondary">Corpo do e-mail (HTML)</label>
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

          <div className="space-y-2 border-t border-border pt-3">
            <ImageGenerationPanel
              contextType="email"
              contextId={form.id}
              value={bannerUrl}
              onChange={setBannerUrl}
              label="Gerar banner de topo (opcional)"
              placeholder="Prompt para gerar um banner de topo"
              rows={2}
            />
            {bannerUrl && (
              <Button type="button" size="sm" onClick={handleInsertBanner}>
                Inserir no corpo do e-mail
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="w-40 space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Status</label>
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
              <p className="text-xs font-medium text-text-secondary">Preview</p>
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
              <p className="text-xs text-text-muted">Nenhuma campanha criada ainda.</p>
            ) : (
              <div className="max-h-96 space-y-1.5 overflow-y-auto">
                {campaigns.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => jumpToCampaign(c)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      c.id === form.id
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent hover:bg-card-hover"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-text-primary">{c.subject || c.tema || "Sem assunto"}</span>
                      <span className="text-[10px] text-text-muted">
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
