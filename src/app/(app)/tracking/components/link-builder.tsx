"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
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

type SaveState = "idle" | "saving" | "saved" | "error";

interface LinkRule {
  id: string;
  raw_url: string;
  param_name: string;
  fire_checkout: boolean;
  created_at: string;
}

export function LinkBuilder({ productSlug }: { productSlug: string }) {
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [paramName, setParamName] = useState("ref");
  const [paramTouched, setParamTouched] = useState(false);
  const [fireCheckoutEvent, setFireCheckoutEvent] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [rules, setRules] = useState<LinkRule[]>([]);

  const loadRules = useCallback(() => {
    fetch(`/api/tracking/link-rules?product_slug=${encodeURIComponent(productSlug)}`)
      .then((r) => r.json())
      .then((data) => setRules(data.rules ?? []))
      .catch(() => {});
  }, [productSlug]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

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

  function resetForm() {
    setUrl("");
    setParamName("ref");
    setParamTouched(false);
    setFireCheckoutEvent(false);
    setSaveState("idle");
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

  // Registra o link puro como "regra" no banco — é isso que permite colar
  // só a URL, sem código nem classe CSS, em qualquer botão de qualquer
  // builder: o pixel.js já instalado no site busca essa lista e reconhece
  // o clique sozinho (ver /api/tracking/pixel-config e /api/tracking/pixel.js).
  // Cada URL diferente colada aqui vira uma regra independente — não tem
  // limite de quantos links registrar, um por oferta/botão que precisar.
  useEffect(() => {
    if (!preview) {
      setSaveState("idle");
      return;
    }
    setSaveState("saving");
    const timeout = setTimeout(() => {
      fetch("/api/tracking/link-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_slug: productSlug,
          url: url.trim(),
          param_name: paramName,
          fire_checkout: fireCheckoutEvent,
        }),
      })
        .then((r) => {
          if (r.ok) {
            setSaveState("saved");
            loadRules();
          } else {
            setSaveState("error");
          }
        })
        .catch(() => setSaveState("error"));
    }, 600);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, paramName, fireCheckoutEvent, productSlug]);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copiado.");
  }

  function deleteRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    fetch(`/api/tracking/link-rules/${id}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <Card className="p-5">
      <h3 className="mb-1 text-sm font-medium text-text-primary">Gerador de link com identificador</h3>
      <p className="mb-4 text-xs text-text-secondary">
        Cole o link de destino (checkout, área de membros, cadastro na corretora...) e receba pronto o link que já leva
        o identificador do visitante junto — sem precisar montar isso na mão. Pode colar quantos links diferentes
        precisar aqui, um de cada vez — cada um vira um registro independente na lista abaixo. O <strong>nome do
        parâmetro muda por plataforma</strong>: corretora, área de membros e checkout genérico usam <code>ref</code>;
        Onprofit e Hotmart só devolvem <code>sck</code> no webhook, então esses precisam do parâmetro diferente.
        Colando um link da Onprofit ou Hotmart, o seletor abaixo já muda sozinho pra <code>sck</code> — mas confira
        antes de usar.
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
            <div className="flex items-center justify-between">
              <p className="mb-1 text-[11px] font-medium text-text-muted">
                Link pra usar — cola exatamente esse, sem mudar nada, em qualquer botão do site (Elementor, Wix, HTML
                puro, tanto faz)
              </p>
              {saveState === "saved" && (
                <button type="button" onClick={resetForm} className="text-[11px] font-medium text-accent hover:underline">
                  + Registrar outro link
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-input bg-input px-3 py-2 text-xs">
                {url.trim()}
              </code>
              <Button size="sm" variant="secondary" onClick={() => copy(url.trim())}>
                Copiar
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              {saveState === "saving" && "Registrando esse link..."}
              {saveState === "saved" &&
                "Registrado ✓ — o site (com o script de rastreamento instalado) já reconhece esse link sozinho no clique e cuida do resto."}
              {saveState === "error" && "Não consegui registrar agora — tenta de novo em alguns segundos."}
            </p>
          </div>

          <details className="text-xs text-text-secondary">
            <summary className="cursor-pointer text-[11px] font-medium text-text-muted">
              Alternativa: colar como código (se preferir não depender do reconhecimento automático)
            </summary>
            <div className="mt-2 flex items-start gap-2">
              <pre className="flex-1 overflow-x-auto whitespace-pre rounded-input bg-input px-3 py-2 text-xs">
                {snippet}
              </pre>
              <Button size="sm" variant="secondary" onClick={() => snippet && copy(snippet)}>
                Copiar
              </Button>
            </div>
          </details>
        </div>
      )}

      {rules.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-medium text-text-muted">
            Links registrados nesse produto ({rules.length}) — todos já funcionam automático, em qualquer botão que
            usar exatamente eles
          </p>
          <div className="space-y-1.5">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-2 rounded-input bg-input px-3 py-2">
                <code className="flex-1 overflow-x-auto whitespace-nowrap text-xs text-text-secondary">{rule.raw_url}</code>
                <span className="shrink-0 text-[10px] font-medium uppercase text-text-muted">
                  {rule.param_name}
                  {rule.fire_checkout ? " · checkout" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => deleteRule(rule.id)}
                  title="Remover"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-card-hover hover:text-text-primary"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
