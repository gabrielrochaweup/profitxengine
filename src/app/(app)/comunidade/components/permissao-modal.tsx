"use client";

import { Mic, Monitor, Video, type LucideIcon } from "@/components/ui/icones";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

/**
 * O aviso do app antes do aviso do navegador.
 *
 * O que dá e o que não dá: a janela de permissão do Chrome é do Chrome, e
 * nenhum site substitui ela — se substituísse, qualquer página pediria sua
 * câmera com uma tela bonita e ninguém saberia de quem é o pedido. O que a
 * gente controla é o que acontece ANTES: explicar em português o que vai ser
 * pedido, por quê, e o que clicar na caixinha cinza que vai subir no canto.
 *
 * É o que resolve o problema real do print: a pessoa vê "Permitir que ...
 * veja sua tela?" sem contexto nenhum e fecha no "Agora não".
 */

type Tipo = "microfone" | "camera" | "tela";

interface Conteudo {
  icone: LucideIcon;
  titulo: string;
  resumo: string;
  passos: string[];
  botao: string;
  bloqueado: string;
}

const CONTEUDO: Record<Tipo, Conteudo> = {
  microfone: {
    icone: Mic,
    titulo: "Entrar na chamada",
    resumo:
      "Pra falar na sala, o navegador precisa liberar o seu microfone. Câmera e tela continuam desligadas — cada uma é um botão à parte, ligada só quando você quiser.",
    passos: [
      "O navegador vai abrir uma caixa no alto da janela.",
      "Clique em Permitir.",
      "Você entra já falando; pode se mudo no primeiro botão da barra.",
    ],
    botao: "Permitir microfone e entrar",
    bloqueado:
      "O microfone está bloqueado para este site. Clique no cadeado ao lado do endereço, ligue o Microfone e tente entrar de novo.",
  },
  camera: {
    icone: Video,
    titulo: "Ligar a câmera",
    resumo: "Sua imagem aparece pra quem está na chamada. Dá pra desligar a qualquer momento no mesmo botão.",
    passos: ["O navegador vai abrir uma caixa no alto da janela.", "Clique em Permitir."],
    botao: "Permitir câmera",
    bloqueado:
      "A câmera está bloqueada para este site. Clique no cadeado ao lado do endereço, ligue a Câmera e tente de novo.",
  },
  tela: {
    icone: Monitor,
    titulo: "Compartilhar a tela",
    resumo:
      "O navegador vai perguntar o que você quer mostrar. Quem está na chamada vê exatamente o que você escolher — e nada além disso.",
    passos: [
      "Escolha Janela do Chrome (ou a aba do ENGINE) pra mostrar o próprio sistema.",
      "Escolha Tela inteira pra mostrar tudo que estiver no seu monitor.",
      "Clique em Compartilhar. Pra parar, use o mesmo botão aqui na sala.",
    ],
    botao: "Escolher o que mostrar",
    bloqueado:
      "O compartilhamento de tela está bloqueado para este site. Clique no cadeado ao lado do endereço e libere.",
  },
};

export function PermissaoModal({
  tipo,
  bloqueada,
  ocupado,
  onConfirmar,
  onFechar,
}: {
  tipo: Tipo;
  bloqueada: boolean;
  ocupado: boolean;
  onConfirmar: () => void;
  onFechar: () => void;
}) {
  const c = CONTEUDO[tipo];
  const Icone = c.icone;

  return (
    <Modal open onClose={onFechar} title={c.titulo} className="max-w-md">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button bg-frame-soft text-frame-text">
          <Icone size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-relaxed text-text-secondary">{bloqueada ? c.bloqueado : c.resumo}</p>

          {!bloqueada && (
            <ol className="mt-3 space-y-1.5">
              {c.passos.map((passo, i) => (
                <li key={i} className="flex gap-2 text-[12px] text-text-tertiary">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-card-hover text-[10px] font-semibold text-text-secondary">
                    {i + 1}
                  </span>
                  <span className="leading-[1.35]">{passo}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onFechar}>
          {bloqueada ? "Fechar" : "Agora não"}
        </Button>
        {!bloqueada && (
          <Button type="button" size="sm" onClick={onConfirmar} disabled={ocupado}>
            {ocupado ? "Conectando…" : c.botao}
          </Button>
        )}
      </div>
    </Modal>
  );
}

export type { Tipo as TipoDePermissao };
