"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, FileJson, ListChecks } from "@/components/ui/icones";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { MODELO_JSON, lerJsonDeSwipe, type CamposSwipe } from "@/lib/swipes";

export interface LeituraOk {
  campos: Partial<CamposSwipe>;
  preenchidos: string[];
  avisos: string[];
}

/**
 * Caixa de colar o JSON do produto. Não salva nada: lê, preenche os campos
 * (via onLido) e deixa a pessoa revisar no formulário.
 */
export function ColarJson({ onLido, rotuloBotao = "Ler e preencher" }: { onLido: (r: LeituraOk) => void; rotuloBotao?: string }) {
  const toast = useToast();
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function ler() {
    const r = lerJsonDeSwipe(texto);
    if (!r.ok) {
      setErro(r.erro);
      return;
    }
    setErro(null);
    onLido(r);
  }

  async function copiarModelo() {
    try {
      await navigator.clipboard.writeText(MODELO_JSON);
      toast.success("Modelo copiado.");
    } catch {
      toast.error("Não deu pra copiar — o navegador bloqueou.");
    }
  }

  return (
    <div>
      <Textarea
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          if (erro) setErro(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            ler();
          }
        }}
        rows={16}
        spellCheck={false}
        aria-label="JSON do produto"
        placeholder={'{\n  "nome": "Protocolo Barriga Zero 21D",\n  "nicho": "emagrecimento",\n  "preco_front": 27.90,\n  ...\n}'}
        className="font-mono text-[12px] leading-relaxed"
      />
      {erro && (
        <p role="alert" className="mt-2 text-[12px] text-danger">
          {erro}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={ler} disabled={!texto.trim()}>
          <FileJson size={14} />
          {rotuloBotao}
        </Button>
        <Button type="button" variant="ghost" onClick={copiarModelo}>
          <Copy size={14} />
          Copiar modelo
        </Button>
        <span className="text-[11px] text-text-muted">
          Aceita o miolo sem as chaves de fora e vírgula sobrando. Ctrl+Enter lê.
        </span>
      </div>
    </div>
  );
}

/** O que o JSON preencheu e o que ficou de fora — mostrado em cima do formulário. */
export function ResumoLeitura({ leitura, onFechar }: { leitura: LeituraOk; onFechar: () => void }) {
  return (
    <div className="mb-5 border border-frame-line bg-frame-soft p-4" role="status">
      <div className="flex items-start gap-3">
        <ListChecks size={18} className="mt-0.5 shrink-0 text-frame-text" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-text-primary">
            <CheckCircle2 size={14} className="text-success" />
            {leitura.preenchidos.length} campos preenchidos pelo JSON. Revise e salve.
          </p>
          <p className="mt-1 text-[12px] text-text-tertiary">{leitura.preenchidos.join(" · ")}</p>
          {leitura.avisos.length > 0 && (
            <ul className="mt-2 space-y-1">
              {leitura.avisos.map((a) => (
                <li key={a} className="flex items-start gap-1.5 text-[12px] text-warning">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={onFechar} className="text-[11px] text-text-muted hover:text-text-secondary">
          Ok
        </button>
      </div>
    </div>
  );
}
