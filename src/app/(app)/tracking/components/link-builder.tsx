"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const EXAMPLE_LEAD_ID = "3f2a9c10-7b4e-4a1d-9c3f-a1b2c3d4e5f6";

export function LinkBuilder({ productSlug }: { productSlug: string }) {
  const toast = useToast();
  const [url, setUrl] = useState("");

  const preview = useMemo(() => {
    if (!url.trim()) return null;
    try {
      const u = new URL(url.trim());
      u.searchParams.set("ref", EXAMPLE_LEAD_ID);
      return u.toString();
    } catch {
      return null;
    }
  }, [url]);

  const snippet = useMemo(() => {
    if (!url.trim() || !preview) return null;
    return `<a href="${url.trim()}" onclick="event.preventDefault(); window.location.href = window.ProfitXTracking['${productSlug}'].appendRef(this.href);">
  Continuar
</a>`;
  }, [url, preview, productSlug]);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copiado.");
  }

  return (
    <Card className="p-5">
      <h3 className="mb-1 text-sm font-medium text-text-primary">Gerador de link com ref</h3>
      <p className="mb-4 text-xs text-text-secondary">
        Cole o link de destino (checkout, área de membros, cadastro na corretora...) e receba pronto o botão que leva o
        identificador do visitante junto — sem precisar montar isso na mão.
      </p>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-text-muted">Link de destino</label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://corretora.com/cadastro"
        />
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
