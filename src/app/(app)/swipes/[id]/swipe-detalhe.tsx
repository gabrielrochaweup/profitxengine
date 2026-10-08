"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  FileJson,
  Globe,
  Image as IconeImagem,
  Megaphone,
  Pencil,
  ShoppingCart,
  Trash2,
  Trophy,
  Video,
} from "@/components/ui/icones";
import { createClient } from "@/lib/supabase/client";
import { Panel } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { MenuMais, ItemMenu } from "@/components/ui/menu-mais";
import { RotuloSecao } from "@/components/ui/faixa";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  STATUS_SWIPE,
  camposDoSwipe,
  diasDesde,
  formatarData,
  formatarPreco,
  jsonDoSwipe,
  linhaDosCampos,
  registrarContagem,
  rotuloFormato,
  tendenciaAnuncios,
  ticketMaximo,
  type CamposSwipe,
  type Swipe,
} from "@/lib/swipes";
import { ScoreBarra } from "../components/score";
import { SwipeForm } from "../components/swipe-form";
import { BarraSalvar } from "../components/barra-salvar";
import { ColarJson, ResumoLeitura, type LeituraOk } from "../components/colar-json";
import { GaleriaPrints } from "../components/prints";

const BUCKET_PRINTS = "/storage/v1/object/public/swipe-prints/";

export function SwipeDetalhe({ inicial }: { inicial: Swipe }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [swipe, setSwipe] = useState<Swipe>(inicial);
  const [campos, setCampos] = useState<CamposSwipe | null>(null);
  const [leitura, setLeitura] = useState<LeituraOk | null>(null);
  const [colando, setColando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  /** Grava um pedaço do swipe e troca o estado pelo que o banco devolveu. */
  async function atualizar(patch: Partial<Swipe>, sucesso?: string): Promise<boolean> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("swipes")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", swipe.id)
      .select("*")
      .single();
    if (error || !data) {
      toast.error("Falha ao salvar.");
      return false;
    }
    setSwipe(data);
    if (sucesso) toast.success(sucesso);
    return true;
  }

  function editar(base?: Partial<CamposSwipe>) {
    setCampos({ ...camposDoSwipe(swipe), ...base });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarEdicao() {
    if (!campos) return;
    const linha = linhaDosCampos(campos);
    if (!linha.nome) {
      toast.error("O produto precisa de um nome.");
      document.getElementById("sw-nome")?.focus();
      return;
    }
    setSalvando(true);
    const ok = await atualizar(
      { ...linha, historico_anuncios: registrarContagem(swipe.historico_anuncios, linha.anuncios_ativos) },
      "Swipe atualizado."
    );
    setSalvando(false);
    if (ok) {
      setCampos(null);
      setLeitura(null);
      router.refresh();
    }
  }

  async function copiarJson() {
    try {
      await navigator.clipboard.writeText(jsonDoSwipe(swipe));
      toast.success("JSON copiado.");
    } catch {
      toast.error("Não deu pra copiar — o navegador bloqueou.");
    }
  }

  async function excluir() {
    const ok = await confirm({
      title: `Excluir "${swipe.nome}"?`,
      description: "A ficha e os prints enviados por aqui somem de vez. Não dá pra desfazer.",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("swipes").delete().eq("id", swipe.id);
    if (error) {
      toast.error("Falha ao excluir.");
      return;
    }
    // Só os prints que moram no nosso bucket; endereço de fora não é nosso.
    const caminhos = swipe.prints.filter((p) => p.includes(BUCKET_PRINTS)).map((p) => p.split(BUCKET_PRINTS)[1]);
    if (caminhos.length) await supabase.storage.from("swipe-prints").remove(caminhos);
    toast.success("Swipe excluído.");
    router.push("/swipes");
    router.refresh();
  }

  const voltar = (
    <Link
      href="/swipes"
      className="mb-3 inline-flex items-center gap-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-text-tertiary hover:text-text-primary"
    >
      <ArrowLeft size={13} />
      Swipes
    </Link>
  );

  // ── Editando ──
  if (campos) {
    return (
      <div>
        {voltar}
        <PageHeader titulo={`Editar · ${swipe.nome}`} descricao="Tudo continua editável. A contagem de anúncios nova entra no histórico com a data de hoje." />
        {leitura && <ResumoLeitura leitura={leitura} onFechar={() => setLeitura(null)} />}
        <SwipeForm productId={swipe.product_id} valor={campos} onChange={setCampos} />
        <BarraSalvar
          salvando={salvando}
          onSalvar={salvarEdicao}
          onCancelar={() => {
            setCampos(null);
            setLeitura(null);
          }}
          rotulo="Salvar alterações"
        />
      </div>
    );
  }

  // ── Ficha ──
  const formato = rotuloFormato(swipe.formato_pagina);
  const status = STATUS_SWIPE.find((s) => s.key === swipe.status)!;
  const meta = [swipe.nicho, swipe.subnicho, swipe.plataforma, swipe.pais_idioma].filter(Boolean).join(" · ");

  return (
    <div>
      {voltar}
      <PageHeader
        titulo={swipe.nome}
        descricao={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={status.tom}>{status.label}</Badge>
            {formato && <Badge>{formato}</Badge>}
            {meta && <span>{meta}</span>}
          </span>
        }
        acoes={
          <>
            <Button variant="secondary" onClick={copiarJson}>
              <Copy size={14} />
              Copiar JSON
            </Button>
            <Button onClick={() => editar()}>
              <Pencil size={14} />
              Editar
            </Button>
            <MenuMais>
              {(fechar) => (
                <>
                  <ItemMenu
                    icone={<FileJson size={13} />}
                    onClick={() => {
                      fechar();
                      setColando(true);
                    }}
                  >
                    Colar JSON por cima
                  </ItemMenu>
                  <ItemMenu
                    perigo
                    icone={<Trash2 size={13} />}
                    onClick={() => {
                      fechar();
                      void excluir();
                    }}
                  >
                    Excluir swipe
                  </ItemMenu>
                </>
              )}
            </MenuMais>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="min-w-0 space-y-5 xl:col-span-8">
          <PainelPromessa swipe={swipe} />
          <PainelOferta swipe={swipe} />
          <PainelCriativos swipe={swipe} />
          <Panel title="Prints" icon={IconeImagem}>
            {swipe.prints.length ? (
              <GaleriaPrints prints={swipe.prints} />
            ) : (
              <Vazio onEditar={() => editar()}>Nenhum print salvo. Na edição dá pra colar um print direto do Ctrl+V.</Vazio>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-5 xl:col-span-4">
          <Panel title="Análise" icon={Trophy}>
            <RotuloSecao>Score</RotuloSecao>
            <ScoreBarra
              valor={swipe.score}
              onChange={(v) => void atualizar({ score: v })}
              grande
              className="mt-2"
            />
            <p className="mt-1 text-[11px] text-text-muted">Clique num segmento pra mudar a nota.</p>

            <RotuloSecao className="mt-5">Status</RotuloSecao>
            <div role="radiogroup" aria-label="Status" className="mt-2 flex flex-wrap gap-1.5">
              {STATUS_SWIPE.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  role="radio"
                  aria-checked={swipe.status === s.key}
                  onClick={() => swipe.status !== s.key && void atualizar({ status: s.key }, `Marcado como "${s.label}".`)}
                  className={cn(
                    "h-8 border px-3 font-display text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors",
                    swipe.status === s.key
                      ? "border-frame bg-frame-soft text-frame-text"
                      : "border-border text-text-tertiary hover:border-border-strong hover:text-text-secondary"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <RotuloSecao className="mt-5">Por que achei boa</RotuloSecao>
            {swipe.por_que_achei_boa ? (
              <p className="mt-2 whitespace-pre-line border-l-2 border-frame pl-3 text-[13px] leading-relaxed text-text-primary">
                {swipe.por_que_achei_boa}
              </p>
            ) : (
              <p className="mt-2 text-[12px] text-text-muted">Sem anotação.</p>
            )}
          </Panel>

          <PainelTrafego swipe={swipe} onRegistrar={(n) => atualizar({ anuncios_ativos: n, historico_anuncios: registrarContagem(swipe.historico_anuncios, n) }, "Contagem registrada.")} />

          <p className="px-1 text-[11px] text-text-muted">
            Salvo em {new Date(swipe.created_at).toLocaleDateString("pt-BR")} · atualizado em{" "}
            {new Date(swipe.updated_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      <Modal open={colando} onClose={() => setColando(false)} title="Colar JSON por cima" className="max-w-2xl">
        <p className="mb-3 text-[12px] text-text-tertiary">
          Só os campos que vierem no JSON mudam; o resto continua como está. Você revisa no formulário antes de salvar.
        </p>
        <ColarJson
          rotuloBotao="Aplicar nos campos"
          onLido={(r) => {
            setColando(false);
            setLeitura(r);
            editar(r.campos);
          }}
        />
      </Modal>
    </div>
  );
}

// ── Painéis da ficha ────────────────────────────────────────────────────

function LinkExterno({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex h-8 items-center gap-1.5 border border-border bg-card-hover px-3 font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-text-primary transition-colors hover:border-accent hover:text-accent-text"
    >
      {children}
      <ExternalLink size={12} />
    </a>
  );
}

function Vazio({ children, onEditar }: { children: ReactNode; onEditar?: () => void }) {
  return (
    <p className="text-[12px] text-text-muted">
      {children}{" "}
      {onEditar && (
        <button type="button" onClick={onEditar} className="text-accent-text hover:underline">
          Editar
        </button>
      )}
    </p>
  );
}

function PainelPromessa({ swipe }: { swipe: Swipe }) {
  const temLinks = swipe.link_pagina_vendas || swipe.link_checkout;
  return (
    <Panel title="Promessa e mecanismo" icon={Globe}>
      {swipe.promessa ? (
        <blockquote className="border-l-[3px] border-frame bg-frame-soft py-3 pl-4 pr-3 font-display text-[19px] font-semibold leading-snug text-text-primary">
          {swipe.promessa}
        </blockquote>
      ) : (
        <Vazio>Sem promessa anotada.</Vazio>
      )}
      {swipe.mecanismo && (
        <div className="mt-5">
          <RotuloSecao>Mecanismo</RotuloSecao>
          <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-text-secondary">{swipe.mecanismo}</p>
        </div>
      )}
      {temLinks && (
        <div className="mt-5 flex flex-wrap gap-2">
          {swipe.link_pagina_vendas && <LinkExterno href={swipe.link_pagina_vendas}>Página de vendas</LinkExterno>}
          {swipe.link_checkout && <LinkExterno href={swipe.link_checkout}>Checkout</LinkExterno>}
        </div>
      )}
    </Panel>
  );
}

function PainelOferta({ swipe }: { swipe: Swipe }) {
  const ticket = ticketMaximo(swipe);
  const preco = (v: number | null) => formatarPreco(v, swipe.pais_idioma);

  const etapas: { rotulo: string; itens: { nome: string; preco: number | null }[]; vazio: string }[] = [
    { rotulo: "Front", itens: [{ nome: "Produto principal", preco: swipe.preco_front }], vazio: "" },
    { rotulo: "Order bumps", itens: swipe.order_bumps, vazio: "Sem order bump" },
    { rotulo: "Upsells", itens: swipe.upsells, vazio: "Sem upsell" },
  ];

  return (
    <Panel
      title="Oferta"
      icon={ShoppingCart}
      actions={
        ticket !== null ? (
          <div className="text-right">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">Ticket máximo</p>
            <p className="font-display text-[20px] font-semibold tabular-nums text-text-primary">{preco(ticket)}</p>
          </div>
        ) : undefined
      }
    >
      {/* A esteira da oferta, na ordem em que o comprador passa por ela. */}
      <ol className="grid grid-cols-1 gap-px bg-border sm:grid-cols-3">
        {etapas.map((etapa, i) => (
          <li key={etapa.rotulo} className="min-w-0 bg-app p-3.5">
            <p className="flex items-center gap-2 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-frame-text">
              <span className="flex h-4 w-4 items-center justify-center bg-frame text-[9px] text-frame-contrast">{i + 1}</span>
              {etapa.rotulo}
            </p>
            {i === 0 ? (
              <p className="mt-2 font-display text-[26px] font-semibold leading-none tabular-nums text-text-primary">
                {preco(swipe.preco_front)}
              </p>
            ) : etapa.itens.length === 0 ? (
              <p className="mt-2 text-[12px] text-text-muted">{etapa.vazio}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {etapa.itens.map((item, j) => (
                  <li key={j} className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="min-w-0 text-text-secondary">{item.nome || "Sem nome"}</span>
                    <span className="shrink-0 font-display font-semibold tabular-nums text-text-primary">{preco(item.preco)}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function PainelCriativos({ swipe }: { swipe: Swipe }) {
  const toast = useToast();
  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Gancho copiado.");
    } catch {
      toast.error("Não deu pra copiar.");
    }
  }
  return (
    <Panel title="Criativos" icon={Video}>
      {swipe.tipos_criativo.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {swipe.tipos_criativo.map((t) => (
            <span key={t} className="border border-frame-line bg-frame-soft px-2.5 py-1 text-[12px] text-text-primary">
              {t}
            </span>
          ))}
        </div>
      )}
      <RotuloSecao>Ganchos</RotuloSecao>
      {swipe.ganchos.length === 0 ? (
        <p className="mt-2 text-[12px] text-text-muted">Nenhum gancho anotado.</p>
      ) : (
        <ol className="mt-2 divide-y divide-border border border-border">
          {swipe.ganchos.map((g, i) => (
            <li key={i} className="group flex items-start gap-3 bg-app px-3 py-2.5">
              <span className="mt-px w-6 shrink-0 font-display text-[13px] font-bold tabular-nums text-frame-text">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="min-w-0 flex-1 whitespace-pre-line text-[13px] leading-relaxed text-text-primary">{g}</p>
              <button
                type="button"
                onClick={() => void copiar(g)}
                aria-label={`Copiar gancho ${i + 1}`}
                className="shrink-0 text-text-muted opacity-0 transition-opacity hover:text-text-primary focus:opacity-100 group-hover:opacity-100"
              >
                <Copy size={14} />
              </button>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function PainelTrafego({ swipe, onRegistrar }: { swipe: Swipe; onRegistrar: (n: number) => Promise<boolean> }) {
  const [nova, setNova] = useState("");
  const [registrando, setRegistrando] = useState(false);
  const dias = diasDesde(swipe.rodando_desde);
  const tendencia = tendenciaAnuncios(swipe.historico_anuncios);
  const historico = [...swipe.historico_anuncios].sort((a, b) => a.data.localeCompare(b.data)).slice(-14);
  const maximo = Math.max(1, ...historico.map((h) => h.valor));

  async function registrar() {
    const n = Number(nova.replace(/\D/g, ""));
    if (!nova.trim() || !Number.isFinite(n)) return;
    setRegistrando(true);
    const ok = await onRegistrar(n);
    setRegistrando(false);
    if (ok) setNova("");
  }

  return (
    <Panel title="Tráfego" icon={Megaphone}>
      <div className="grid grid-cols-2 gap-px bg-border">
        <div className="bg-app p-3">
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">Anúncios ativos</p>
          <p className="mt-1.5 font-display text-[28px] font-semibold leading-none tabular-nums text-text-primary">
            {swipe.anuncios_ativos ?? "—"}
          </p>
        </div>
        <div className="bg-app p-3">
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">Rodando há</p>
          <p className="mt-1.5 font-display text-[28px] font-semibold leading-none tabular-nums text-text-primary">
            {dias === null ? "—" : dias}
            {dias !== null && <span className="ml-1 text-[13px] text-text-muted">dias</span>}
          </p>
          {swipe.rodando_desde && <p className="mt-1 text-[11px] text-text-muted">desde {formatarData(swipe.rodando_desde)}</p>}
        </div>
      </div>

      {tendencia && (
        <p
          className={cn(
            "mt-3 text-[12px]",
            tendencia.para > tendencia.de ? "text-success" : tendencia.para < tendencia.de ? "text-danger" : "text-text-tertiary"
          )}
        >
          {tendencia.para > tendencia.de ? "▲ Escalando" : tendencia.para < tendencia.de ? "▼ Reduzindo" : "■ Estável"}: de{" "}
          {tendencia.de} pra {tendencia.para} anúncios em {tendencia.dias} {tendencia.dias === 1 ? "dia" : "dias"}.
        </p>
      )}

      {historico.length > 1 && (
        <div className="mt-3">
          <div className="flex h-16 items-end gap-1 border-b border-border" aria-label="Histórico de anúncios ativos" role="img">
            {historico.map((h) => (
              <div
                key={h.data}
                title={`${formatarData(h.data)}: ${h.valor} anúncios`}
                className="min-w-[6px] flex-1 bg-frame opacity-70 transition-opacity hover:opacity-100"
                style={{ height: `${Math.max(6, (h.valor / maximo) * 100)}%` }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-text-muted">
            <span>{formatarData(historico[0].data)}</span>
            <span>{formatarData(historico[historico.length - 1].data)}</span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <RotuloSecao>Nova contagem</RotuloSecao>
        <div className="mt-2 flex gap-2">
          <Input
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void registrar()}
            inputMode="numeric"
            placeholder="anúncios ativos hoje"
            aria-label="Anúncios ativos hoje"
          />
          <Button variant="secondary" onClick={() => void registrar()} disabled={!nova.trim() || registrando}>
            Registrar
          </Button>
        </div>
        <p className="mt-1 text-[11px] text-text-muted">Olhou a Ad Library de novo? Registre aqui e a tendência se atualiza.</p>
      </div>

      {(swipe.pagina_fb || swipe.link_ad_library) && (
        <div className="mt-5 space-y-2 border-t border-border pt-4">
          {swipe.pagina_fb && (
            <p className="text-[13px] text-text-secondary">
              <span className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">Página · </span>
              {swipe.pagina_fb}
            </p>
          )}
          {swipe.link_ad_library && <LinkExterno href={swipe.link_ad_library}>Abrir na Ad Library</LinkExterno>}
        </div>
      )}
    </Panel>
  );
}
