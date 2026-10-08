"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Phone, User, Mail } from "@/components/ui/icones";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { SubTabs } from "@/components/ui/sub-tabs";
import { ActionBar, ContentGrid, EmptyState, Field, Section } from "@/components/ui/page";
import { CORES_NUMERO, COR_PADRAO, FUNCAO_LABEL, FUNCOES, linkWhatsapp, type Funcao } from "@/lib/numeros";
import type { Database } from "@/lib/supabase/types";

type Numero = Database["public"]["Tables"]["numeros_de_atendimento"]["Row"];
type Usuario = { id: string; full_name: string | null };

const FILTROS = [{ key: "todos", label: "Todos" }, ...FUNCOES.map((f) => ({ key: f, label: FUNCAO_LABEL[f] }))];

interface Campos {
  numero: string;
  nome: string;
  cor: string;
  funcao: Funcao;
  usuarioId: string;
  sendpulseEmail: string;
}

const VAZIO: Campos = {
  numero: "",
  nome: "",
  cor: COR_PADRAO,
  funcao: "suporte",
  usuarioId: "",
  sendpulseEmail: "",
};

export function NumerosClient({
  productId,
  currentUserId,
  initialNumeros,
  usuarios,
}: {
  productId: string;
  currentUserId: string;
  initialNumeros: Numero[];
  usuarios: Usuario[];
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [numeros, setNumeros] = useState<Numero[]>(initialNumeros);
  const [filtro, setFiltro] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<Numero | null>(null);

  const nomeDoUsuario = useMemo(() => {
    const mapa = new Map(usuarios.map((u) => [u.id, u.full_name || "Sem nome"]));
    return (id: string | null) => (id ? (mapa.get(id) ?? "Removido da equipe") : null);
  }, [usuarios]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return numeros.filter((n) => {
      if (filtro !== "todos" && n.funcao !== filtro) return false;
      if (!termo) return true;
      const responsavel = nomeDoUsuario(n.usuario_id) ?? "";
      return [n.nome, n.numero, responsavel, n.sendpulse_email ?? ""].some((c) => c.toLowerCase().includes(termo));
    });
  }, [numeros, filtro, busca, nomeDoUsuario]);

  const semResponsavel = numeros.filter((n) => !n.usuario_id).length;
  const suporte = numeros.filter((n) => n.funcao === "suporte").length;
  const comercial = numeros.filter((n) => n.funcao === "comercial").length;

  async function excluir(numero: Numero) {
    const ok = await confirm({
      title: `Excluir "${numero.nome}"?`,
      description: "Tira o número desta lista. Não afeta o número de verdade nem nada no SendPulse.",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("numeros_de_atendimento").delete().eq("id", numero.id);
    if (error) {
      toast.error("Falha ao excluir.");
      return;
    }
    setNumeros((prev) => prev.filter((n) => n.id !== numero.id));
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Resumo label="Números cadastrados" valor={String(numeros.length)} />
        <Resumo label="Suporte" valor={String(suporte)} />
        <Resumo label="Comercial" valor={String(comercial)} />
        <Resumo
          label="Sem responsável"
          valor={String(semResponsavel)}
          tom={semResponsavel > 0 ? "danger" : "success"}
          nota={semResponsavel > 0 ? "Atribua alguém" : "Todos com dono"}
        />
      </div>

      <Section>
        <ActionBar
          filtros={<SubTabs tabs={FILTROS} active={filtro} onChange={setFiltro} className="mb-0" />}
          acoes={
            <>
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, número ou responsável"
                className="w-[300px]"
              />
              <Button onClick={() => setCriando(true)}>Novo número</Button>
            </>
          }
        />

        {filtrados.length === 0 ? (
          numeros.length === 0 ? (
            <EmptyState
              titulo="Nenhum número cadastrado ainda"
              descricao="Adicione os números que a equipe usa hoje no SendPulse — número, um nome pra identificar, cor e quem cuida dele."
              acao={<Button onClick={() => setCriando(true)}>Cadastrar o primeiro</Button>}
            />
          ) : (
            <EmptyState titulo="Nada encontrado" descricao="Nenhum número bate com esse filtro ou com o que você digitou na busca." />
          )
        ) : (
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            {filtrados.map((numero) => (
              <LinhaNumero
                key={numero.id}
                numero={numero}
                nomeResponsavel={nomeDoUsuario(numero.usuario_id)}
                onEditar={() => setEditando(numero)}
                onExcluir={() => excluir(numero)}
              />
            ))}
          </div>
        )}
      </Section>

      {criando && (
        <Formulario
          titulo="Novo número"
          productId={productId}
          currentUserId={currentUserId}
          usuarios={usuarios}
          inicial={VAZIO}
          onFechar={() => setCriando(false)}
          onSalvo={(n) => {
            setNumeros((prev) => [...prev, n]);
            setCriando(false);
          }}
        />
      )}
      {editando && (
        <Formulario
          titulo={`Editar ${editando.nome}`}
          productId={productId}
          currentUserId={currentUserId}
          usuarios={usuarios}
          numero={editando}
          inicial={{
            numero: editando.numero,
            nome: editando.nome,
            cor: editando.cor,
            funcao: editando.funcao,
            usuarioId: editando.usuario_id ?? "",
            sendpulseEmail: editando.sendpulse_email ?? "",
          }}
          onFechar={() => setEditando(null)}
          onSalvo={(n) => {
            setNumeros((prev) => prev.map((x) => (x.id === n.id ? n : x)));
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}

function Resumo({
  label,
  valor,
  nota,
  tom,
}: {
  label: string;
  valor: string;
  nota?: string;
  tom?: "danger" | "success";
}) {
  const cor = tom === "danger" ? "text-danger" : tom === "success" ? "text-success" : "text-text-primary";
  return (
    <div className="rounded-xl bg-card p-4 shadow-card-sm">
      <p className="text-[11px] font-medium text-text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${cor}`}>{valor}</p>
      {nota && <p className="mt-0.5 text-[10px] text-text-muted/70">{nota}</p>}
    </div>
  );
}

function LinhaNumero({
  numero,
  nomeResponsavel,
  onEditar,
  onExcluir,
}: {
  numero: Numero;
  nomeResponsavel: string | null;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const whatsapp = linkWhatsapp(numero.numero);

  return (
    <div className="flex items-start gap-3 rounded-xl bg-card-hover p-3">
      {/* A cor é a identificação rápida — antes de ler qualquer texto, já
          diz "esse é o grupo tal" pra quem já decorou a paleta. */}
      <span
        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: numero.cor }}
        title="Cor de identificação"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{numero.nome}</span>
          <Badge tone="neutral">{FUNCAO_LABEL[numero.funcao]}</Badge>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-text-muted">
          <Phone size={11} />
          {numero.numero}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-text-secondary">
          <User size={11} />
          {nomeResponsavel ?? "Sem responsável atribuído"}
        </p>
        {numero.sendpulse_email && (
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-text-muted">
            <Mail size={11} />
            {numero.sendpulse_email}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-button p-1.5 text-text-muted hover:bg-card hover:text-text-primary"
            title="Abrir no WhatsApp"
          >
            <MessageCircle size={14} />
          </a>
        )}
        <Button size="sm" variant="ghost" onClick={onEditar}>
          Editar
        </Button>
        <Button size="sm" variant="ghost" onClick={onExcluir}>
          Excluir
        </Button>
      </div>
    </div>
  );
}

function Formulario({
  titulo,
  productId,
  currentUserId,
  usuarios,
  numero,
  inicial,
  onFechar,
  onSalvo,
}: {
  titulo: string;
  productId: string;
  currentUserId: string;
  usuarios: Usuario[];
  numero?: Numero;
  inicial: Campos;
  onFechar: () => void;
  onSalvo: (n: Numero) => void;
}) {
  const toast = useToast();
  const [campos, setCampos] = useState(inicial);
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof Campos>(k: K, v: Campos[K]) {
    setCampos((prev) => ({ ...prev, [k]: v }));
  }

  async function salvar() {
    if (!campos.numero.trim()) {
      toast.error("O número é obrigatório.");
      return;
    }
    if (!campos.nome.trim()) {
      toast.error("Dê um nome pro número, pra identificar na lista.");
      return;
    }

    const corpo = {
      numero: campos.numero.trim(),
      nome: campos.nome.trim(),
      cor: campos.cor,
      funcao: campos.funcao,
      usuario_id: campos.usuarioId || null,
      sendpulse_email: campos.sendpulseEmail.trim() || null,
    };

    setSalvando(true);
    const supabase = createClient();
    const { data, error } = numero
      ? await supabase.from("numeros_de_atendimento").update(corpo).eq("id", numero.id).select().single()
      : await supabase
          .from("numeros_de_atendimento")
          .insert({ ...corpo, product_id: productId, created_by: currentUserId })
          .select()
          .single();
    setSalvando(false);

    if (error || !data) {
      toast.error(error?.message ?? "Falha ao salvar.");
      return;
    }
    onSalvo(data);
  }

  return (
    <Modal open onClose={onFechar} title={titulo}>
      <div className="space-y-5">
        <ContentGrid>
          <Field label="Número" span={6}>
            <Input
              value={campos.numero}
              onChange={(e) => set("numero", e.target.value)}
              placeholder="+55 11 91234-5678"
            />
          </Field>
          <Field label="Nome" hint="(como aparece na lista)" span={6}>
            <Input value={campos.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Suporte — linha 1" />
          </Field>

          <Field label="Função" span={6}>
            <Select value={campos.funcao} onChange={(e) => set("funcao", e.target.value as Funcao)}>
              {FUNCOES.map((f) => (
                <option key={f} value={f}>
                  {FUNCAO_LABEL[f]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Responsável" hint="(opcional)" span={6}>
            <Select value={campos.usuarioId} onChange={(e) => set("usuarioId", e.target.value)}>
              <option value="">Sem responsável</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || "Sem nome"}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Conta do SendPulse" hint="(opcional — o e-mail de login)" span={12}>
            <Input
              type="email"
              value={campos.sendpulseEmail}
              onChange={(e) => set("sendpulseEmail", e.target.value)}
              placeholder="equipe@escolaprofitx.com"
            />
          </Field>

          <Field label="Cor" span={12}>
            <div className="flex flex-wrap gap-2">
              {CORES_NUMERO.map((c) => (
                <button
                  key={c.valor}
                  type="button"
                  onClick={() => set("cor", c.valor)}
                  title={c.nome}
                  className="h-7 w-7 rounded-full transition-transform"
                  style={{
                    backgroundColor: c.valor,
                    outline: campos.cor === c.valor ? "2px solid var(--text-primary)" : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </Field>
        </ContentGrid>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
