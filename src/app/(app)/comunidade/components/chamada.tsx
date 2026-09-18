"use client";

import { Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "./avatar";
import type { Pessoa, Presenca } from "../lib";

/**
 * A chamada da sala.
 *
 * A regra que manda aqui: abrir a sala NÃO entra na chamada. Este bloco só
 * mostra o que está acontecendo e oferece o botão; nada de áudio começa sem
 * alguém clicar — e, portanto, nenhuma permissão de microfone é pedida ao
 * abrir a sala.
 *
 * O transporte de áudio/vídeo ainda não está ligado: ele precisa de um SFU
 * (servidor que recebe uma cópia do áudio de cada pessoa e reencaminha).
 * Malha ponto-a-ponto entre todos, que seria o atalho, faz cada participante
 * enviar N-1 cópias do próprio áudio — com seis pessoas numa sala já é
 * upload demais pra conexão doméstica, e é justamente o que o pedido dizia
 * pra não fazer. Enquanto o provedor não é escolhido e tem credencial, o
 * botão fica desabilitado dizendo a verdade, em vez de abrir uma chamada
 * onde ninguém se ouve.
 */
export function Chamada({
  disponivel,
  naChamada,
  pessoas,
  presencas,
  salaId,
  onEntrar,
}: {
  disponivel: boolean;
  naChamada: boolean;
  pessoas: Map<string, Pessoa>;
  presencas: Presenca[];
  salaId: string;
  onEntrar: () => void;
}) {
  const participantes = presencas.filter((p) => p.na_chamada && p.sala_id === salaId);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-card-hover/40 px-4 py-2">
      <Headphones size={14} className="shrink-0 text-text-tertiary" />

      {participantes.length === 0 ? (
        <span className="text-[12px] text-text-tertiary">Ninguém está na chamada.</span>
      ) : (
        <>
          <span className="text-[12px] text-text-secondary">
            <span className="font-semibold text-text-primary">{participantes.length}</span>{" "}
            {participantes.length === 1 ? "participante" : "participantes"}
          </span>
          <div className="flex -space-x-1.5">
            {participantes.slice(0, 6).map((p) => {
              const pessoa = pessoas.get(p.user_id);
              return (
                <span key={p.user_id} className="rounded-button ring-2 ring-card" title={pessoa?.nome}>
                  <Avatar nome={pessoa?.nome ?? "?"} id={p.user_id} tamanho={22} />
                </span>
              );
            })}
          </div>
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        {!disponivel && (
          <span className="text-[11px] text-text-muted">
            Voz e vídeo entram quando o provedor de chamadas estiver conectado.
          </span>
        )}
        <Button size="sm" variant="secondary" onClick={onEntrar} disabled={!disponivel}>
          {naChamada ? "Sair da chamada" : "Entrar na chamada"}
        </Button>
      </div>
    </div>
  );
}
