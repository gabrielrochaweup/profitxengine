"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** A Comunidade avisa que leu — o menu escuta e recontabiliza na hora. */
export const EVENTO_LIDA = "comunidade:lida";

/**
 * Quantas mensagens novas esperam na Comunidade, no menu.
 *
 * Conta no servidor (uma RPC que já respeita as salas que a pessoa pode ver)
 * e recontabiliza quando chega mensagem nova, quando a janela volta ao foco
 * ou quando a própria Comunidade avisa que marcou algo como lido.
 *
 * O socket é o mesmo do resto do app: o client do Supabase é singleton, então
 * isto não abre uma segunda conexão por causa de um número.
 */
export function BadgeComunidade({ className }: { className?: string }) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let vivo = true;

    async function contar() {
      const { data } = await supabase.rpc("community_nao_lidas");
      if (!vivo) return;
      setTotal((data ?? []).reduce((soma, linha) => soma + Number(linha.nao_lidas), 0));
    }

    contar();

    const canal = supabase
      .channel("comunidade:badge")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_messages" }, () => contar())
      .subscribe();

    window.addEventListener("focus", contar);
    window.addEventListener(EVENTO_LIDA, contar);

    return () => {
      vivo = false;
      supabase.removeChannel(canal);
      window.removeEventListener("focus", contar);
      window.removeEventListener(EVENTO_LIDA, contar);
    };
  }, []);

  if (total === 0) return null;

  return (
    <span
      className={cn(
        "shrink-0 rounded-full bg-accent px-1.5 text-[10px] font-semibold tabular-nums leading-[18px] text-accent-contrast",
        className
      )}
    >
      {total > 99 ? "99+" : total}
    </span>
  );
}
