"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Preset {
  label: string;
  source: string;
  medium: string;
}

const PRESETS: Preset[] = [
  { label: "Meta Ads", source: "meta", medium: "cpc" },
  { label: "Google Ads", source: "google", medium: "cpc" },
  { label: "Instagram orgânico", source: "instagram", medium: "social" },
  { label: "WhatsApp", source: "whatsapp", medium: "referral" },
  { label: "E-mail", source: "email", medium: "email" },
];

const EMPTY = {
  baseUrl: "",
  source: "",
  medium: "",
  campaign: "",
  content: "",
  term: "",
  mcid: "",
  gcid: "",
};

export function UtmBuilder() {
  const toast = useToast();
  const [fields, setFields] = useState(EMPTY);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  const { url, error } = useMemo(() => {
    if (!fields.baseUrl.trim()) return { url: null, error: null };
    try {
      const u = new URL(fields.baseUrl.trim());
      const params: [string, string][] = [
        ["utm_source", fields.source],
        ["utm_medium", fields.medium],
        ["utm_campaign", fields.campaign],
        ["utm_content", fields.content],
        ["utm_term", fields.term],
        ["mcid", fields.mcid],
        ["gcid", fields.gcid],
      ];
      for (const [key, value] of params) {
        if (value.trim()) u.searchParams.set(key, value.trim());
      }
      return { url: u.toString(), error: null };
    } catch {
      return { url: null, error: "Isso não parece um link válido (precisa começar com https://)." };
    }
  }, [fields]);

  function copy() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado.");
  }

  function applyPreset(preset: Preset) {
    setFields((prev) => ({ ...prev, source: preset.source, medium: preset.medium }));
  }

  const hasBase = fields.baseUrl.trim().length > 0;

  return (
    <Card className="p-5">
      <h3 className="mb-1 text-sm font-medium text-text-primary">Gerador de UTMs</h3>
      <p className="mb-4 text-xs text-text-secondary">
        Preenche os campos e recebe o link pronto pra colar no anúncio — sem montar a URL na mão.{" "}
        <code>utm_source</code>/<code>utm_campaign</code> são o que aparece na aba Análises;{" "}
        <code>mcid</code>/<code>gcid</code> são opcionais, mas recomendados: permitem cruzar com o gasto de anúncio
        assim que a conta Meta/Google estiver conectada.
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-muted">Link da página de destino</label>
          <Input
            value={fields.baseUrl}
            onChange={(e) => set("baseUrl", e.target.value)}
            placeholder="https://escolaprofitx.com"
          />
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-medium text-text-muted">Atalhos</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  "rounded-button px-2.5 py-1 text-[11px] font-medium transition-colors",
                  fields.source === preset.source && fields.medium === preset.medium
                    ? "bg-accent text-white"
                    : "bg-card-hover text-text-secondary hover:text-text-primary"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-muted">
              utm_source <span className="text-text-muted/70">(de onde veio o clique)</span>
            </label>
            <Input value={fields.source} onChange={(e) => set("source", e.target.value)} placeholder="meta" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-muted">
              utm_medium <span className="text-text-muted/70">(tipo de mídia)</span>
            </label>
            <Input value={fields.medium} onChange={(e) => set("medium", e.target.value)} placeholder="cpc" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-medium text-text-muted">
              utm_campaign <span className="text-text-muted/70">(nome da campanha — aparece nos relatórios)</span>
            </label>
            <Input
              value={fields.campaign}
              onChange={(e) => set("campaign", e.target.value)}
              placeholder="lancamento_setembro"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-muted">
              utm_content <span className="text-text-muted/70">(opcional — qual criativo)</span>
            </label>
            <Input value={fields.content} onChange={(e) => set("content", e.target.value)} placeholder="video_1" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-muted">
              utm_term <span className="text-text-muted/70">(opcional — palavra-chave)</span>
            </label>
            <Input
              value={fields.term}
              onChange={(e) => set("term", e.target.value)}
              placeholder="trading-para-iniciantes"
            />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-medium text-text-muted">
            ID de campanha <span className="text-text-muted/70">(opcional, avançado)</span>
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[11px] text-text-muted">mcid (Meta Ads)</label>
                <button
                  type="button"
                  onClick={() => set("mcid", "{{campaign.id}}")}
                  className="text-[11px] text-accent hover:underline"
                >
                  usar {"{{campaign.id}}"}
                </button>
              </div>
              <Input value={fields.mcid} onChange={(e) => set("mcid", e.target.value)} placeholder="{{campaign.id}}" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[11px] text-text-muted">gcid (Google Ads)</label>
                <button
                  type="button"
                  onClick={() => set("gcid", "{campaignid}")}
                  className="text-[11px] text-accent hover:underline"
                >
                  usar {"{campaignid}"}
                </button>
              </div>
              <Input value={fields.gcid} onChange={(e) => set("gcid", e.target.value)} placeholder="{campaignid}" />
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-text-muted">
            Esses dois só funcionam colados no modelo de URL de rastreamento do próprio anúncio (Meta/Google
            substituem pelo ID real a cada clique) — não dá pra testar o valor final aqui.
          </p>
        </div>

        {hasBase && error && <p className="text-xs text-danger">{error}</p>}

        {url && (
          <div>
            <p className="mb-1 text-[11px] font-medium text-text-muted">Link pronto</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-input bg-input px-3 py-2 text-xs">
                {url}
              </code>
              <Button size="sm" variant="secondary" onClick={copy}>
                Copiar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
