"use client";

import { Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";
import type { Pessoa, Presenca } from "../lib";

/**
 * Painel de membros.
 *
 * Os três estados são separados de propósito (e não somados): quem está na
 * chamada, quem está online, quem não está. Uma pessoa online lendo esta
 * sala aparece em ONLINE com a marca de que está aqui — estar na sala não é
 * estar na chamada.
 */
export function Membros({
  pessoas,
  presencas,
  salaId,
  meuId,
}: {
  pessoas: Pessoa[];
  presencas: Presenca[];
  salaId: string | null;
  meuId: string;
}) {
  const porId = new Map(presencas.map((p) => [p.user_id, p]));

  // Na chamada DESTA sala: quem está na chamada da #Geral enquanto lê esta
  // aqui aparece como online, não como se estivesse falando nesta sala.
  const naChamada = pessoas.filter((p) => porId.get(p.id)?.sala_chamada === salaId);
  const online = pessoas.filter((p) => porId.has(p.id) && !naChamada.some((c) => c.id === p.id));
  const offline = pessoas.filter((p) => !porId.has(p.id));

  return (
    <div className="flex h-full flex-col overflow-y-auto px-3 py-2">
      <Grupo titulo="Na chamada" total={naChamada.length}>
        {naChamada.map((p) => (
          <Linha key={p.id} pessoa={p} meuId={meuId} tom="chamada" aqui={porId.get(p.id)?.sala_id === salaId} />
        ))}
      </Grupo>

      <Grupo titulo="Online" total={online.length}>
        {online.map((p) => (
          <Linha key={p.id} pessoa={p} meuId={meuId} tom="online" aqui={porId.get(p.id)?.sala_id === salaId} />
        ))}
      </Grupo>

      <Grupo titulo="Offline" total={offline.length}>
        {offline.map((p) => (
          <Linha key={p.id} pessoa={p} meuId={meuId} tom="offline" aqui={false} />
        ))}
      </Grupo>
    </div>
  );
}

function Grupo({ titulo, total, children }: { titulo: string; total: number; children: React.ReactNode }) {
  if (total === 0) return null;
  return (
    <div className="mb-4">
      <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
        {titulo} — {total}
      </p>
      {children}
    </div>
  );
}

function Linha({
  pessoa,
  meuId,
  tom,
  aqui,
}: {
  pessoa: Pessoa;
  meuId: string;
  tom: "chamada" | "online" | "offline";
  aqui: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2 rounded-button px-1 py-1", tom === "offline" && "opacity-60")}>
      <span className="relative">
        <Avatar nome={pessoa.nome} id={pessoa.id} tamanho={24} />
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-card",
            tom === "chamada" ? "bg-accent" : tom === "online" ? "bg-success" : "bg-text-muted"
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] text-text-secondary">
          {pessoa.nome}
          {pessoa.id === meuId && <span className="ml-1 text-[10px] text-text-tertiary">(você)</span>}
        </span>
        {aqui && tom !== "chamada" && <span className="block text-[10px] text-text-tertiary">vendo esta sala</span>}
      </span>
      {tom === "chamada" && <Headphones size={12} className="shrink-0 text-accent-text" />}
    </div>
  );
}
