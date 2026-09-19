"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { CommunityPapel, Database } from "@/lib/supabase/types";

export type Sala = Database["public"]["Tables"]["community_rooms"]["Row"];
export type Mensagem = Database["public"]["Tables"]["community_messages"]["Row"];
export type Reacao = Database["public"]["Tables"]["community_reactions"]["Row"];

export interface Pessoa {
  id: string;
  nome: string;
  role: string;
}

export interface MembroSala {
  room_id: string;
  user_id: string;
  papel: CommunityPapel;
}

/** Quantas mensagens entram por página. Histórico antigo sobe sob demanda. */
export const PAGINA = 50;

/* ─────────────────────────── identidade ─────────────────────────── */

/**
 * Iniciais de quem não tem foto.
 *
 * O app não guarda avatar de usuário (profiles tem nome, papel e status), e
 * inventar um campo só pra isso seria mudar o cadastro por causa da tela.
 * Duas letras resolvem, e a cor vem do id — a mesma pessoa tem sempre a
 * mesma, o que ajuda a reconhecer no canto do olho.
 */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const CORES_AVATAR = [
  "var(--accent-text)",
  "var(--accent-pink)",
  "var(--success)",
  "var(--warning)",
  "#60a5fa",
  "#f472b6",
  "#facc15",
  "#a78bfa",
];

export function corDaPessoa(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return CORES_AVATAR[Math.abs(hash) % CORES_AVATAR.length];
}

/* ─────────────────────────── presença ─────────────────────────── */

/**
 * Estado de presença de uma pessoa.
 *
 * São três coisas separadas de propósito (e o painel da direita depende
 * disso): estar ONLINE, estar VENDO uma sala e estar NA CHAMADA de uma sala.
 * Dá pra estar online no Dashboard, ou lendo #Geral sem áudio nenhum — e,
 * desde que a chamada passou a sobreviver à navegação, dá pra estar na
 * chamada da #Geral enquanto se lê a #Suporte ou o Tracking. Por isso a sala
 * da chamada é um campo próprio, e não um "sim/não" colado na sala aberta.
 */
export interface Presenca {
  user_id: string;
  sala_id: string | null;
  sala_chamada: string | null;
}

/**
 * Presença via canal de Realtime, não via banco.
 *
 * Quem está online agora é estado de sessão: morre quando a aba fecha. Numa
 * tabela, cada refresh viraria escrita e toda queda de conexão deixaria
 * alguém "online" pra sempre até um job limpar.
 */
export function usePresenca(meuId: string, salaAtual: string | null, salaDaChamada: string | null) {
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [conectado, setConectado] = useState(false);
  const canalRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase.channel("comunidade:presenca", {
      config: { presence: { key: meuId } },
    });
    canalRef.current = canal;

    function sincronizar() {
      const estado = canal.presenceState<Presenca>();
      // Uma pessoa pode ter duas abas abertas. A que vale é a que está numa
      // sala/chamada — senão a segunda aba "apagaria" a primeira.
      const porPessoa = new Map<string, Presenca>();
      for (const entradas of Object.values(estado)) {
        for (const e of entradas) {
          const atual = porPessoa.get(e.user_id);
          if (!atual || (!atual.sala_chamada && e.sala_chamada) || (!atual.sala_id && e.sala_id)) {
            porPessoa.set(e.user_id, {
              user_id: e.user_id,
              sala_id: e.sala_id,
              sala_chamada: e.sala_chamada ?? null,
            });
          }
        }
      }
      setPresencas(Array.from(porPessoa.values()));
    }

    canal
      .on("presence", { event: "sync" }, sincronizar)
      .on("presence", { event: "join" }, sincronizar)
      .on("presence", { event: "leave" }, sincronizar)
      .subscribe(async (status) => {
        setConectado(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") {
          await canal.track({ user_id: meuId, sala_id: salaAtual, sala_chamada: salaDaChamada });
        }
      });

    return () => {
      supabase.removeChannel(canal);
      canalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meuId]);

  // Trocar de sala ou entrar na chamada só reanuncia o estado — não derruba
  // e refaz a inscrição.
  useEffect(() => {
    const canal = canalRef.current;
    if (!canal || !conectado) return;
    canal.track({ user_id: meuId, sala_id: salaAtual, sala_chamada: salaDaChamada });
  }, [meuId, salaAtual, salaDaChamada, conectado]);

  return { presencas, conectado };
}

/* ─────────────────────────── texto ─────────────────────────── */

const RE_URL = /(https?:\/\/[^\s<]+)/g;
// Sem a flag /u: o tsconfig do projeto mira ES5, e o intervalo
// À-ÿ já cobre nome com acento, que é o caso real aqui.
const RE_MENCAO = /@([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9._-]*)/g;

/**
 * Quebra o texto em pedaços pra render: link vira link, @nome vira menção.
 *
 * Feito com split controlado em vez de innerHTML: mensagem é texto de
 * usuário, e texto de usuário não entra na página como HTML.
 */
export type Pedaco =
  | { tipo: "texto"; valor: string }
  | { tipo: "link"; valor: string }
  | { tipo: "mencao"; valor: string; encontrada: boolean };

export function pedacosDoTexto(texto: string, nomes: string[]): Pedaco[] {
  const saida: Pedaco[] = [];
  const normalizados = nomes.map((n) => n.toLowerCase());

  for (const bruto of texto.split(RE_URL)) {
    if (!bruto) continue;
    if (RE_URL.test(bruto) && bruto.startsWith("http")) {
      RE_URL.lastIndex = 0;
      saida.push({ tipo: "link", valor: bruto });
      continue;
    }
    RE_URL.lastIndex = 0;

    let ultimo = 0;
    RE_MENCAO.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = RE_MENCAO.exec(bruto)) !== null) {
      const inicio = m.index;
      if (inicio > ultimo) saida.push({ tipo: "texto", valor: bruto.slice(ultimo, inicio) });
      const alvo = m[1].toLowerCase();
      saida.push({
        tipo: "mencao",
        valor: m[0],
        encontrada: normalizados.some((n) => n.split(" ")[0] === alvo || n.replace(/\s+/g, "") === alvo),
      });
      ultimo = inicio + m[0].length;
    }
    if (ultimo < bruto.length) saida.push({ tipo: "texto", valor: bruto.slice(ultimo) });
  }
  return saida;
}

export function horaCurta(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function diaLegivel(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  const mesmoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (mesmoDia(d, hoje)) return "Hoje";
  if (mesmoDia(d, ontem)) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

/** Rola pro fim só quando a pessoa já estava no fim — senão ela perde o que estava lendo. */
export function usePertoDoFim(ref: RefObject<HTMLElement>) {
  const [perto, setPerto] = useState(true);

  const aoRolar = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setPerto(el.scrollHeight - el.scrollTop - el.clientHeight < 120);
  }, [ref]);

  return { perto, aoRolar };
}
