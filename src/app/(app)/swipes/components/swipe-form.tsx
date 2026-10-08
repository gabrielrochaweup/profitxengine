"use client";

import { useState, type ReactNode } from "react";
import { Globe, Image as IconeImagem, Megaphone, Package, Plus, ShoppingCart, Trophy, Video, X } from "@/components/ui/icones";
import { Panel } from "@/components/ui/panel";
import { ContentGrid, Field } from "@/components/ui/page";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FORMATOS_PAGINA,
  STATUS_SWIPE,
  TIPOS_CRIATIVO_SUGERIDOS,
  formatarPreco,
  lerPreco,
  type CamposSwipe,
  type ItemOfertaCampo,
} from "@/lib/swipes";
import { ScoreBarra } from "./score";
import { EditorPrints } from "./prints";

/**
 * O formulário do swipe, inteiro e controlado. Serve pra criar (com o que
 * veio do JSON já preenchido) e pra editar depois.
 */
export function SwipeForm({
  productId,
  valor,
  onChange,
}: {
  productId: string;
  valor: CamposSwipe;
  onChange: (valor: CamposSwipe) => void;
}) {
  function set<K extends keyof CamposSwipe>(chave: K, v: CamposSwipe[K]) {
    onChange({ ...valor, [chave]: v });
  }
  const texto = (chave: keyof CamposSwipe) => ({
    value: valor[chave] as string,
    onChange: (e: { target: { value: string } }) => set(chave, e.target.value as never),
  });

  const ticket =
    (lerPreco(valor.preco_front) ?? 0) +
    [...valor.order_bumps, ...valor.upsells].reduce((t, i) => t + (lerPreco(i.preco) ?? 0), 0);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Panel title="Produto" icon={Package} className="xl:col-span-2">
        <ContentGrid>
          <Field label="Nome do produto" htmlFor="sw-nome" span={12}>
            <Input id="sw-nome" {...texto("nome")} placeholder="Protocolo Barriga Zero 21D" required />
          </Field>
          <Field label="Nicho" htmlFor="sw-nicho" span={3}>
            <Input id="sw-nicho" {...texto("nicho")} placeholder="emagrecimento" />
          </Field>
          <Field label="Subnicho" htmlFor="sw-subnicho" span={3}>
            <Input id="sw-subnicho" {...texto("subnicho")} placeholder="chá / receita" />
          </Field>
          <Field label="Plataforma" htmlFor="sw-plataforma" span={3}>
            <Input id="sw-plataforma" {...texto("plataforma")} placeholder="Kiwify" />
          </Field>
          <Field label="País / idioma" htmlFor="sw-pais" span={3}>
            <Input id="sw-pais" {...texto("pais_idioma")} placeholder="BR / pt" />
          </Field>
        </ContentGrid>
      </Panel>

      <Panel title="Oferta" icon={ShoppingCart}>
        <ContentGrid>
          <Field label="Preço do front" htmlFor="sw-front" span={6}>
            <Input id="sw-front" {...texto("preco_front")} inputMode="decimal" placeholder="27,90" />
          </Field>
          <Field label="Ticket máximo" span={6} hint="front + bumps + upsells">
            <p className="flex h-9 items-center font-display text-[15px] font-semibold tabular-nums text-text-primary">
              {ticket > 0 ? formatarPreco(ticket, valor.pais_idioma) : "—"}
            </p>
          </Field>
        </ContentGrid>
        <ListaOferta titulo="Order bumps" itens={valor.order_bumps} onChange={(v) => set("order_bumps", v)} />
        <ListaOferta titulo="Upsells" itens={valor.upsells} onChange={(v) => set("upsells", v)} />
      </Panel>

      <Panel title="Tráfego" icon={Megaphone}>
        <ContentGrid>
          <Field label="Anúncios ativos" htmlFor="sw-anuncios" span={6} hint="cada mudança vira um ponto no histórico">
            <Input id="sw-anuncios" {...texto("anuncios_ativos")} inputMode="numeric" placeholder="48" />
          </Field>
          <Field label="Rodando desde" htmlFor="sw-desde" span={6}>
            <Input id="sw-desde" type="date" {...texto("rodando_desde")} />
          </Field>
          <Field label="Página do Facebook" htmlFor="sw-fb" span={12}>
            <Input id="sw-fb" {...texto("pagina_fb")} placeholder="Nome da página" />
          </Field>
          <Field label="Link da Ad Library" htmlFor="sw-adlib" span={12}>
            <Input id="sw-adlib" type="url" {...texto("link_ad_library")} placeholder="https://www.facebook.com/ads/library/?..." />
          </Field>
        </ContentGrid>
      </Panel>

      <Panel title="Página e promessa" icon={Globe}>
        <ContentGrid>
          <Field label="Formato da página" span={12}>
            <EscolhaFormato valor={valor.formato_pagina} onChange={(v) => set("formato_pagina", v)} />
          </Field>
          <Field label="Página de vendas" htmlFor="sw-pv" span={6}>
            <Input id="sw-pv" type="url" {...texto("link_pagina_vendas")} placeholder="https://..." />
          </Field>
          <Field label="Checkout" htmlFor="sw-ck" span={6}>
            <Input id="sw-ck" type="url" {...texto("link_checkout")} placeholder="https://..." />
          </Field>
          <Field label="Promessa" htmlFor="sw-promessa" span={12}>
            <Textarea id="sw-promessa" rows={2} {...texto("promessa")} placeholder="Perder 5kg em 21 dias sem academia" />
          </Field>
          <Field label="Mecanismo" htmlFor="sw-mecanismo" span={12}>
            <Textarea id="sw-mecanismo" rows={3} {...texto("mecanismo")} placeholder="Chá X que ativa..." />
          </Field>
        </ContentGrid>
      </Panel>

      <Panel title="Criativos" icon={Video}>
        <ListaGanchos ganchos={valor.ganchos} onChange={(v) => set("ganchos", v)} />
        <div className="mt-5">
          <p className="mb-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-text-secondary">
            Tipos de criativo
          </p>
          <Etiquetas valores={valor.tipos_criativo} sugestoes={TIPOS_CRIATIVO_SUGERIDOS} onChange={(v) => set("tipos_criativo", v)} />
        </div>
      </Panel>

      <Panel title="Análise" icon={Trophy} className="xl:col-span-2">
        <ContentGrid>
          <Field label="Score" span={6}>
            <ScoreBarra valor={valor.score} onChange={(v) => set("score", v)} grande />
          </Field>
          <Field label="Status" span={6}>
            <div role="radiogroup" aria-label="Status" className="flex flex-wrap gap-1.5">
              {STATUS_SWIPE.map((s) => (
                <Chip key={s.key} ativo={valor.status === s.key} onClick={() => set("status", s.key)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Por que achei boa" htmlFor="sw-porque" span={12}>
            <Textarea
              id="sw-porque"
              rows={3}
              {...texto("por_que_achei_boa")}
              placeholder="Escalando: foi de 12 para 48 anúncios em 10 dias"
            />
          </Field>
        </ContentGrid>
      </Panel>

      <Panel title="Prints" icon={IconeImagem} className="xl:col-span-2">
        <EditorPrints productId={productId} prints={valor.prints} onChange={(v) => set("prints", v)} />
      </Panel>
    </div>
  );
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativo}
      onClick={onClick}
      className={cn(
        "h-8 border px-3 font-display text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors",
        ativo
          ? "border-frame bg-frame-soft text-frame-text"
          : "border-border text-text-tertiary hover:border-border-strong hover:text-text-secondary"
      )}
    >
      {children}
    </button>
  );
}

function EscolhaFormato({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const conhecido = FORMATOS_PAGINA.some((f) => f.key === valor);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {FORMATOS_PAGINA.map((f) => (
        <Chip key={f.key} ativo={valor === f.key} onClick={() => onChange(valor === f.key ? "" : f.key)}>
          {f.label}
        </Chip>
      ))}
      <Input
        value={conhecido ? "" : valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder="outro: advertorial, webinar..."
        aria-label="Outro formato"
        className="h-8 w-56"
      />
    </div>
  );
}

function ListaOferta({
  titulo,
  itens,
  onChange,
}: {
  titulo: string;
  itens: ItemOfertaCampo[];
  onChange: (itens: ItemOfertaCampo[]) => void;
}) {
  const muda = (i: number, campo: keyof ItemOfertaCampo, v: string) =>
    onChange(itens.map((item, j) => (j === i ? { ...item, [campo]: v } : item)));
  return (
    <div className="mt-5">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-text-secondary">{titulo}</p>
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange([...itens, { nome: "", preco: "" }])}>
          <Plus size={13} />
          Adicionar
        </Button>
      </div>
      {itens.length === 0 ? (
        <p className="text-[12px] text-text-muted">Nenhum.</p>
      ) : (
        <div className="space-y-2">
          {itens.map((item, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={item.nome}
                onChange={(e) => muda(i, "nome", e.target.value)}
                placeholder="Nome"
                aria-label={`${titulo}: nome ${i + 1}`}
              />
              <Input
                value={item.preco}
                onChange={(e) => muda(i, "preco", e.target.value)}
                placeholder="Preço"
                inputMode="decimal"
                aria-label={`${titulo}: preço ${i + 1}`}
                className="w-28 shrink-0"
              />
              <BotaoTirar onClick={() => onChange(itens.filter((_, j) => j !== i))} rotulo={`Tirar ${item.nome || "item"}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ListaGanchos({ ganchos, onChange }: { ganchos: string[]; onChange: (g: string[]) => void }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-text-secondary">Ganchos</p>
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange([...ganchos, ""])}>
          <Plus size={13} />
          Adicionar
        </Button>
      </div>
      {ganchos.length === 0 ? (
        <p className="text-[12px] text-text-muted">Nenhum gancho anotado.</p>
      ) : (
        <ol className="space-y-2">
          {ganchos.map((g, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-2 w-5 shrink-0 font-display text-[12px] font-semibold tabular-nums text-frame-text">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Textarea
                value={g}
                onChange={(e) => onChange(ganchos.map((x, j) => (j === i ? e.target.value : x)))}
                rows={2}
                aria-label={`Gancho ${i + 1}`}
                placeholder="A frase de abertura do anúncio"
              />
              <BotaoTirar onClick={() => onChange(ganchos.filter((_, j) => j !== i))} rotulo={`Tirar gancho ${i + 1}`} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Etiquetas({
  valores,
  sugestoes,
  onChange,
}: {
  valores: string[];
  sugestoes: string[];
  onChange: (v: string[]) => void;
}) {
  const [novo, setNovo] = useState("");
  const tem = (t: string) => valores.some((v) => v.toLowerCase() === t.toLowerCase());
  function adicionar(t: string) {
    const limpo = t.trim();
    if (limpo && !tem(limpo)) onChange([...valores, limpo]);
    setNovo("");
  }
  const faltando = sugestoes.filter((s) => !tem(s));
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {valores.map((v) => (
          <span
            key={v}
            className="inline-flex h-7 items-center gap-1 border border-frame-line bg-frame-soft pl-2.5 pr-1 text-[12px] text-text-primary"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(valores.filter((x) => x !== v))}
              aria-label={`Tirar ${v}`}
              className="flex h-5 w-5 items-center justify-center text-text-tertiary hover:text-danger"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <Input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              adicionar(novo);
            }
          }}
          onBlur={() => novo.trim() && adicionar(novo)}
          placeholder="digite e Enter"
          aria-label="Novo tipo de criativo"
          className="h-7 w-40"
        />
      </div>
      {faltando.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {faltando.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => adicionar(s)}
              className="h-6 border border-dashed border-border px-2 text-[11px] text-text-tertiary hover:border-frame-line hover:text-text-secondary"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BotaoTirar({ onClick, rotulo }: { onClick: () => void; rotulo: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      className="flex h-9 w-9 shrink-0 items-center justify-center text-text-muted transition-colors hover:bg-danger-soft hover:text-danger"
    >
      <X size={14} />
    </button>
  );
}
