"use client";

import { cn } from "@/lib/utils";
import { corDaPessoa, iniciais } from "../lib";

/** Avatar de iniciais: o app não guarda foto de usuário (ver lib.ts). */
export function Avatar({
  nome,
  id,
  tamanho = 28,
  className,
}: {
  nome: string;
  id: string;
  tamanho?: number;
  className?: string;
}) {
  const cor = corDaPessoa(id);
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-button font-semibold", className)}
      style={{
        width: tamanho,
        height: tamanho,
        fontSize: Math.max(9, Math.round(tamanho * 0.36)),
        backgroundColor: `color-mix(in srgb, ${cor} 18%, transparent)`,
        color: cor,
      }}
      aria-hidden
    >
      {iniciais(nome)}
    </span>
  );
}
