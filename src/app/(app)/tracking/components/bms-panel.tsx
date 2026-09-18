"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { STATUS_BM, STATUS_BM_LABEL, contarLinhas, type StatusBm } from "@/lib/tracking/bms";

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

const TOM: Record<StatusBm, "success" | "neutral" | "warning" | "danger"> = {
  ativa: "success",
  pronta: "neutral",
  restrita: "warning",
  bloqueada: "danger",
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

  if (carregando) return <Card className="p-5 text-sm text-text-secondary">Carregando…</Card>;

  return (
    <Card className="p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-semibold text-text-primary">
            {platform === "meta" ? "Business Managers" : "Contas de gerente (MCC)"}
          </h3>
          <Tooltip
            text={`Inventário de ${termoPlural}: o que existe, o que cada uma tem dentro e qual dá pra usar agora. Não conversa com o Meta/Google — é registro manual, preenchido por quem organiza as contas.`}
          />
          {daPlataforma.length > 0 && (
            <Badge tone={ativas > 0 ? "success" : "warning"}>
              {ativas} {ativas === 1 ? "ativa" : "ativas"} de {daPlataforma.length}
            </Badge>
          )}
        </div>
        <Button size="sm" onClick={() => setCriando(true)}>
          Adicionar {termo}
        </Button>
      </div>

      {daPlataforma.length === 0 ? (
        <p className="text-xs text-text-muted">
          Nenhuma {termo} cadastrada ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {daPlataforma.map((bm) => (
            <div key={bm.id} className="rounded-xl bg-card-hover p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{bm.nome}</span>
                    <Badge tone={TOM[bm.status]}>{STATUS_BM_LABEL[bm.status]}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {bm.external_id ? `ID ${bm.external_id} · ` : ""}
                    {contarLinhas(bm.contas)} {contarLinhas(bm.contas) === 1 ? "conta" : "contas"} ·{" "}
                    {contarLinhas(bm.paginas)} {contarLinhas(bm.paginas) === 1 ? "página" : "páginas"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    className="w-44"
                    value={bm.status}
                    onChange={(e) => trocarStatus(bm, e.target.value as StatusBm)}
                  >
                    {STATUS_BM.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_BM_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                  <Button size="sm" variant="secondary" onClick={() => setEditando(bm)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => excluir(bm)}>
                    Excluir
                  </Button>
                </div>
              </div>

              {(bm.contas.trim() || bm.paginas.trim() || bm.observacoes) && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {bm.contas.trim() && <Lista titulo="Contas de anúncio" texto={bm.contas} />}
                  {bm.paginas.trim() && <Lista titulo="Páginas" texto={bm.paginas} />}
                  {bm.observacoes && (
                    <div className="sm:col-span-2">
                      <p className="mb-1 text-[10px] uppercase tracking-wide text-text-muted">Observações</p>
                      <p className="text-[11px] text-text-secondary">{bm.observacoes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
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
    </Card>
  );
}

function Lista({ titulo, texto }: { titulo: string; texto: string }) {
  const itens = texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wide text-text-muted">{titulo}</p>
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
