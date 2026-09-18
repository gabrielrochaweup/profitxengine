"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Hash, Lock, Menu, Settings2, Users, WifiOff, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { EVENTO_LIDA } from "@/components/layout/badge-comunidade";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { Chat } from "./components/chat";
import { Chamada } from "./components/chamada";
import { Membros } from "./components/membros";
import { SalasSidebar } from "./components/salas-sidebar";
import { SalaModal, type DadosSala } from "./components/sala-modal";
import { PAGINA, usePresenca, type MembroSala, type Mensagem, type Pessoa, type Reacao, type Sala } from "./lib";
import { useChamada } from "./lib-chamada";

/**
 * Texto de um erro, venha ele de onde vier.
 *
 * O Supabase devolve PostgrestError — um objeto simples com message/details/
 * hint/code, que NÃO é instanceof Error. Testar só por Error fazia todo erro
 * de banco cair no texto genérico, que é o mesmo para política de acesso,
 * campo inválido e queda de rede.
 */
function mensagemDoErro(e: unknown): string {
  if (!e) return "";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  if (typeof e === "object") {
    const o = e as { message?: string; details?: string; hint?: string; code?: string };
    return [o.message, o.details, o.hint, o.code ? `(${o.code})` : ""].filter(Boolean).join(" · ");
  }
  return "";
}

/**
 * O módulo inteiro roda numa página só, com três áreas.
 *
 * Trocar de sala não navega: a lista de salas, a presença e as inscrições de
 * Realtime continuam vivas enquanto a pessoa circula. Uma rota por sala
 * faria cada clique remontar tudo isso — e a conexão de presença cairia e
 * subiria a cada troca, piscando "entrou/saiu" pra todo mundo.
 */
export function ComunidadeClient({
  meuId,
  meuNome,
  souAdminDoApp,
  podeCriarSala,
  pessoas,
  salasIniciais,
  membrosIniciais,
  naoLidasIniciais,
  chamadaDisponivel,
}: {
  meuId: string;
  meuNome: string;
  souAdminDoApp: boolean;
  podeCriarSala: boolean;
  pessoas: Pessoa[];
  salasIniciais: Sala[];
  membrosIniciais: MembroSala[];
  naoLidasIniciais: { room_id: string; nao_lidas: number }[];
  chamadaDisponivel: boolean;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const supabase = useMemo(() => createClient(), []);

  const [salas, setSalas] = useState(salasIniciais);
  const [membros, setMembros] = useState(membrosIniciais);
  const [salaAtiva, setSalaAtiva] = useState<string | null>(salasIniciais[0]?.id ?? null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [reacoes, setReacoes] = useState<Reacao[]>([]);
  const [naoLidas, setNaoLidas] = useState<Map<string, number>>(
    new Map(naoLidasIniciais.map((n) => [n.room_id, Number(n.nao_lidas)]))
  );
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [temMais, setTemMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoSala, setEditandoSala] = useState<Sala | null>(null);
  const [salvandoSala, setSalvandoSala] = useState(false);
  const [drawerSalas, setDrawerSalas] = useState(false);
  const [drawerMembros, setDrawerMembros] = useState(false);


  const salaAtivaRef = useRef(salaAtiva);
  salaAtivaRef.current = salaAtiva;

  // A chamada é sessão, não banco: quem está nela agora vive no LiveKit (pra
  // quem entrou) e na presença (pra quem só está olhando de fora).
  const chamada = useChamada(salaAtiva, meuNome);
  const naChamada = chamada.status === "dentro" || chamada.status === "reconectando";
  const { presencas, conectado } = usePresenca(meuId, salaAtiva, naChamada);

  const pessoasPorId = useMemo(() => new Map(pessoas.map((p) => [p.id, p])), [pessoas]);
  const sala = salas.find((s) => s.id === salaAtiva) ?? null;

  const membrosDaSala = useMemo(
    () => membros.filter((m) => m.room_id === salaAtiva).map((m) => m.user_id),
    [membros, salaAtiva]
  );

  // Numa sala pública, a comunidade inteira participa; numa privada, só quem
  // foi convidado — o painel da direita não pode prometer gente que não
  // consegue entrar.
  const pessoasDaSala = useMemo(() => {
    if (!sala) return [];
    if (!sala.privada) return pessoas;
    const dentro = new Set([...membrosDaSala, sala.created_by ?? ""]);
    return pessoas.filter((p) => dentro.has(p.id));
  }, [sala, pessoas, membrosDaSala]);

  const souAdminDaSala =
    souAdminDoApp ||
    sala?.created_by === meuId ||
    membros.some((m) => m.room_id === salaAtiva && m.user_id === meuId && m.papel !== "membro");

  const naChamadaPorSala = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of presencas) {
      if (p.na_chamada && p.sala_id) mapa.set(p.sala_id, (mapa.get(p.sala_id) ?? 0) + 1);
    }
    return mapa;
  }, [presencas]);

  /* ─────────────────── carga da sala ─────────────────── */

  const marcarLida = useCallback(
    async (roomId: string) => {
      setNaoLidas((atual) => {
        const proximo = new Map(atual);
        proximo.set(roomId, 0);
        return proximo;
      });
      await supabase
        .from("community_read_states")
        .upsert({ room_id: roomId, user_id: meuId, last_read_at: new Date().toISOString() });
      // O contador do menu lateral escuta isso pra cair na hora, sem esperar
      // a próxima mensagem chegar.
      window.dispatchEvent(new Event(EVENTO_LIDA));
    },
    [supabase, meuId]
  );

  const carregarSala = useCallback(
    async (roomId: string) => {
      setCarregando(true);
      setErro(null);
      const { data, error } = await supabase
        .from("community_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(PAGINA);

      if (error) {
        setErro("Não deu pra carregar as mensagens desta sala.");
        setCarregando(false);
        return;
      }

      // Vem do banco da mais nova pra mais velha (é assim que o índice
      // responde rápido) e é invertido aqui pra ler de cima pra baixo.
      const lista = (data ?? []).slice().reverse();
      setMensagens(lista);
      setTemMais((data?.length ?? 0) === PAGINA);

      const ids = lista.map((m) => m.id);
      if (ids.length > 0) {
        const { data: rs } = await supabase.from("community_reactions").select("*").in("message_id", ids);
        setReacoes(rs ?? []);
      } else {
        setReacoes([]);
      }

      setCarregando(false);
      marcarLida(roomId);
    },
    [supabase, marcarLida]
  );

  useEffect(() => {
    if (salaAtiva) carregarSala(salaAtiva);
  }, [salaAtiva, carregarSala]);

  async function carregarMais() {
    if (!salaAtiva || mensagens.length === 0) return;
    setCarregandoMais(true);
    const { data } = await supabase
      .from("community_messages")
      .select("*")
      .eq("room_id", salaAtiva)
      .lt("created_at", mensagens[0].created_at)
      .order("created_at", { ascending: false })
      .limit(PAGINA);
    const antigas = (data ?? []).slice().reverse();
    setMensagens((atual) => [...antigas, ...atual]);
    setTemMais((data?.length ?? 0) === PAGINA);
    setCarregandoMais(false);
  }

  /* ─────────────────── realtime ─────────────────── */

  useEffect(() => {
    // Uma inscrição só, sem filtro de sala: o RLS já entrega a cada pessoa
    // apenas as linhas das salas que ela pode ver, e assim uma mensagem numa
    // sala que não está aberta ainda conta como não lida — que é o ponto do
    // contador.
    const canal = supabase
      .channel("comunidade:dados")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages" },
        ({ new: nova }) => {
          const m = nova as Mensagem;
          if (m.room_id === salaAtivaRef.current) {
            // Dedupe por id: a mensagem que eu mesmo mandei já entrou na
            // lista pelo retorno do insert, e o eco do Realtime chega depois.
            setMensagens((atual) => (atual.some((x) => x.id === m.id) ? atual : [...atual, m]));
            if (m.autor_id !== meuId) marcarLida(m.room_id);
          } else if (m.autor_id !== meuId) {
            setNaoLidas((atual) => {
              const proximo = new Map(atual);
              proximo.set(m.room_id, (proximo.get(m.room_id) ?? 0) + 1);
              return proximo;
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "community_messages" },
        ({ new: nova }) => {
          const m = nova as Mensagem;
          setMensagens((atual) => atual.map((x) => (x.id === m.id ? m : x)));
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "community_reactions" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const r = payload.new as Reacao;
          setReacoes((atual) =>
            atual.some((x) => x.message_id === r.message_id && x.user_id === r.user_id && x.emoji === r.emoji)
              ? atual
              : [...atual, r]
          );
        }
        if (payload.eventType === "DELETE") {
          const r = payload.old as Partial<Reacao>;
          setReacoes((atual) =>
            atual.filter(
              (x) => !(x.message_id === r.message_id && x.user_id === r.user_id && x.emoji === r.emoji)
            )
          );
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "community_rooms" }, async () => {
        const { data } = await supabase.from("community_rooms").select("*").order("created_at");
        if (data) setSalas(data);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [supabase, meuId, marcarLida]);

  /* ─────────────────── ações do chat ─────────────────── */

  async function enviar(conteudo: string, respondeA: string | null) {
    if (!salaAtiva) return;
    const { data, error } = await supabase
      .from("community_messages")
      .insert({ room_id: salaAtiva, autor_id: meuId, conteudo, responde_a: respondeA })
      .select()
      .single();
    if (error || !data) {
      toast.error(`A mensagem não foi enviada: ${mensagemDoErro(error) || "tente de novo"}`);
      return;
    }
    setMensagens((atual) => (atual.some((x) => x.id === data.id) ? atual : [...atual, data]));
  }

  async function editar(id: string, conteudo: string) {
    if (!conteudo) return;
    const { error } = await supabase
      .from("community_messages")
      .update({ conteudo, editada_em: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(`Não deu pra editar: ${mensagemDoErro(error)}`);
  }

  async function excluir(id: string) {
    const { error } = await supabase
      .from("community_messages")
      .update({ excluida_em: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(`Não deu pra excluir: ${mensagemDoErro(error)}`);
  }

  async function reagir(mensagemId: string, emoji: string) {
    const minha = reacoes.find((r) => r.message_id === mensagemId && r.user_id === meuId && r.emoji === emoji);
    if (minha) {
      setReacoes((atual) => atual.filter((r) => r !== minha));
      await supabase
        .from("community_reactions")
        .delete()
        .eq("message_id", mensagemId)
        .eq("user_id", meuId)
        .eq("emoji", emoji);
      return;
    }
    const nova = { message_id: mensagemId, user_id: meuId, emoji, created_at: new Date().toISOString() };
    setReacoes((atual) => [...atual, nova]);
    const { error } = await supabase.from("community_reactions").insert(nova);
    if (error) setReacoes((atual) => atual.filter((r) => r !== nova));
  }

  /* ─────────────────── ações da sala ─────────────────── */

  async function salvarSala(dados: DadosSala) {
    setSalvandoSala(true);
    try {
      // Cada passo carrega o próprio erro: sem isso, "não deu pra salvar"
      // vale igual pra política de acesso, campo inválido e queda de rede.
      if (editandoSala) {
        const { error } = await supabase
          .from("community_rooms")
          .update({
            nome: dados.nome,
            descricao: dados.descricao || null,
            icone: dados.icone || null,
            privada: dados.privada,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editandoSala.id);
        if (error) throw error;
        await sincronizarMembros(editandoSala.id, dados.privada ? dados.membros : []);
        toast.success("Sala atualizada.");
      } else {
        const { data, error } = await supabase
          .from("community_rooms")
          .insert({
            nome: dados.nome,
            descricao: dados.descricao || null,
            icone: dados.icone || null,
            privada: dados.privada,
            created_by: meuId,
          })
          .select()
          .single();
        if (error || !data) throw error ?? new Error("O banco não devolveu a sala criada.");
        // Quem cria entra como admin da sala — inclusive em sala pública,
        // pra existir alguém responsável por ela além do admin do app.
        const { error: erroMembro } = await supabase
          .from("community_room_members")
          .insert({ room_id: data.id, user_id: meuId, papel: "admin" });
        if (erroMembro) throw erroMembro;
        if (dados.privada && dados.membros.length > 0) {
          const { error: erroConvidados } = await supabase
            .from("community_room_members")
            .insert(dados.membros.map((id) => ({ room_id: data.id, user_id: id, papel: "membro" as const })));
          if (erroConvidados) throw erroConvidados;
        }
        await recarregarMembros();
        setSalas((atual) => (atual.some((s) => s.id === data.id) ? atual : [...atual, data]));
        setSalaAtiva(data.id);
        toast.success("Sala criada.");
      }
      setModalAberto(false);
      setEditandoSala(null);
    } catch (e) {
      const detalhe = mensagemDoErro(e);
      toast.error(detalhe ? `Não deu pra salvar a sala: ${detalhe}` : "Não deu pra salvar a sala.");
      // O erro completo (código, hint e detail do Postgres) fica no console:
      // é o que diz se foi política de acesso, campo ou conexão.
      console.error("[comunidade] falha ao salvar sala", e);
    } finally {
      setSalvandoSala(false);
    }
  }

  async function sincronizarMembros(roomId: string, desejados: string[]) {
    const atuais = membros.filter((m) => m.room_id === roomId && m.user_id !== meuId).map((m) => m.user_id);
    const entrar = desejados.filter((id) => !atuais.includes(id));
    const sair = atuais.filter((id) => !desejados.includes(id));
    if (entrar.length > 0) {
      await supabase
        .from("community_room_members")
        .insert(entrar.map((id) => ({ room_id: roomId, user_id: id, papel: "membro" as const })));
    }
    if (sair.length > 0) {
      await supabase.from("community_room_members").delete().eq("room_id", roomId).in("user_id", sair);
    }
    await recarregarMembros();
  }

  async function recarregarMembros() {
    const { data } = await supabase.from("community_room_members").select("room_id, user_id, papel");
    if (data) setMembros(data);
  }

  async function excluirSala() {
    if (!editandoSala) return;
    const ok = await confirm({
      title: "Excluir sala",
      description: `Excluir "${editandoSala.nome}"? As mensagens dela vão junto, e isso não tem volta.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("community_rooms").delete().eq("id", editandoSala.id);
    if (error) {
      toast.error(`Não deu pra excluir a sala: ${mensagemDoErro(error)}`);
      return;
    }
    setSalas((atual) => atual.filter((s) => s.id !== editandoSala.id));
    setSalaAtiva((atual) => (atual === editandoSala.id ? (salas.find((s) => s.id !== editandoSala.id)?.id ?? null) : atual));
    setModalAberto(false);
    setEditandoSala(null);
    toast.success("Sala excluída.");
  }

  function abrirSala(id: string) {
    setSalaAtiva(id);
    setDrawerSalas(false);
  }

  /* ─────────────────── render ─────────────────── */

  const listaSalas = (
    <SalasSidebar
      salas={salas}
      salaAtiva={salaAtiva}
      naoLidas={naoLidas}
      naChamadaPorSala={naChamadaPorSala}
      podeCriar={podeCriarSala}
      onSelecionar={abrirSala}
      onCriar={() => {
        setEditandoSala(null);
        setModalAberto(true);
      }}
    />
  );

  const painelMembros = (
    <Membros pessoas={pessoasDaSala} presencas={presencas} salaId={salaAtiva} meuId={meuId} />
  );

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-card bg-card shadow-card">
      {/* Salas — coluna fixa no desktop, gaveta no celular */}
      <aside className="hidden w-56 shrink-0 border-r border-border md:block">{listaSalas}</aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
          <button
            type="button"
            onClick={() => setDrawerSalas(true)}
            className="flex h-7 w-7 items-center justify-center rounded-button text-text-tertiary hover:bg-card-hover hover:text-text-primary md:hidden"
            aria-label="Abrir salas"
          >
            <Menu size={15} />
          </button>

          {sala ? (
            <>
              <span className="flex items-center gap-1.5 text-text-tertiary">
                {sala.icone ? <span className="text-[13px]">{sala.icone}</span> : sala.privada ? <Lock size={13} /> : <Hash size={14} />}
              </span>
              <h2 className="truncate text-[14px] font-semibold text-text-primary">{sala.nome}</h2>
              {sala.descricao && (
                <p className="hidden min-w-0 truncate border-l border-border pl-2 text-[11px] text-text-tertiary lg:block">
                  {sala.descricao}
                </p>
              )}
            </>
          ) : (
            <h2 className="text-[14px] font-semibold text-text-primary">Comunidade</h2>
          )}

          <div className="ml-auto flex items-center gap-1">
            {!conectado && (
              <span className="flex items-center gap-1 text-[10px] text-warning" title="Reconectando ao tempo real">
                <WifiOff size={12} />
                reconectando
              </span>
            )}
            {sala && souAdminDaSala && (
              <button
                type="button"
                onClick={() => {
                  setEditandoSala(sala);
                  setModalAberto(true);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-button text-text-tertiary hover:bg-card-hover hover:text-text-primary"
                title="Configurações da sala"
              >
                <Settings2 size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setDrawerMembros(true)}
              className="flex h-7 w-7 items-center justify-center rounded-button text-text-tertiary hover:bg-card-hover hover:text-text-primary xl:hidden"
              aria-label="Abrir membros"
            >
              <Users size={15} />
            </button>
          </div>
        </header>

        {sala && (
          <Chamada
            disponivel={chamadaDisponivel}
            salaId={sala.id}
            status={chamada.status}
            erro={chamada.erro}
            limparErro={chamada.limparErro}
            participantes={chamada.participantes}
            telaDeAlguem={chamada.telaDeAlguem}
            micLigado={chamada.micLigado}
            cameraLigada={chamada.cameraLigada}
            telaLigada={chamada.telaLigada}
            dispositivos={chamada.dispositivos}
            pessoas={pessoasPorId}
            presencas={presencas}
            onEntrar={chamada.entrar}
            onSair={chamada.sair}
            onAlternarMic={chamada.alternarMic}
            onAlternarCamera={chamada.alternarCamera}
            onAlternarTela={chamada.alternarTela}
            onTrocarDispositivo={chamada.trocarDispositivo}
          />
        )}

        {!sala ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="text-[14px] font-medium text-text-primary">Ainda não existem salas</p>
            <p className="mt-1 max-w-[46ch] text-[12px] text-text-tertiary">
              As salas são permanentes: o chat de cada uma fica guardado e a conversa continua de onde parou.
            </p>
            {podeCriarSala && (
              <button
                type="button"
                onClick={() => {
                  setEditandoSala(null);
                  setModalAberto(true);
                }}
                className="mt-4 rounded-button bg-accent px-3 py-1.5 text-[13px] font-medium text-accent-contrast"
              >
                Criar primeira sala
              </button>
            )}
          </div>
        ) : erro ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-[13px] text-danger">{erro}</p>
            <button
              type="button"
              onClick={() => salaAtiva && carregarSala(salaAtiva)}
              className="rounded-button border border-border px-3 py-1.5 text-[12px] text-text-primary hover:bg-card-hover"
            >
              Tentar de novo
            </button>
          </div>
        ) : carregando ? (
          <div className="flex flex-1 items-center justify-center text-[12px] text-text-tertiary">Carregando…</div>
        ) : (
          <Chat
            mensagens={mensagens}
            reacoes={reacoes}
            pessoas={pessoasPorId}
            meuId={meuId}
            souAdminDaSala={souAdminDaSala}
            temMais={temMais}
            carregandoMais={carregandoMais}
            onCarregarMais={carregarMais}
            onEnviar={enviar}
            onEditar={editar}
            onExcluir={excluir}
            onReagir={reagir}
          />
        )}
      </section>

      {/* Membros — coluna no desktop largo, gaveta no resto */}
      <aside className="hidden w-52 shrink-0 border-l border-border xl:block">{painelMembros}</aside>

      {drawerSalas && (
        <Gaveta lado="esquerda" titulo="Salas" onFechar={() => setDrawerSalas(false)}>
          {listaSalas}
        </Gaveta>
      )}
      {drawerMembros && (
        <Gaveta lado="direita" titulo="Membros" onFechar={() => setDrawerMembros(false)}>
          {painelMembros}
        </Gaveta>
      )}

      {modalAberto && (
        <SalaModal
          key={editandoSala?.id ?? "nova"}
          aberto={modalAberto}
          sala={editandoSala}
          pessoas={pessoas}
          meuId={meuId}
          membrosAtuais={editandoSala ? membrosDaSala.filter((id) => id !== meuId) : []}
          salvando={salvandoSala}
          onFechar={() => {
            setModalAberto(false);
            setEditandoSala(null);
          }}
          onSalvar={salvarSala}
          onExcluir={editandoSala && (souAdminDoApp || editandoSala.created_by === meuId) ? excluirSala : undefined}
        />
      )}
    </div>
  );
}

/** Gaveta lateral do celular/tablet — as três colunas não cabem juntas ali. */
function Gaveta({
  lado,
  titulo,
  onFechar,
  children,
}: {
  lado: "esquerda" | "direita";
  titulo: string;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onFechar} />
      <div
        className={cn(
          "fixed inset-y-0 z-50 flex w-64 max-w-[80vw] flex-col bg-sidebar shadow-popover",
          lado === "esquerda" ? "left-0" : "right-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-[12px] font-semibold text-text-primary">{titulo}</p>
          <button
            type="button"
            onClick={onFechar}
            className="flex h-7 w-7 items-center justify-center rounded-button text-text-tertiary hover:bg-card-hover hover:text-text-primary"
            aria-label="Fechar"
          >
            <X size={15} />
          </button>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </>
  );
}
