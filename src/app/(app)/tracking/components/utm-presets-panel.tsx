"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bloco, Cartao, ItemMenu, MenuMais, Vazio } from "./ui";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { normalizarValorUtm, PARAMETROS_META_DINAMICOS } from "@/lib/tracking/utm-presets";

export interface UtmPreset {
  id: string;
  nome: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  position: number;
  created_at: string;
}

export interface UtmValores {
  source: string;
  medium: string;
  campaign: string;
  content: string;
}

interface CamposPreset {
  nome: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
}

export function UtmPresetsPanel({
  productId,
  onUsar,
  atual,
}: {
  productId: string;
  /** Joga os valores do canal escolhido nos campos do gerador acima. */
  onUsar: (v: UtmValores) => void;
  /** O que está nos campos agora, pra destacar o canal em uso e pra salvar. */
  atual: UtmValores;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [presets, setPresets] = useState<UtmPreset[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<UtmPreset | null>(null);
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    fetch(`/api/tracking/utm-presets?product_id=${productId}`)
      .then((r) => r.json())
      .then((d) => setPresets(d.presets ?? []))
      .finally(() => setCarregando(false));
  }, [productId]);

  async function excluir(preset: UtmPreset) {
    const ok = await confirm({
      title: `Excluir ${preset.nome}?`,
      description: "Só some daqui. Links já gerados e relatórios antigos não mudam.",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/tracking/utm-presets/${preset.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Falha ao excluir.");
      return;
    }
    setPresets((prev) => prev.filter((p) => p.id !== preset.id));
  }

  if (carregando) return <Cartao className="text-sm text-text-secondary">Carregando…</Cartao>;

  return (
    <Bloco
      titulo="UTMs por canal"
      dica={
        <Tooltip text="Os canais que a operação usa, com a UTM já definida. Clicar joga os valores no gerador acima — é o que impede o mesmo canal de virar 'instagram' num dia e 'Instagram' no outro, o que partiria o número dele em duas linhas no relatório." />
      }
      acoes={
        <Button size="sm" variant="secondary" onClick={() => setCriando(true)}>
          Novo canal
        </Button>
      }
    >
      <p className="-mt-1 mb-3 text-[11px] text-text-tertiary">
        Clique num canal pra preencher os campos acima. O link de destino continua sendo você quem escolhe.
      </p>

      <MetaAutomatico />

      {presets.length === 0 ? (
        <Cartao>
          <Vazio>Nenhum canal salvo ainda.</Vazio>
        </Cartao>
      ) : (
        // Em coluna única cada linha ocupava a largura inteira da tela pra
        // caber um nome e duas UTMs, e os 14 canais viravam uma rolagem
        // longa. Em grade, a lista cabe quase toda numa tela só.
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {presets.map((preset) => {
            const emUso =
              preset.utm_source === atual.source &&
              preset.utm_medium === atual.medium &&
              !!preset.utm_source;
            return (
              <div
                key={preset.id}
                className={
                  "flex items-center gap-1 rounded-card px-3 py-2 shadow-card transition-colors " +
                  (emUso ? "bg-accent-soft" : "bg-card hover:bg-card-hover")
                }
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() =>
                    onUsar({
                      source: preset.utm_source,
                      medium: preset.utm_medium,
                      campaign: preset.utm_campaign,
                      content: preset.utm_content,
                    })
                  }
                >
                  <span className="block truncate text-[13px] font-medium text-text-primary">{preset.nome}</span>
                  <span className="block truncate font-mono text-[11px] text-text-tertiary">
                    {[preset.utm_source, preset.utm_medium, preset.utm_campaign, preset.utm_content]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
                <MenuMais>
                  {(fechar) => (
                    <>
                      <ItemMenu
                        icone={<Pencil size={13} />}
                        onClick={() => {
                          setEditando(preset);
                          fechar();
                        }}
                      >
                        Editar
                      </ItemMenu>
                      <ItemMenu
                        perigo
                        icone={<Trash2 size={13} />}
                        onClick={() => {
                          excluir(preset);
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
        <FormularioPreset
          titulo="Novo canal"
          productId={productId}
          inicial={{
            nome: "",
            utm_source: atual.source,
            utm_medium: atual.medium,
            utm_campaign: atual.campaign,
            utm_content: atual.content,
          }}
          onFechar={() => setCriando(false)}
          onSalvo={(p) => {
            setPresets((prev) => [...prev, p]);
            setCriando(false);
          }}
        />
      )}
      {editando && (
        <FormularioPreset
          titulo={`Editar ${editando.nome}`}
          productId={productId}
          preset={editando}
          inicial={{
            nome: editando.nome,
            utm_source: editando.utm_source,
            utm_medium: editando.utm_medium,
            utm_campaign: editando.utm_campaign,
            utm_content: editando.utm_content,
          }}
          onFechar={() => setEditando(null)}
          onSalvo={(p) => {
            setPresets((prev) => prev.map((x) => (x.id === p.id ? p : x)));
            setEditando(null);
          }}
        />
      )}
    </Bloco>
  );
}

/**
 * Meta Ads com UTM automática: uma string pra colar uma vez no anúncio.
 * Nada pra preencher — a Meta troca cada {{macro}} pelo nome/ID real da
 * campanha, do conjunto e do anúncio que gerou o clique.
 */
function MetaAutomatico() {
  const toast = useToast();
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(PARAMETROS_META_DINAMICOS);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      toast.error("O navegador bloqueou a cópia. Selecione o texto e copie à mão.");
    }
  }

  return (
    <Cartao className="mb-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-text-primary">Meta Ads — UTMs automáticas</p>
          <p className="mt-0.5 max-w-[78ch] text-[11px] leading-relaxed text-text-tertiary">
            Nada pra preencher. Cole no anúncio, no campo <strong className="font-medium text-text-secondary">Parâmetros
            de URL</strong> (em Rastreamento), e a Meta troca cada {"{{...}}"} pelo nome ou ID real da campanha, do
            conjunto e do anúncio que gerou o clique. Serve pra todas as campanhas.
          </p>
        </div>
        <Button size="sm" onClick={copiar}>
          {copiado ? "Copiado ✓" : "Copiar"}
        </Button>
      </div>
      <code
        className="mt-3 block select-all break-all rounded-input border border-border bg-input px-3 py-2 font-mono text-[11px] leading-5 text-text-primary"
      >
        {PARAMETROS_META_DINAMICOS}
      </code>
    </Cartao>
  );
}

function FormularioPreset({
  titulo,
  productId,
  preset,
  inicial,
  onFechar,
  onSalvo,
}: {
  titulo: string;
  productId: string;
  preset?: UtmPreset;
  inicial: CamposPreset;
  onFechar: () => void;
  onSalvo: (p: UtmPreset) => void;
}) {
  const toast = useToast();
  const [campos, setCampos] = useState(inicial);
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof CamposPreset>(k: K, v: string) {
    setCampos((prev) => ({ ...prev, [k]: v }));
  }

  async function salvar() {
    if (!campos.nome.trim()) {
      toast.error("O nome do canal é obrigatório.");
      return;
    }
    setSalvando(true);
    const res = preset
      ? await fetch(`/api/tracking/utm-presets/${preset.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(campos),
        })
      : await fetch("/api/tracking/utm-presets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...campos, product_id: productId }),
        });
    setSalvando(false);
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.preset) {
      toast.error(json?.error ?? "Falha ao salvar.");
      return;
    }
    onSalvo(json.preset);
  }

  // Mostra o que vai ser gravado de verdade: acento, maiúscula e espaço são
  // aparados na hora de salvar, e ver isso antes evita a surpresa de digitar
  // "Automação" e o relatório mostrar "automacao".
  const previa = [campos.utm_source, campos.utm_medium, campos.utm_campaign, campos.utm_content]
    .map(normalizarValorUtm)
    .filter(Boolean)
    .join(" · ");

  return (
    <Modal open onClose={onFechar} title={titulo}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-secondary">
            Nome do canal <span className="text-text-muted/70">(só pra você achar na lista)</span>
          </label>
          <Input
            value={campos.nome}
            onChange={(e) => set("nome", e.target.value)}
            placeholder="Instagram (bio/stories)"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-secondary">utm_source</label>
            <Input value={campos.utm_source} onChange={(e) => set("utm_source", e.target.value)} placeholder="instagram" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-secondary">utm_medium</label>
            <Input value={campos.utm_medium} onChange={(e) => set("utm_medium", e.target.value)} placeholder="bio" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-secondary">
              utm_campaign <span className="text-text-muted/70">(opcional)</span>
            </label>
            <Input
              value={campos.utm_campaign}
              onChange={(e) => set("utm_campaign", e.target.value)}
              placeholder="lancamento_setembro"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-secondary">
              utm_content <span className="text-text-muted/70">(opcional)</span>
            </label>
            <Input value={campos.utm_content} onChange={(e) => set("utm_content", e.target.value)} placeholder="video_1" />
          </div>
        </div>

        {previa && (
          <div>
            <p className="mb-1 text-[11px] font-medium text-text-muted">Vai ser salvo como</p>
            <code className="block overflow-x-auto whitespace-nowrap rounded-input bg-accent-soft px-3 py-2 font-mono text-xs">
              {previa}
            </code>
          </div>
        )}

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
