"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Bloco, Cartao } from "./ui";

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
    <Bloco titulo="Script de rastreamento">
      <p className="-mt-1 mb-3 text-[11px] text-text-tertiary">
        Cole em qualquer site que gere tráfego pra esse produto, antes do{" "}
        <code className="font-mono text-text-secondary">&lt;/body&gt;</code>.
      </p>
      {/* Bloco de código com a ação colada nele: o botão de copiar é o que a
          pessoa veio fazer aqui. */}
      <Cartao className="flex items-center gap-2 p-2">
        <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-input bg-input px-3 py-2 font-mono text-[11px] text-text-primary">
          {snippet}
        </code>
        <Button size="sm" onClick={copy}>
          Copiar
        </Button>
      </Cartao>
    </Bloco>
  );
}
