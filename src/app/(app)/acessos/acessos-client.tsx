"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Eye, EyeOff, Copy, LogIn, ShieldCheck, ShieldAlert } from "@/components/ui/icones";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { SubTabs } from "@/components/ui/sub-tabs";
import { ActionBar, ContentGrid, EmptyState, Field, Section } from "@/components/ui/page";
import {
  CATEGORIAS,
  CATEGORIA_LABEL,
  CICLOS,
  MOEDAS,
  custoMensalCents,
  type Acesso,
  type Categoria,
  type Ciclo,
  type Moeda,
} from "@/lib/acessos";

const FILTROS = [{ key: "todos", label: "Todos" }, ...CATEGORIAS.map((c) => ({ key: c, label: CATEGORIA_LABEL[c] }))];

interface Campos {
  nome: string;
  categoria: Categoria;
  url: string;
  usuario: string;
  login_google: boolean;
  senha: string;
  tem_2fa: boolean;
  onde_2fa: string;
  responsavel: string;
  assinatura: boolean;
  valor: string;
  moeda: Moeda;
  ciclo: Ciclo;
  observacoes: string;
}

const VAZIO: Campos = {
  nome: "",
  categoria: "rede",
  url: "",
  usuario: "",
  login_google: false,
  senha: "",
  tem_2fa: false,
  onde_2fa: "",
  responsavel: "",
  assinatura: false,
  valor: "",
  moeda: "BRL",
  ciclo: "mensal",
  observacoes: "",
};

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function AcessosClient({ productId }: { productId: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<Acesso | null>(null);
  const [cotacao, setCotacao] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/acessos?product_id=${productId}`)
      .then((r) => r.json())
      .then((d) => setAcessos(d.acessos ?? []))
      .finally(() => setCarregando(false));
  }, [productId]);

  useEffect(() => {
    fetch("/api/tracking/usd-brl-rate")
      .then((r) => r.json())
      .then((d) => setCotacao(typeof d.rate === "number" ? d.rate : null))
      .catch(() => setCotacao(null));
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return acessos.filter((a) => {
      if (filtro !== "todos" && a.categoria !== filtro) return false;
      if (!termo) return true;
      return [a.nome, a.usuario, a.responsavel, a.observacoes]
        .filter(Boolean)
        .some((c) => c!.toLowerCase().includes(termo));
    });
  }, [acessos, filtro, busca]);

  // Total de TUDO, não do que está filtrado: a pergunta é "quanto estamos
  // gastando", e um total que muda quando você digita na busca responderia
  // outra coisa.
  const { totalCents, semCotacao } = useMemo(() => {
    let total = 0;
    let pendentes = 0;
    for (const a of acessos) {
      const custo = custoMensalCents(a, cotacao);
      if (custo === null) pendentes += 1;
      else total += custo;
    }
    return { totalCents: total, semCotacao: pendentes };
  }, [acessos, cotacao]);

  const assinaturas = acessos.filter((a) => a.assinatura).length;
  const sem2fa = acessos.filter((a) => !a.tem_2fa).length;

  async function excluir(acesso: Acesso) {
    const ok = await confirm({
      title: `Excluir ${acesso.nome}?`,
      description: "Apaga o registro e a senha guardada. A conta na plataforma continua existindo.",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/acessos/${acesso.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Falha ao excluir.");
      return;
    }
    setAcessos((prev) => prev.filter((a) => a.id !== acesso.id));
  }

  if (carregando) return <Card className="p-5 text-sm text-text-secondary">Carregando…</Card>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Resumo label="Acessos guardados" valor={String(acessos.length)} />
        <Resumo label="Com assinatura" valor={String(assinaturas)} />
        <Resumo
          label="Custo por mês"
          valor={brl(totalCents)}
          tom="accent"
          nota={
            semCotacao > 0
              ? `${semCotacao} em dólar fora da conta — cotação não carregou`
              : cotacao
                ? `Dólar convertido a R$ ${cotacao.toFixed(2)}`
                : undefined
          }
        />
        <Resumo
          label="Sem 2FA"
          valor={String(sem2fa)}
          tom={sem2fa > 0 ? "danger" : "success"}
          nota={sem2fa > 0 ? "Ligue nessas contas" : "Todas protegidas"}
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
                placeholder="Buscar por nome, login ou responsável"
                className="w-[320px]"
              />
              <Button onClick={() => setCriando(true)}>Novo acesso</Button>
            </>
          }
        />

        {filtrados.length === 0 ? (
          acessos.length === 0 ? (
            <EmptyState
              titulo="Nenhum acesso guardado ainda"
              descricao="Comece pelas redes: quem entra, com qual login e onde está o segundo fator. É o campo do 2FA que resolve o pedido de senha às 23h."
              acao={<Button onClick={() => setCriando(true)}>Cadastrar o primeiro</Button>}
            />
          ) : (
            <EmptyState
              titulo="Nada encontrado"
              descricao="Nenhum acesso bate com esse filtro ou com o que você digitou na busca."
            />
          )
        ) : (
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            {filtrados.map((acesso) => (
              <LinhaAcesso
                key={acesso.id}
                acesso={acesso}
                cotacao={cotacao}
                onEditar={() => setEditando(acesso)}
                onExcluir={() => excluir(acesso)}
              />
            ))}
          </div>
        )}
      </Section>

      {criando && (
        <Formulario
          titulo="Novo acesso"
          productId={productId}
          inicial={VAZIO}
          onFechar={() => setCriando(false)}
          onSalvo={(a) => {
            setAcessos((prev) => [...prev, a]);
            setCriando(false);
          }}
        />
      )}
      {editando && (
        <Formulario
          titulo={`Editar ${editando.nome}`}
          productId={productId}
          acesso={editando}
          inicial={{
            nome: editando.nome,
            categoria: editando.categoria,
            url: editando.url ?? "",
            usuario: editando.usuario ?? "",
            login_google: editando.login_google,
            senha: "",
            tem_2fa: editando.tem_2fa,
            onde_2fa: editando.onde_2fa ?? "",
            responsavel: editando.responsavel ?? "",
            assinatura: editando.assinatura,
            valor: editando.valor_cents ? (editando.valor_cents / 100).toString() : "",
            moeda: editando.moeda,
            ciclo: editando.ciclo,
            observacoes: editando.observacoes ?? "",
          }}
          onFechar={() => setEditando(null)}
          onSalvo={(a) => {
            setAcessos((prev) => prev.map((x) => (x.id === a.id ? a : x)));
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
  tom?: "accent" | "danger" | "success";
}) {
  const cor = tom === "accent" ? "text-accent-text" : tom === "danger" ? "text-danger" : tom === "success" ? "text-success" : "text-text-primary";
  return (
    <div className="rounded-xl bg-card p-4 shadow-card-sm">
      <p className="text-[11px] font-medium text-text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${cor}`}>{valor}</p>
      {nota && <p className="mt-0.5 text-[10px] text-text-muted/70">{nota}</p>}
    </div>
  );
}

function LinhaAcesso({
  acesso,
  cotacao,
  onEditar,
  onExcluir,
}: {
  acesso: Acesso;
  cotacao: number | null;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const toast = useToast();
  const [senha, setSenha] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  // Some sozinha depois de meio minuto: senha aberta na tela é a coisa que
  // se esquece aberta, e quem precisou já copiou nos primeiros segundos.
  useEffect(() => {
    if (!senha) return;
    const t = setTimeout(() => setSenha(null), 30000);
    return () => clearTimeout(t);
  }, [senha]);

  async function mostrar() {
    if (senha) {
      setSenha(null);
      return;
    }
    setBuscando(true);
    const res = await fetch(`/api/acessos/${acesso.id}/senha`);
    setBuscando(false);
    const json = await res.json().catch(() => null);
    if (!res.ok || typeof json?.senha !== "string") {
      toast.error(json?.error ?? "Falha ao abrir a senha.");
      return;
    }
    setSenha(json.senha);
  }

  async function copiar() {
    const res = await fetch(`/api/acessos/${acesso.id}/senha`);
    const json = await res.json().catch(() => null);
    if (!res.ok || typeof json?.senha !== "string") {
      toast.error(json?.error ?? "Falha ao copiar.");
      return;
    }
    await navigator.clipboard.writeText(json.senha);
    toast.success("Senha copiada.");
  }

  const custo = custoMensalCents(acesso, cotacao);

  return (
    <div className="rounded-xl bg-card-hover p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{acesso.nome}</span>
            <Badge tone="neutral">{CATEGORIA_LABEL[acesso.categoria]}</Badge>
            {acesso.tem_2fa ? (
              <Badge tone="success">
                <ShieldCheck size={11} className="mr-1" />
                2FA
              </Badge>
            ) : (
              <Badge tone="danger">
                <ShieldAlert size={11} className="mr-1" />
                sem 2FA
              </Badge>
            )}
            {acesso.login_google && (
              // Conta sem senha guardada porque entra pelo Google é
              // diferente de conta sem senha anotada. A etiqueta separa as
              // duas — é a primeira pergunta de quem precisa entrar.
              <Badge tone="neutral">
                <LogIn size={11} className="mr-1" />
                Login com Google
              </Badge>
            )}
            {acesso.assinatura && (
              <Badge tone="warning">
                {custo === null
                  ? `${acesso.moeda} ${(acesso.valor_cents / 100).toLocaleString("pt-BR")}`
                  : `${brl(custo)}/mês`}
                {acesso.ciclo === "anual" && " · anual"}
              </Badge>
            )}
          </div>
          <p className="mt-1 truncate text-[11px] text-text-muted">
            {acesso.usuario || "sem login anotado"}
            {acesso.login_google && !acesso.tem_senha && " · entra pelo Google, sem senha própria"}
            {acesso.responsavel && ` · com ${acesso.responsavel}`}
            {acesso.tem_2fa && acesso.onde_2fa && ` · 2FA ${acesso.onde_2fa}`}
          </p>
          {acesso.observacoes && <p className="mt-1 text-[11px] text-text-secondary">{acesso.observacoes}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {acesso.url && (
            <a
              href={acesso.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-button p-1.5 text-text-muted hover:bg-card hover:text-text-primary"
              title="Abrir a página de login"
            >
              <ExternalLink size={14} />
            </a>
          )}
          {acesso.tem_senha && (
            <>
              {/* Ícone com palavra do lado: sozinho, o olho passava
                  despercebido no meio dos outros ícones — e é justamente o
                  botão que a pessoa veio procurar. */}
              <button
                type="button"
                onClick={mostrar}
                disabled={buscando}
                className="flex items-center gap-1 rounded-button px-1.5 py-1 text-[11px] text-text-muted hover:bg-card hover:text-text-primary disabled:opacity-50"
                title={senha ? "Esconder a senha" : "Mostrar a senha"}
              >
                {senha ? <EyeOff size={14} /> : <Eye size={14} />}
                {buscando ? "Abrindo…" : senha ? "Esconder" : "Ver senha"}
              </button>
              <button
                type="button"
                onClick={copiar}
                className="flex items-center gap-1 rounded-button px-1.5 py-1 text-[11px] text-text-muted hover:bg-card hover:text-text-primary"
                title="Copiar a senha"
              >
                <Copy size={14} />
                Copiar
              </button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={onEditar}>
            Editar
          </Button>
          <Button size="sm" variant="ghost" onClick={onExcluir}>
            Excluir
          </Button>
        </div>
      </div>

      {senha && (
        <div className="mt-2 flex items-center gap-2">
          {/* Selecionável de propósito: às vezes a pessoa quer só o pedaço
              do meio, ou colar num campo que rejeita o Ctrl+V do botão. */}
          <code className="flex-1 select-all overflow-x-auto whitespace-nowrap rounded-input bg-accent-soft px-3 py-1.5 font-mono text-xs">
            {senha}
          </code>
          <button
            type="button"
            onClick={copiar}
            title="Copiar a senha"
            className="shrink-0 rounded-button p-1.5 text-text-muted hover:bg-card hover:text-text-primary"
          >
            <Copy size={14} />
          </button>
          <span className="shrink-0 text-[10px] text-text-muted/70">some em 30s</span>
        </div>
      )}
    </div>
  );
}

function Formulario({
  titulo,
  productId,
  acesso,
  inicial,
  onFechar,
  onSalvo,
}: {
  titulo: string;
  productId: string;
  acesso?: Acesso;
  inicial: Campos;
  onFechar: () => void;
  onSalvo: (a: Acesso) => void;
}) {
  const toast = useToast();
  const [campos, setCampos] = useState(inicial);
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof Campos>(k: K, v: Campos[K]) {
    setCampos((prev) => ({ ...prev, [k]: v }));
  }

  async function salvar() {
    if (!campos.nome.trim()) {
      toast.error("O nome é obrigatório.");
      return;
    }
    const valorCents = Math.round((Number(campos.valor.replace(",", ".")) || 0) * 100);
    if (campos.assinatura && valorCents <= 0) {
      toast.error("Assinatura sem valor não entra na conta do mês — preencha o valor.");
      return;
    }

    const corpo: Record<string, unknown> = {
      nome: campos.nome,
      categoria: campos.categoria,
      url: campos.url,
      usuario: campos.usuario,
      login_google: campos.login_google,
      tem_2fa: campos.tem_2fa,
      onde_2fa: campos.onde_2fa,
      responsavel: campos.responsavel,
      assinatura: campos.assinatura,
      valor_cents: valorCents,
      moeda: campos.moeda,
      ciclo: campos.ciclo,
      observacoes: campos.observacoes,
    };
    // Na edição, campo de senha em branco significa "não mexe" — mandar
    // string vazia apagaria a senha guardada de quem só quis trocar o nome.
    if (!acesso || campos.senha) corpo.senha = campos.senha;

    setSalvando(true);
    const res = acesso
      ? await fetch(`/api/acessos/${acesso.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        })
      : await fetch("/api/acessos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...corpo, product_id: productId }),
        });
    setSalvando(false);
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.acesso) {
      toast.error(json?.error ?? "Falha ao salvar.");
      return;
    }
    onSalvo(json.acesso);
  }

  return (
    <Modal open onClose={onFechar} title={titulo}>
      <div className="space-y-5">
        {/* Nome ocupa 8 e categoria 4: um e texto livre, o outro escolhe entre
            quatro palavras curtas. Largura igual prometeria o mesmo dos dois. */}
        <ContentGrid>
          <Field label="Nome" span={8}>
            <Input value={campos.nome} onChange={(e) => set("nome", e.target.value)} placeholder="YouTube — Escola ProfitX" />
          </Field>
          <Field label="Categoria" span={4}>
            <Select value={campos.categoria} onChange={(e) => set("categoria", e.target.value as Categoria)}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_LABEL[c]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Página de login" hint="(opcional)" span={12}>
            <Input value={campos.url} onChange={(e) => set("url", e.target.value)} placeholder="https://studio.youtube.com" />
          </Field>

          <Field label="Login / e-mail" span={6}>
            <Input value={campos.usuario} onChange={(e) => set("usuario", e.target.value)} placeholder="contato@escolaprofitx.com" />
          </Field>
          <Field label="Senha" hint={acesso ? "(em branco = não mexe)" : undefined} span={6}>
            <CampoSenha
              valor={campos.senha}
              onChange={(v) => set("senha", v)}
              acessoId={acesso?.id ?? null}
              temSenha={acesso?.tem_senha ?? false}
              loginGoogle={campos.login_google}
            />
          </Field>

          <Field span={12}>
            {/* A pergunta "essa conta tem senha própria?" vem antes de
                qualquer senha: várias entram pelo botão do Google, e aí a
                senha que importa é a da conta Google — não uma senha desta
                plataforma que não existe. */}
            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={campos.login_google}
                onChange={(e) => set("login_google", e.target.checked)}
                className="h-3.5 w-3.5 accent-accent"
              />
              Entra com o login do Google
              <Tooltip text="Marque quando a plataforma abre com “Continuar com o Google”. O login acima é a conta Google usada; a senha pode ficar em branco." />
            </label>
          </Field>

          <Field label="Quem administra" hint="(opcional)" span={6}>
            <Input value={campos.responsavel} onChange={(e) => set("responsavel", e.target.value)} placeholder="Renato" />
          </Field>
        </ContentGrid>

        <div className="rounded-xl bg-card-hover p-3">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={campos.tem_2fa}
              onChange={(e) => set("tem_2fa", e.target.checked)}
              className="h-3.5 w-3.5 accent-accent"
            />
            Tem autenticação de dois fatores
          </label>
          {campos.tem_2fa && (
            <div className="mt-2">
              <label className="mb-1 block text-[11px] font-medium text-text-secondary">Onde está o 2FA</label>
              <Input
                value={campos.onde_2fa}
                onChange={(e) => set("onde_2fa", e.target.value)}
                placeholder="Authenticator no celular do Renato"
              />
            </div>
          )}
        </div>


        <div className="rounded-xl bg-card-hover p-3">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={campos.assinatura}
              onChange={(e) => set("assinatura", e.target.checked)}
              className="h-3.5 w-3.5 accent-accent"
            />
            É assinatura paga
          </label>
          {campos.assinatura && (
            <ContentGrid className="mt-3">
              <Field label="Valor" span={4}>
                <Input value={campos.valor} onChange={(e) => set("valor", e.target.value)} placeholder="29,00" />
              </Field>
              <Field label="Moeda" span={4}>
                <Select value={campos.moeda} onChange={(e) => set("moeda", e.target.value as Moeda)}>
                  {MOEDAS.map((m) => (
                    <option key={m} value={m}>
                      {m === "BRL" ? "R$ (real)" : "US$ (dólar)"}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Cobrança" span={4}>
                <Select value={campos.ciclo} onChange={(e) => set("ciclo", e.target.value as Ciclo)}>
                  {CICLOS.map((c) => (
                    <option key={c} value={c}>
                      {c === "mensal" ? "Mensal" : "Anual"}
                    </option>
                  ))}
                </Select>
              </Field>
            </ContentGrid>
          )}
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-secondary">
            Observações <span className="text-text-muted/70">(opcional)</span>
          </label>
          <Textarea
            rows={2}
            value={campos.observacoes}
            onChange={(e) => set("observacoes", e.target.value)}
            placeholder="Entra por convite — pedir pro Renato liberar"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onFechar}>
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

/**
 * O campo de senha do formulário.
 *
 * Três coisas que faltavam, e todas pelo mesmo motivo — a senha existe pra
 * ser levada até a plataforma:
 *
 * 1. O olho, pra conferir o que se está digitando. Senha em bolinha é boa
 *    defesa contra quem olha por cima do ombro e péssima contra o próprio
 *    erro de digitação.
 * 2. Na edição, "Ver a senha atual": ela abre o cofre, traz a senha pro
 *    campo e deixa visível. Antes, quem abria o cadastro pra conferir a
 *    senha encontrava um campo vazio com "em branco = não mexe".
 * 3. Copiar, que é o que a pessoa vai fazer em seguida de qualquer jeito.
 */
function CampoSenha({
  valor,
  onChange,
  acessoId,
  temSenha,
  loginGoogle,
}: {
  valor: string;
  onChange: (v: string) => void;
  acessoId: string | null;
  temSenha: boolean;
  loginGoogle: boolean;
}) {
  const toast = useToast();
  const [visivel, setVisivel] = useState(false);
  const [buscando, setBuscando] = useState(false);

  async function buscarAtual(): Promise<string | null> {
    if (!acessoId) return null;
    setBuscando(true);
    const res = await fetch(`/api/acessos/${acessoId}/senha`);
    setBuscando(false);
    const json = await res.json().catch(() => null);
    if (!res.ok || typeof json?.senha !== "string") {
      toast.error(json?.error ?? "Falha ao abrir a senha.");
      return null;
    }
    return json.senha;
  }

  async function verAtual() {
    const senha = await buscarAtual();
    if (senha === null) return;
    onChange(senha);
    setVisivel(true);
  }

  async function copiar() {
    // O que está no campo ganha do que está no banco: se a pessoa acabou de
    // digitar uma senha nova, é essa que ela quer levar pra plataforma.
    const senha = valor || (await buscarAtual());
    if (!senha) return;
    await navigator.clipboard.writeText(senha);
    toast.success("Senha copiada.");
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          type={visivel ? "text" : "password"}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={temSenha ? "••••••••" : loginGoogle ? "não precisa — entra pelo Google" : "senha da conta"}
          className="pr-16"
          autoComplete="new-password"
        />
        <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setVisivel((v) => !v)}
            title={visivel ? "Esconder a senha" : "Mostrar a senha"}
            aria-label={visivel ? "Esconder a senha" : "Mostrar a senha"}
            className="flex h-7 w-7 items-center justify-center rounded-button text-text-muted hover:bg-card-hover hover:text-text-primary"
          >
            {visivel ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          {(valor || temSenha) && (
            <button
              type="button"
              onClick={copiar}
              title="Copiar a senha"
              aria-label="Copiar a senha"
              className="flex h-7 w-7 items-center justify-center rounded-button text-text-muted hover:bg-card-hover hover:text-text-primary"
            >
              <Copy size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {temSenha && (
          <button
            type="button"
            onClick={verAtual}
            disabled={buscando}
            className="text-[11px] text-accent-text hover:underline disabled:opacity-50"
          >
            {buscando ? "Abrindo…" : "Ver a senha atual"}
          </button>
        )}
        <Tooltip text="Guardada cifrada, igual aos tokens do app. Ela não sai na listagem: só quando alguém pede, e some da tela sozinha depois de 30 segundos." />
      </div>
    </div>
  );
}
