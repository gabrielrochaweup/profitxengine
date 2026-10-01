"use client";

import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useNivel } from "./nivel";

/**
 * Superfície de cartão. Solto na página é o cartão de sempre (nível 1);
 * dentro de um painel (Section) vira bloco interno no tom do fundo (nível 2),
 * pra não virar cartão-dentro-de-cartão da mesma cor.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const nivel = useNivel();
  return (
    <div
      className={cn(
        nivel === "painel" ? "rounded-xl border border-border bg-app" : "rounded-card bg-card shadow-card",
        className
      )}
      {...props}
    />
  );
}
