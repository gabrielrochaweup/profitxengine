"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { STATUS_BM, STATUS_BM_LABEL, contarLinhas, type StatusBm } from "@/lib/tracking/bms";
import { Bloco, Cartao, ItemMenu, MenuMais, Ponto, Vazio } from "./ui";
import { cn } from "@/lib/utils";

export interface Bm {
  id: string;
  platform: "meta" | "google";
  nome: string;
  external_id: string | null;
  status: StatusBm;
  contas: string;
  paginas: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

// Ponto de status em vez de selo: a lista inteira é de status, e quatro
// selos coloridos empilhados não destacam nenhum.
const TOM: Record<StatusBm, "ok" | "neutro" | "alerta" | "erro"> = {
  ativa: "ok",
  pronta: "neutro",
  restrita: "alerta",
  bloqueada: "erro",
};

// Ativa primeiro, bloqueada por último: a pergunta que se faz olhando essa
// tela é "qual dá pra usar agora", então a resposta fica no topo.
const ORDEM: Record<StatusBm, number> = { ativa: 0, pronta: 1, restrita: 2, bloqueada: 3 };

const VAZIO = {
  nome: "",
  external_id: "",
  status: "pronta" as StatusBm,
  contas: "",
  paginas: "",
  observacoes: "",
};

export function BmsPanel({ productId, platform }: { productId: string; platform: "meta" | "google" }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [bms, setBms] = useState<Bm[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<Bm | null>(null);
  const [criando, setCriando] = useState(false);
  // O inventário de contas e páginas é consulta pontual, não o assunto da
  // linha: fica guardado atrás do chevron em vez de esticar cada item.
  const [aberta, setAberta] = useState<string | null>(null);

  const termo = platform === "meta" ? "BM" : "conta de gerente";
  const termoPlural = platform === "meta" ? "BMs" : "contas de gerente";

  useEffect(() => {
    fetch(`/api/tracking/bms?product_id=${productId}`)
      .then((r) => r.json())
      .then((d) => setBms(d.bms ?? []))
      .finally(() => setCarregando(false));
  }, [productId]);

  const daPlataforma = bms
    .filter((b) => b.platform === platform)
    .sort((a, b) => ORDEM[a.status] - ORDEM[b.status] || a.nome.localeCompare(b.nome));

  const ativas = daPlataforma.filter((b) => b.status === "ativa").length;

  async function excluir(bm: Bm) {
    const ok = await confirm({
      title: `Excluir ${bm.nome}?`,
      description: "Some do inventário aqui. Não mexe em nada dentro do Meta/Google.",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/tracking/bms/${bm.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Falha ao excluir.");
      return;
    }
    setBms((prev) => prev.filter((b) => b.id !== bm.id));
  }

  // Trocar o status é o gesto mais frequente aqui (uma cai, outra entra),
  // então ele fica direto na linha em vez de atrás do formulário de edição.
  async function trocarStatus(bm: Bm, status: StatusBm) {
    const antes = bm.status;
    setBms((prev) => prev.map((b) => (b.id === bm.id ? { ...b, status } : b)));
    const res = await fetch(`/api/tracking/bms/${bm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setBms((prev) => prev.map((b) => (b.id === bm.id ? { ...b, status: antes } : b)));
      toast.error("Falha ao mudar o status.");
    }
  }

  if (carregando) return <Cartao className="text-sm text-text-secondary">Carregando…</Cartao>;

  return (
    <Bloco
      titulo={platform === "meta" ? "Business Managers" : "Contas de gerente (MCC)"}
      dica={
        <Tooltip
          text={`Inventário de ${termoPlural}: o que existe, o que cada uma tem dentro e qual dá pra usar agora. Não conversa com o Meta/Google — é registro manual, preenchido por quem organiza as contas.`}
        />
      }
      acoes={
        <>
          {daPlataforma.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-text-tertiary">
              <Ponto tom={ativas > 0 ? "ok" : "alerta"} />
              <span className="font-semibold tabular-nums text-text-primary">{ativas}</span>
              {ativas === 1 ? "ativa" : "ativas"} de {daPlataforma.length}
            </span>
          )}
          <Button size="sm" onClick={() => setCriando(true)}>
            Adicionar {termo}
          </Button>
        </>
      }
    >
      {daPlataforma.length === 0 ? (
        <Cartao>
          <Vazio>Nenhuma {termo} cadastrada ainda.</Vazio>
        </Cartao>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-card bg-card shadow-card">
          {daPlataforma.map((bm) => {
            const temDetalhe = !!(bm.contas.trim() || bm.paginas.trim() || bm.observacoes);
            const aberto = aberta === bm.id;
            return (
              <div key={bm.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {temDetalhe ? (
                      <button
                        type="button"
                        onClick={() => setAberta(aberto ? null : bm.id)}
                        aria-label={aberto ? "Fechar detalhes" : "Ver detalhes"}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-button text-text-tertiary transition-colors hover:bg-card-hover hover:text-text-primary"
                      >
                        <ChevronDown size={14} className={cn("transition-transform", aberto && "rotate-180")} />
                      </button>
                    ) : (
                      <span className="h-5 w-5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-text-primary">{bm.nome}</span>
                        <span className="inline-flex items-center gap-1.5 text-[11px]">
                          <Ponto tom={TOM[bm.status]} />
                          <span className="text-text-tertiary">{STATUS_BM_LABEL[bm.status]}</span>
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-text-tertiary">
                        {bm.external_id ? `ID ${bm.external_id} · ` : ""}
                        {contarLinhas(bm.contas)} {contarLinhas(bm.contas) === 1 ? "conta" : "contas"} ·{" "}
                        {contarLinhas(bm.paginas)} {contarLinhas(bm.paginas) === 1 ? "página" : "páginas"}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <Select
                      className="h-8 w-40 text-xs"
                      value={bm.status}
                      onChange={(e) => trocarStatus(bm, e.target.value as StatusBm)}
                    >
                      {STATUS_BM.map((st) => (
                        <option key={st} value={st}>
                          {STATUS_BM_LABEL[st]}
                        </option>
                      ))}
                    </Select>
                    <MenuMais>
                      {(fechar) => (
                        <>
                          <ItemMenu
                            icone={<Pencil size={13} />}
                            onClick={() => {
                              setEditando(bm);
                              fechar();
                            }}
                          >
                            Editar
                          </ItemMenu>
                          <ItemMenu
                            perigo
                            icone={<Trash2 size={13} />}
                            onClick={() => {
                              excluir(bm);
                              fechar();
                            }}
                          >
                            Excluir
                          </ItemMenu>
                        </>
                      )}
                    </MenuMais>
                  </div>
                </div>

                {aberto && temDetalhe && (
                  <div className="grid grid-cols-1 gap-4 border-t border-border bg-card-hover/40 px-4 py-3 sm:grid-cols-2">
                    {bm.contas.trim() && <Lista titulo="Contas de anúncio" texto={bm.contas} />}
                    {bm.paginas.trim() && <Lista titulo="Páginas" texto={bm.paginas} />}
                    {bm.observacoes && (
                      <div className="sm:col-span-2">
                        <p className="mb-1 text-[10px] uppercase tracking-wide text-text-tertiary">Observações</p>
                        <p className="text-[11px] text-text-secondary">{bm.observacoes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {criando && (
        <FormularioBm
          titulo={`Adicionar ${termo}`}
          platform={platform}
          productId={productId}
          onFechar={() => setCriando(false)}
          onSalvo={(bm) => {
            setBms((prev) => [...prev, bm]);
            setCriando(false);
          }}
        />
      )}
      {editando && (
        <FormularioBm
          titulo={`Editar ${editando.nome}`}
          platform={platform}
          productId={productId}
          bm={editando}
          onFechar={() => setEditando(null)}
          onSalvo={(bm) => {
            setBms((prev) => prev.map((b) => (b.id === bm.id ? bm : b)));
            setEditando(null);
          }}
        />
      )}
    </Bloco>
  );
}

function Lista({ titulo, texto }: { titulo: string; texto: string }) {
  const itens = texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wide text-text-tertiary">{titulo}</p>
      <ul className="space-y-0.5">
        {itens.map((item, i) => (
          <li key={`${item}-${i}`} className="text-[11px] text-text-secondary">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormularioBm({
  titulo,
  platform,
  productId,
  bm,
  onFechar,
  onSalvo,
}: {
  titulo: string;
  platform: "meta" | "google";
  productId: string;
  bm?: Bm;
  onFechar: () => void;
  onSalvo: (bm: Bm) => void;
}) {
  const toast = useToast();
  const [campos, setCampos] = useState(
    bm
      ? {
          nome: bm.nome,
          external_id: bm.external_id ?? "",
          status: bm.status,
          contas: bm.contas,
          paginas: bm.paginas,
          observacoes: bm.observacoes ?? "",
        }
      : VAZIO
  );
  const [salvando, setSalvando] = useState(false);

  function set<K extends keyof typeof VAZIO>(k: K, v: (typeof VAZIO)[K]) {
    setCampos((prev) => ({ ...prev, [k]: v }));
  }

  async function salvar() {
    if (!campos.nome.trim()) {
      toast.error("O nome é obrigatório.");
      return;
    }
    setSalvando(true);
    const res = bm
      ? await fetch(`/api/tracking/bms/${bm.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(campos),
        })
      : await fetch("/api/tracking/bms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...campos, product_id: productId, platform }),
        });
    setSalvando(false);
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.bm) {
      toast.error(json?.error ?? "Falha ao salvar.");
      return;
    }
    onSalvo(json.bm);
  }

  return (
    <Modal open onClose={onFechar} title={titulo}>
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-secondary">Nome</label>
            <Input
              value={campos.nome}
              onChange={(e) => set("nome", e.target.value)}
              placeholder={platform === "meta" ? "BM 03 — ProfitX" : "MCC ProfitX"}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-secondary">
              ID <span className="text-text-muted/70">(opcional)</span>
            </label>
            <Input
              value={campos.external_id}
              onChange={(e) => set("external_id", e.target.value)}
              placeholder={platform === "meta" ? "1234567890" : "123-456-7890"}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-secondary">Status</label>
          <Select value={campos.status} onChange={(e) => set("status", e.target.value as StatusBm)}>
            {STATUS_BM.map((s) => (
              <option key={s} value={s}>
                {STATUS_BM_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-secondary">
            Contas de anúncio <span className="text-text-muted/70">(uma por linha)</span>
          </label>
          <Textarea
            rows={4}
            value={campos.contas}
            onChange={(e) => set("contas", e.target.value)}
            placeholder={"CA 06 — 2559014681179447\nCA 07 — 8891234567890123"}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-secondary">
            Páginas <span className="text-text-muted/70">(uma por linha)</span>
          </label>
          <Textarea
            rows={3}
            value={campos.paginas}
            onChange={(e) => set("paginas", e.target.value)}
            placeholder={"Escola ProfitX\nProfitX Oficial"}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-text-secondary">
            Observações <span className="text-text-muted/70">(opcional)</span>
          </label>
          <Textarea
            rows={2}
            value={campos.observacoes}
            onChange={(e) => set("observacoes", e.target.value)}
            placeholder="Com restrição desde 12/09, em recurso"
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
