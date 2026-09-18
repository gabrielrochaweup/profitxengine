"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Bloco, Cartao } from "./ui";
import { UtmPresetsPanel } from "./utm-presets-panel";
import { CheckoutLinksPanel } from "./checkout-links-panel";

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

export function UtmBuilder({ productId }: { productId: string }) {
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

  const hasBase = fields.baseUrl.trim().length > 0;
  // Os IDs de campanha são de configuração de anúncio, não de quem monta um
  // link de bio: começam fechados. Se já tiverem valor, aparecem abertos —
  // campo preenchido escondido é pior do que campo a mais.
  const [avancadoAberto, setAvancadoAberto] = useState(false);
  const mostrarAvancado = avancadoAberto || !!fields.mcid || !!fields.gcid;

  return (
    <div className="space-y-6">
      <Bloco
        titulo="Gerador de UTMs"
        dica={
          <Tooltip
            text={
              "utm_source = de onde veio o clique (meta, google...). utm_medium = tipo de mídia (cpc, social...). " +
              "utm_campaign = nome da campanha, é o que aparece na aba Análises. utm_content/utm_term são opcionais. " +
              "mcid/gcid = ID real da campanha (Meta: {{campaign.id}}, Google: {campaignid}) — cruza com o gasto de anúncio assim que a conta estiver conectada."
            }
          />
        }
      >
        <p className="-mt-1 mb-3 text-[11px] text-text-tertiary">
          Preenche os campos e recebe o link pronto pra colar no anúncio.
        </p>

        <Cartao>
          {/* ── Destino ── */}
          <Campo label="Link da página de destino">
            <Input
              value={fields.baseUrl}
              onChange={(e) => set("baseUrl", e.target.value)}
              placeholder="https://escolaprofitx.com"
              className="h-8 text-xs"
            />
          </Campo>

          {/* ── Origem da campanha ──
              Os três que aparecem no relatório. Larguras diferentes porque o
              conteúdo é diferente: "meta" e "cpc" são palavras curtas, o nome
              da campanha não. */}
          <Grupo titulo="Origem da campanha">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <Campo className="sm:col-span-3" label="utm_source" hint="(de onde veio o clique)">
                <Input
                  value={fields.source}
                  onChange={(e) => set("source", e.target.value)}
                  placeholder="meta"
                  className="h-8 text-xs"
                />
              </Campo>
              <Campo className="sm:col-span-3" label="utm_medium" hint="(tipo de mídia)">
                <Input
                  value={fields.medium}
                  onChange={(e) => set("medium", e.target.value)}
                  placeholder="cpc"
                  className="h-8 text-xs"
                />
              </Campo>
              <Campo className="sm:col-span-6" label="utm_campaign" hint="(aparece nos relatórios)">
                <Input
                  value={fields.campaign}
                  onChange={(e) => set("campaign", e.target.value)}
                  placeholder="lancamento_setembro"
                  className="h-8 text-xs"
                />
              </Campo>
            </div>
          </Grupo>

          {/* ── Detalhes opcionais ── */}
          <Grupo titulo="Detalhes opcionais">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <Campo className="sm:col-span-6" label="utm_content" hint="(qual criativo)">
                <Input
                  value={fields.content}
                  onChange={(e) => set("content", e.target.value)}
                  placeholder="video_1"
                  className="h-8 text-xs"
                />
              </Campo>
              <Campo className="sm:col-span-6" label="utm_term" hint="(palavra-chave)">
                <Input
                  value={fields.term}
                  onChange={(e) => set("term", e.target.value)}
                  placeholder="trading-para-iniciantes"
                  className="h-8 text-xs"
                />
              </Campo>
            </div>
          </Grupo>

          {/* ── IDs avançados ── */}
          <div className="mt-4 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setAvancadoAberto((v) => !v)}
              className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-text-tertiary transition-colors hover:text-text-primary"
            >
              <ChevronDown size={13} className={cn("transition-transform", mostrarAvancado && "rotate-180")} />
              IDs de campanha (avançado)
            </button>

            {mostrarAvancado && (
              <div className="mt-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-6">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label className="text-[11px] font-medium text-text-secondary">mcid (Meta Ads)</label>
                      <button
                        type="button"
                        onClick={() => set("mcid", "{{campaign.id}}")}
                        className="text-[11px] text-accent-text hover:underline"
                      >
                        usar {"{{campaign.id}}"}
                      </button>
                    </div>
                    <Input
                      value={fields.mcid}
                      onChange={(e) => set("mcid", e.target.value)}
                      placeholder="{{campaign.id}}"
                      className="h-8 font-mono text-[11px]"
                    />
                  </div>
                  <div className="sm:col-span-6">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label className="text-[11px] font-medium text-text-secondary">gcid (Google Ads)</label>
                      <button
                        type="button"
                        onClick={() => set("gcid", "{campaignid}")}
                        className="text-[11px] text-accent-text hover:underline"
                      >
                        usar {"{campaignid}"}
                      </button>
                    </div>
                    <Input
                      value={fields.gcid}
                      onChange={(e) => set("gcid", e.target.value)}
                      placeholder="{campaignid}"
                      className="h-8 font-mono text-[11px]"
                    />
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-text-muted">
                  Só funciona no modelo de URL do próprio anúncio.
                </p>
              </div>
            )}
          </div>

          {hasBase && error && <p className="mt-3 text-xs text-danger">{error}</p>}

          {/* O link pronto é a saída da ferramenta: fica no fim, separado por
              fio, com a ação de copiar colada nele. */}
          {url && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-1.5 text-[11px] font-medium text-text-tertiary">Link pronto</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-input border border-border bg-input px-3 py-2 font-mono text-[11px] text-text-primary">
                  {url}
                </code>
                <Button size="sm" onClick={copy}>
                  Copiar
                </Button>
              </div>
            </div>
          )}
        </Cartao>
      </Bloco>

      <CheckoutLinksPanel
        productId={productId}
        atual={fields.baseUrl}
        onUsar={(url) => setFields((prev) => ({ ...prev, baseUrl: url }))}
      />

      <UtmPresetsPanel
        productId={productId}
        atual={{ source: fields.source, medium: fields.medium, campaign: fields.campaign, content: fields.content }}
        onUsar={(v) =>
          setFields((prev) => ({
            ...prev,
            source: v.source,
            medium: v.medium,
            campaign: v.campaign || prev.campaign,
            content: v.content || prev.content,
          }))
        }
      />
    </div>
  );
}

/** Rótulo + controle, no mesmo desenho do resto do módulo. */
function Campo({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[11px] font-medium text-text-secondary">
        {label}
        {hint && <span className="ml-1 font-normal text-text-tertiary">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

/** Conjunto de campos com um assunto: fio em cima, título pequeno, campos. */
function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t border-border pt-3">
      <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{titulo}</p>
      {children}
    </div>
  );
}
