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

  function handleUrlChange(value: string) {
    setUrl(value);
    if (!paramTouched) {
      const guess = guessParamName(value);
      if (guess) setParamName(guess);
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
    const appendCall =
      paramName === "ref"
        ? `window.ProfitXTracking['${productSlug}'].appendRef(this.href)`
        : `window.ProfitXTracking['${productSlug}'].appendRef(this.href, '${paramName}')`;
    return `<a href="${url.trim()}" onclick="event.preventDefault(); window.location.href = ${appendCall};">
  Continuar
</a>`;
  }, [url, preview, productSlug, paramName]);

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

      {url.trim() && !preview && (
        <p className="mt-2 text-xs text-danger">Isso não parece um link válido (precisa começar com https://).</p>
      )}

      {preview && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-1 text-[11px] font-medium text-text-muted">
              Como fica pra cada visitante (exemplo com um lead_id de mentira, só pra mostrar o formato)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-input bg-input px-3 py-2 text-xs">
                {preview}
              </code>
              <Button size="sm" variant="secondary" onClick={() => copy(preview)}>
                Copiar
              </Button>
            </div>
          </div>

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
        </div>
      )}
    </Card>
  );
}
