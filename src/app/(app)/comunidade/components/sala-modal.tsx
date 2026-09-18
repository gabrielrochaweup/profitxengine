"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";
import type { Pessoa, Sala } from "../lib";

export interface DadosSala {
  nome: string;
  descricao: string;
  icone: string;
  privada: boolean;
  membros: string[];
}

/**
 * Criar ou editar sala.
 *
 * Membros só aparecem quando a sala é privada: numa sala pública a lista não
 * decide nada (todo mundo entra), e mostrá-la ali sugeriria o contrário.
 */
export function SalaModal({
  aberto,
  sala,
  pessoas,
  meuId,
  membrosAtuais,
  salvando,
  onFechar,
  onSalvar,
  onExcluir,
}: {
  aberto: boolean;
  sala: Sala | null;
  pessoas: Pessoa[];
  meuId: string;
  membrosAtuais: string[];
  salvando: boolean;
  onFechar: () => void;
  onSalvar: (dados: DadosSala) => void;
  onExcluir?: () => void;
}) {
  const [nome, setNome] = useState(sala?.nome ?? "");
  const [descricao, setDescricao] = useState(sala?.descricao ?? "");
  const [icone, setIcone] = useState(sala?.icone ?? "");
  const [privada, setPrivada] = useState(sala?.privada ?? false);
  const [membros, setMembros] = useState<string[]>(membrosAtuais);

  function alternar(id: string) {
    setMembros((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  return (
    <Modal open={aberto} onClose={onFechar} title={sala ? `Editar ${sala.nome}` : "Criar sala"}>
      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_72px] gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-text-secondary">Nome</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Tráfego Pago" autoFocus />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-text-secondary">Ícone</label>
            <Input
              value={icone}
              onChange={(e) => setIcone(e.target.value.slice(0, 2))}
              placeholder="🎯"
              className="text-center"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-text-secondary">
            Descrição <span className="font-normal text-text-tertiary">(opcional)</span>
          </label>
          <Textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            placeholder="Do que se fala aqui."
          />
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-medium text-text-secondary">Quem entra</p>
          <div className="grid grid-cols-2 gap-2">
            <Opcao
              ativa={!privada}
              titulo="Pública"
              descricao="Qualquer pessoa do app vê e participa."
              onClick={() => setPrivada(false)}
            />
            <Opcao
              ativa={privada}
              titulo="Privada"
              descricao="Só quem você escolher."
              onClick={() => setPrivada(true)}
            />
          </div>
        </div>

        {privada && (
          <div>
            <p className="mb-1.5 text-[11px] font-medium text-text-secondary">
              Membros <span className="font-normal text-text-tertiary">({membros.length} escolhidos)</span>
            </p>
            <div className="max-h-48 space-y-0.5 overflow-y-auto rounded-input border border-border p-1">
              {pessoas
                .filter((p) => p.id !== meuId)
                .map((p) => {
                  const dentro = membros.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => alternar(p.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-button px-2 py-1.5 text-left transition-colors",
                        dentro ? "bg-accent-soft" : "hover:bg-card-hover"
                      )}
                    >
                      <Avatar nome={p.nome} id={p.id} tamanho={22} />
                      <span className="min-w-0 flex-1 truncate text-[12px] text-text-secondary">{p.nome}</span>
                      <span
                        className={cn(
                          "text-[10px]",
                          dentro ? "font-medium text-accent-text" : "text-text-tertiary"
                        )}
                      >
                        {dentro ? "no grupo" : "adicionar"}
                      </span>
                    </button>
                  );
                })}
            </div>
            <p className="mt-1 text-[10px] text-text-muted">
              Você entra automaticamente como administrador da sala.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={() => onSalvar({ nome: nome.trim(), descricao: descricao.trim(), icone: icone.trim(), privada, membros })}
            disabled={!nome.trim() || salvando}
          >
            {salvando ? "Salvando…" : sala ? "Salvar" : "Criar sala"}
          </Button>
          {onExcluir && (
            <Button variant="danger" size="sm" onClick={onExcluir} className="ml-auto">
              Excluir sala
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Opcao({
  ativa,
  titulo,
  descricao,
  onClick,
}: {
  ativa: boolean;
  titulo: string;
  descricao: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-card px-3 py-2 text-left transition-colors",
        ativa ? "bg-card-hover shadow-[0_0_0_1px_var(--accent)]" : "bg-card shadow-card hover:bg-card-hover"
      )}
    >
      <span className={cn("block text-[12px] font-medium", ativa ? "text-accent-text" : "text-text-primary")}>
        {titulo}
      </span>
      <span className="block text-[10px] leading-snug text-text-tertiary">{descricao}</span>
    </button>
  );
}
