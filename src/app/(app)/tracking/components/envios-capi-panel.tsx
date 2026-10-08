"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Send, XCircle } from "@/components/ui/icones";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Bloco, Vazio } from "./ui";

interface Envio {
  id: string;
  event_name: string;
  pixel_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  ok: boolean;
  events_received: number | null;
  fbtrace_id: string | null;
  erro: string | null;
  teste: boolean;
  enviado_em: string;
}

function quando(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return mesmoDia ? `Hoje ${hora}` : `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${hora}`;
}

function valor(e: Envio): string {
  if (e.amount_cents == null) return "—";
  const v = (e.amount_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: e.currency === "USD" ? "USD" : "BRL" });
  return v;
}

/**
 * Envios do servidor pra Meta (Purchase e Deposit) e o que ela respondeu.
 *
 * Esses dois eventos não passam pelo navegador, então o Pixel Helper não os
 * vê. Aqui cada envio mostra se a Meta aceitou ou recusou — e por quê.
 */
export function EnviosCapiPanel({ productId }: { productId: string }) {
  const toast = useToast();
  const [envios, setEnvios] = useState<Envio[] | null>(null);
  const [semMigration, setSemMigration] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [evento, setEvento] = useState<"Purchase" | "Deposit">("Purchase");
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const res = await fetch(`/api/tracking/capi-log?product_id=${productId}`).catch(() => null);
    const json = res ? await res.json().catch(() => null) : null;
    setEnvios(json?.envios ?? []);
    setSemMigration(!!json?.semMigration);
    setCarregando(false);
  }, [productId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function enviarTeste() {
    setEnviando(true);
    const res = await fetch("/api/tracking/capi-teste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, test_event_code: codigo, evento }),
    });
    const json = await res.json().catch(() => ({}));
    setEnviando(false);
    if (!res.ok) {
      toast.error(json.error ?? "Falha ao enviar o teste.");
      return;
    }
    if (json.ok) toast.success("A Meta aceitou o evento de teste. Veja na aba Testar eventos.");
    else toast.error(json.error ?? "A Meta recusou o evento.");
    carregar();
  }

  const recusados = (envios ?? []).filter((e) => !e.ok && !e.teste).length;

  return (
    <Bloco
      titulo="Envios pro servidor da Meta"
      dica={
        <Tooltip text="Purchase e Deposit saem do nosso servidor (API de Conversões) e não aparecem no Pixel Helper. Cada linha é um envio e o que a Meta respondeu: aceito, ou recusado com o motivo." />
      }
      descricao="O que o servidor mandou pra Meta e o que ela respondeu — a certeza que o Pixel Helper não dá."
      acoes={
        <Button size="sm" variant="secondary" onClick={carregar} disabled={carregando}>
          <RefreshCw size={13} className={carregando ? "animate-spin" : ""} />
          Atualizar
        </Button>
      }
    >
      {recusados > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-danger-soft px-3 py-2 text-[12px] text-text-secondary">
          <XCircle size={14} className="shrink-0 text-danger" />
          {recusados} {recusados === 1 ? "envio recusado" : "envios recusados"} nos últimos registros. Veja o motivo abaixo.
        </div>
      )}

      {semMigration ? (
        <Vazio>Falta rodar a migration 0127 no banco.</Vazio>
      ) : envios === null ? (
        <Vazio>Carregando…</Vazio>
      ) : envios.length === 0 ? (
        <Vazio icone={Send}>
          Nenhum envio ainda. Quando uma compra ou depósito chegar pelo webhook (com o evento ligado acima), ele aparece aqui.
        </Vazio>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-app">
          {envios.map((e) => (
            <li key={e.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-3.5 py-2.5">
              {e.ok ? (
                <CheckCircle2 size={16} className="text-ok" aria-label="Aceito pela Meta" />
              ) : (
                <XCircle size={16} className="text-danger" aria-label="Recusado" />
              )}
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="font-semibold text-text-primary">{e.event_name}</span>
                  <span className="tabular-nums text-text-secondary">{valor(e)}</span>
                  {e.teste && (
                    <span className="rounded-md bg-input px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary">teste</span>
                  )}
                </span>
                <span className={cn("block truncate text-[11px]", e.ok ? "text-text-muted" : "text-danger")} title={e.erro ?? undefined}>
                  {e.ok
                    ? `Meta recebeu ${e.events_received ?? 1} ${e.events_received === 1 || e.events_received == null ? "evento" : "eventos"}${e.fbtrace_id ? ` · ${e.fbtrace_id}` : ""}`
                    : (e.erro ?? "Recusado.")}
                </span>
              </span>
              <span className="text-right text-[11px] tabular-nums text-text-tertiary">{quando(e.enviado_em)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 rounded-xl border border-border bg-app p-3.5">
        <p className="text-[12px] font-medium text-text-primary">Enviar evento de teste</p>
        <p className="mt-0.5 text-[11px] text-text-tertiary">
          Abra a aba <span className="text-text-secondary">Testar eventos</span> do pixel no Gerenciador de Eventos (canal
          “Site”), copie o código <code className="font-mono">TEST…</code> e cole aqui. O evento aparece lá e não conta nas campanhas.
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="TEST12345"
            className="h-8 w-40 rounded-input bg-input px-2.5 font-mono text-[12px] text-text-primary outline-none placeholder:text-text-muted focus:shadow-[0_0_0_2px_var(--accent)]"
          />
          <Select value={evento} onChange={(e) => setEvento(e.target.value as "Purchase" | "Deposit")} className="h-8 w-32 text-xs">
            <option value="Purchase">Purchase</option>
            <option value="Deposit">Deposit</option>
          </Select>
          <Button size="sm" onClick={enviarTeste} disabled={enviando || !/^TEST[A-Za-z0-9]+$/.test(codigo.trim())}>
            <Send size={13} />
            {enviando ? "Enviando..." : "Enviar teste"}
          </Button>
        </div>
      </div>
    </Bloco>
  );
}
