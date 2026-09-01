"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

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

  // Nada é salvo em lugar nenhum — a URL colada só ganha o parâmetro vazio
  // (e o marcador "pxevt=checkout" quando for link de checkout) grudado
  // nela mesma. É essa presença que o script de rastreamento (pixel.js,
  // já instalado no site) reconhece no clique pra saber que precisa
  // preencher com o identificador do visitante — sem precisar de cadastro,
  // classe CSS ou "opções avançadas" nenhuma. Dá pra gerar quantos links
  // diferentes precisar, sempre do mesmo jeito, sem limite.
  const readyLink = useMemo(() => {
    if (!url.trim()) return null;
    try {
      const u = new URL(url.trim());
      u.searchParams.set(paramName, "");
      if (fireCheckoutEvent) u.searchParams.set("pxevt", "checkout");
      else u.searchParams.delete("pxevt");
      return u.toString();
    } catch {
      return null;
    }
  }, [url, paramName, fireCheckoutEvent]);

  const snippet = useMemo(() => {
    if (!url.trim() || !readyLink) return null;
    const appendCall = fireCheckoutEvent
      ? `window.ProfitXTracking['${productSlug}'].appendRef(this.href, '${paramName}', 'checkout')`
      : paramName === "ref"
        ? `window.ProfitXTracking['${productSlug}'].appendRef(this.href)`
        : `window.ProfitXTracking['${productSlug}'].appendRef(this.href, '${paramName}')`;
    return `<a href="${url.trim()}" onclick="event.preventDefault(); window.location.href = ${appendCall};">
  Continuar
</a>`;
  }, [url, readyLink, productSlug, paramName, fireCheckoutEvent]);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copiado.");
  }

  return (
    <Card className="p-5">
      <h3 className="mb-1 text-sm font-medium text-text-primary">Gerador de link com identificador</h3>
      <p className="mb-4 text-xs text-text-secondary">
        Cole o link de destino (checkout, área de membros, cadastro na corretora...) e receba pronto o link que já leva
        o &quot;espaço&quot; pro identificador do visitante — sem precisar salvar nada aqui: pode gerar e usar quantos links
        diferentes quiser, é sempre só o link, sem cadastro. O <strong>nome do parâmetro muda por plataforma</strong>:
        corretora, área de membros e checkout genérico usam <code>ref</code>; Onprofit e Hotmart só devolvem{" "}
        <code>sck</code> no webhook, então esses precisam do parâmetro diferente. Colando um link da Onprofit ou
        Hotmart, o seletor abaixo já muda sozinho pra <code>sck</code> — mas confira antes de usar.
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

      {url.trim() && !readyLink && (
        <p className="mt-2 text-xs text-danger">Isso não parece um link válido (precisa começar com https://).</p>
      )}

      {readyLink && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-1 text-[11px] font-medium text-text-muted">
              Link pra usar — cola exatamente esse em qualquer botão do site (Elementor, Wix, HTML puro, tanto faz)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-input bg-input px-3 py-2 text-xs">
                {readyLink}
              </code>
              <Button size="sm" variant="secondary" onClick={() => copy(readyLink)}>
                Copiar
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              Repara que ele já carrega um &quot;{paramName}=&quot; vazio no final — o script de rastreamento (já instalado no
              site) preenche isso sozinho com o identificador de cada visitante no exato momento do clique. Não
              precisa voltar aqui de novo depois de copiar: gera e usa, sem limite de quantos links diferentes.
            </p>
          </div>

          <details className="text-xs text-text-secondary">
            <summary className="cursor-pointer text-[11px] font-medium text-text-muted">
              Alternativa: colar como código (se preferir montar o botão na mão)
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
    </Card>
  );
}
