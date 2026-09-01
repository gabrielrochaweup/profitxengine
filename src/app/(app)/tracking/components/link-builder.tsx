"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const EXAMPLE_LEAD_ID = "3f2a9c10-7b4e-4a1d-9c3f-a1b2c3d4e5f6";

const PARAM_OPTIONS = [
  { value: "ref", label: "ref — corretora, área de membros, checkout genérico" },
  { value: "sck", label: "sck — Onprofit, Hotmart" },
];

// Domínios de checkout que só devolvem "sck" no webhook (não um "ref"
// custom) — ver src/lib/tracking/checkout-adapters/onprofit.ts e hotmart.ts.
// Detecta pelo link colado e já pré-seleciona o parâmetro certo.
const SCK_HOSTS = ["onprofit.com.br", "hotmart.com"];

function guessParamName(url: string): "ref" | "sck" | null {
  try {
    const host = new URL(url).hostname;
    return SCK_HOSTS.some((h) => host.endsWith(h)) ? "sck" : null;
  } catch {
    return null;
  }
}

export function LinkBuilder({ productSlug }: { productSlug: string }) {
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [paramName, setParamName] = useState("ref");
  const [paramTouched, setParamTouched] = useState(false);
  const [fireCheckoutEvent, setFireCheckoutEvent] = useState(false);

  function handleUrlChange(value: string) {
    setUrl(value);
    if (!paramTouched) {
      const guess = guessParamName(value);
      if (guess) {
        setParamName(guess);
        setFireCheckoutEvent(true);
      }
    }
  }

  const preview = useMemo(() => {
    if (!url.trim()) return null;
    try {
      const u = new URL(url.trim());
      u.searchParams.set(paramName, EXAMPLE_LEAD_ID);
      return u.toString();
    } catch {
      return null;
    }
  }, [url, paramName]);

  const snippet = useMemo(() => {
    if (!url.trim() || !preview) return null;
    const appendCall = fireCheckoutEvent
      ? `window.ProfitXTracking['${productSlug}'].appendRef(this.href, '${paramName}', 'checkout')`
      : paramName === "ref"
        ? `window.ProfitXTracking['${productSlug}'].appendRef(this.href)`
        : `window.ProfitXTracking['${productSlug}'].appendRef(this.href, '${paramName}')`;
    return `<a href="${url.trim()}" onclick="event.preventDefault(); window.location.href = ${appendCall};">
  Continuar
</a>`;
  }, [url, preview, productSlug, paramName, fireCheckoutEvent]);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copiado.");
  }

  return (
    <Card className="p-5">
      <h3 className="mb-1 text-sm font-medium text-text-primary">Gerador de link com identificador</h3>
      <p className="mb-4 text-xs text-text-secondary">
        Cole o link de destino (checkout, área de membros, cadastro na corretora...) e receba pronto o botão que leva o
        identificador do visitante junto — sem precisar montar isso na mão. O <strong>nome do parâmetro muda por
        plataforma</strong>: corretora, área de membros e checkout genérico usam <code>ref</code>; Onprofit e Hotmart só
        devolvem <code>sck</code> no webhook, então esses precisam do parâmetro diferente. Colando um link da Onprofit
        ou Hotmart, o seletor abaixo já muda sozinho pra <code>sck</code> — mas confira antes de copiar.
      </p>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-muted">Link de destino</label>
          <Input value={url} onChange={(e) => handleUrlChange(e.target.value)} placeholder="https://corretora.com/cadastro" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-muted">Parâmetro</label>
          <Select
            value={paramName}
            onChange={(e) => {
              setParamTouched(true);
              setParamName(e.target.value);
            }}
            className="sm:w-64"
          >
            {PARAM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <label className="mt-3 flex w-fit items-center gap-2 text-xs text-text-secondary">
        <input
          type="checkbox"
          checked={fireCheckoutEvent}
          onChange={(e) => setFireCheckoutEvent(e.target.checked)}
          className="h-3.5 w-3.5 accent-accent"
        />
        É um link de checkout — disparar InitiateCheckout (Meta/Google) no clique
      </label>

      {url.trim() && !preview && (
        <p className="mt-2 text-xs text-danger">Isso não parece um link válido (precisa começar com https://).</p>
      )}

      {preview && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-1 text-[11px] font-medium text-text-muted">
              Código pronto pra colar no site — funciona sozinho, pega o lead_id certo de cada visitante na hora do
              clique
            </p>
            <div className="flex items-start gap-2">
              <pre className="flex-1 overflow-x-auto whitespace-pre rounded-input bg-input px-3 py-2 text-xs">
                {snippet}
              </pre>
              <Button size="sm" variant="secondary" onClick={() => snippet && copy(snippet)}>
                Copiar
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              Só funciona numa página que já carrega o script de rastreamento (o mesmo da seção abaixo) — se for colar
              na área de membros, o script precisa estar instalado lá também.
            </p>
          </div>

          <div className="rounded-panel bg-input/60 p-3">
            <p className="mb-2 text-[11px] font-medium text-text-muted">
              Sem código (Elementor, Wix e outros builders que só aceitam colar uma URL no botão)
            </p>
            <div className="space-y-2 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-text-muted">1. Cola esse link puro no campo de link do botão:</span>
                <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-input bg-input px-2 py-1.5 text-xs">
                  {url.trim()}
                </code>
                <Button size="sm" variant="secondary" onClick={() => copy(url.trim())}>
                  Copiar
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-text-muted">
                  2. Nas opções avançadas do botão, adiciona essa Classe CSS:
                </span>
                <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-input bg-input px-2 py-1.5 text-xs">
                  {fireCheckoutEvent ? "profitx-checkout" : "profitx-ref"}
                </code>
                <Button size="sm" variant="secondary" onClick={() => copy(fireCheckoutEvent ? "profitx-checkout" : "profitx-ref")}>
                  Copiar
                </Button>
              </div>
              <p className="text-[11px] text-text-muted">
                Pronto — o script já reconhece qualquer botão com essa classe e faz tudo sozinho no clique (identificador +
                {fireCheckoutEvent ? " InitiateCheckout" : " sem disparar checkout"}), sem precisar mexer no link nem colar código nenhum.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
