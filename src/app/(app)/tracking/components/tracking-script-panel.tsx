"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

// O produto vem de "vem de múltiplos sites" — em vez de eu colar o script
// inline em cada HTML, o script fica hospedado (src/app/api/tracking/pixel.js)
// e qualquer site cola essa mesma tag, trocando só o data-product.
export function TrackingScriptPanel({ productSlug }: { productSlug: string }) {
  const toast = useToast();
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  const snippet = `<script src="${origin}/api/tracking/pixel.js" data-product="${productSlug}" async></script>`;

  function copy() {
    navigator.clipboard.writeText(snippet);
    toast.success("Script copiado.");
  }

  return (
    <Card className="p-5">
      <h3 className="mb-1 text-base font-semibold text-text-primary">Script de rastreamento</h3>
      <p className="mb-3 text-xs text-text-secondary">
        Cole em qualquer site que gere tráfego pra esse produto, antes do <code>&lt;/body&gt;</code>.
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-input bg-accent-soft px-3 py-2 text-xs">
          {snippet}
        </code>
        <Button size="sm" variant="secondary" onClick={copy}>
          Copiar
        </Button>
      </div>
    </Card>
  );
}
