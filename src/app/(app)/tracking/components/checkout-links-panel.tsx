"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "@/components/ui/icones";
import { Button } from "@/components/ui/button";
import { Bloco, Cartao, ItemMenu, MenuMais, Vazio } from "./ui";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";

export interface CheckoutLink {
  id: string;
  plano: string;
  checkout: string;
  url: string;
  position: number;
  created_at: string;
}

interface CamposLink {
  plano: string;
  checkout: string;
  url: string;
}

const VAZIO: CamposLink = { plano: "", checkout: "", url: "" };

export function CheckoutLinksPanel({
  productId,
  onUsar,
  atual,
}: {
  productId: string;
  /** Joga o link escolhido no campo de destino do gerador acima. */
  onUsar: (url: string) => void;
  /** O que está no campo de destino agora, pra destacar o que está em uso. */
  atual: string;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [links, setLinks] = useState<CheckoutLink[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<CheckoutLink | null>(null);
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    fetch(`/api/tracking/checkout-links?product_id=${productId}`)
      .then((r) => r.json())
      .then((d) => setLinks(d.links ?? []))
      .finally(() => setCarregando(false));
  }, [productId]);

  async function excluir(link: CheckoutLink) {
    const ok = await confirm({
      title: `Excluir ${link.plano} — ${link.checkout}?`,
      description: "Só some desta lista. O checkout continua no ar e os links já espalhados continuam funcionando.",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/tracking/checkout-links/${link.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Falha ao excluir.");
      return;
    }
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
  }

  if (carregando) return <Cartao className="text-sm text-text-secondary">Carregando…</Cartao>;

  return (
    <Bloco
      titulo="Links de checkout"
      dica={
        <Tooltip text="Os checkouts em uso hoje. Clicar joga o link no campo de destino acima — assim a UTM é montada em cima da oferta certa, sem depender de lembrar qual hash é de qual plano." />
      }
      acoes={
        <Button size="sm" variant="secondary" onClick={() => setCriando(true)}>
          Novo checkout
        </Button>
      }
    >
      <p className="-mt-1 mb-3 text-[11px] text-text-tertiary">
        Guarde o link limpo, sem UTM. Quem pendura utm_source e companhia é o gerador aqui de cima.
      </p>

      {links.length === 0 ? (
        <Cartao>
          <Vazio>Nenhum checkout salvo ainda.</Vazio>
        </Cartao>
      ) : (
        // Cartões menores e em grade: são atalhos pra preencher um campo, não
        // registros pra ler.
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {links.map((link) => {
            const emUso = atual.trim() === link.url;
            return (
              <div
                key={link.id}
                className={
                  "flex items-center gap-1 rounded-card px-3 py-2 shadow-card transition-colors " +
                  (emUso ? "bg-accent-soft" : "bg-card hover:bg-card-hover")
                }
              >
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onUsar(link.url)}>
                  <span className="block truncate text-[13px] font-medium text-text-primary">
                    {link.plano} — {link.checkout}
                  </span>
                  <span className="block truncate font-mono text-[11px] text-text-tertiary">{link.url}</span>
                </button>
                <MenuMais>
                  {(fechar) => (
                    <>
                      <ItemMenu
                        icone={<Pencil size={13} />}
                        onClick={() => {
                          setEditando(link);
                          fechar();
                        }}
                      >
                        Editar
                      </ItemMenu>
                      <ItemMenu
                        perigo
                        icone={<Trash2 size={13} />}
                        onClick={() => {
                          excluir(link);
                          fechar();
                        }}
                      >
                        Excluir
                      </ItemMenu>
                    </>
                  )}
                </MenuMais>
              </div>
            );
          })}
        </div>
      )}

      {criando && (
        <FormularioLink
          titulo="Novo checkout"
          productId={productId}
          inicial={{ ...VAZIO, url: atual.trim() }}
          onFechar={() => setCriando(false)}
          onSalvo={(l) => {
            setLinks((prev) => [...prev, l]);
            setCriando(false);
          }}
        />
      )}
      {editando && (
        <FormularioLink
          titulo={`Editar ${editando.plano} — ${editando.checkout}`}
          productId={productId}
          link={editando}
          inicial={{ plano: editando.plano, checkout: editando.checkout, url: editando.url }}
          onFechar={() => setEditando(null)}
          onSalvo={(l) => {
            setLinks((prev) => prev.map((x) => (x.id === l.id ? l : x)));
            setEditando(null);
          }}
        />
      )}
    </Bloco>
  );
}

function FormularioLink({
  titulo,
  productId,
  link,
  inicial,
  onFechar,
  onSalvo,
}: {
  titulo: string;
  productId: string;
  link?: CheckoutLink;
  inicial: CamposLink;
  onFechar: () => void;
  onSalvo: (l: CheckoutLink) => void;
}) {
  const toast = useToast();
  const [campos, setCampos] = useState(inicial);
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof CamposLink>(k: K, v: string) {
    setCampos((prev) => ({ ...prev, [k]: v }));
  }

  // Aviso, não bloqueio: pode existir um caso em que faça sentido guardar um
  // link já com UTM, e quem está olhando decide. O que não pode é fazer isso
  // sem perceber — o gerador acrescentaria as UTMs por cima e a origem da
  // venda viraria a do link guardado, não a do canal de verdade.
  const jaTemUtm = /[?&]utm_/.test(campos.url);

  async function salvar() {
    if (!campos.plano.trim() || !campos.checkout.trim() || !campos.url.trim()) {
      toast.error("Plano, checkout e link são obrigatórios.");
      return;
    }
    setSalvando(true);
    const res = link
      ? await fetch(`/api/tracking/checkout-links/${link.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(campos),
        })
      : await fetch("/api/tracking/checkout-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...campos, product_id: productId }),
        });
    setSalvando(false);
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.link) {
      toast.error(json?.error ?? "Falha ao salvar.");
      return;
    }
    onSalvo(json.link);
  }

  return (
    <Modal open onClose={onFechar} title={titulo}>
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-secondary">Plano</label>
            <Input value={campos.plano} onChange={(e) => set("plano", e.target.value)} placeholder="Starter" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-secondary">Checkout</label>
            <Input value={campos.checkout} onChange={(e) => set("checkout", e.target.value)} placeholder="Onprofit" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-secondary">
            Link <span className="text-text-muted/70">(sem UTM)</span>
          </label>
          <Input
            value={campos.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://pay.onprofit.com.br/0c1LryyT?off=qjo4cq"
          />
          {jaTemUtm && (
            <p className="mt-1 text-[11px] text-warning">
              Esse link já vem com utm_. O gerador acrescenta as dele por cima, e a venda vai aparecer com a origem
              que está aqui — não com a do canal escolhido.
            </p>
          )}
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
