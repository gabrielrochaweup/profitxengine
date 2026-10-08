"use client";

import { useRef, useState } from "react";
import { Image as IconeImagem, Loader2, Plus, Upload, X } from "@/components/ui/icones";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

const BUCKET = "swipe-prints";

/** Galeria só de leitura: miniaturas que abrem a imagem grande. */
export function GaleriaPrints({ prints }: { prints: string[] }) {
  const [aberto, setAberto] = useState<string | null>(null);
  if (!prints.length) return null;
  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {prints.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => setAberto(url)}
            className="group relative aspect-[4/3] overflow-hidden border border-border bg-app"
            aria-label="Ver print em tamanho grande"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]" />
          </button>
        ))}
      </div>
      <Modal open={aberto !== null} onClose={() => setAberto(null)} title="Print" className="max-w-5xl">
        {aberto && (
          <a href={aberto} target="_blank" rel="noreferrer" title="Abrir em outra aba">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={aberto} alt="" className="mx-auto max-h-[75vh] w-auto" />
          </a>
        )}
      </Modal>
    </>
  );
}

/**
 * Prints no formulário: enviar do computador, colar do Ctrl+V (print de
 * tela vai direto da área de transferência) ou informar um endereço.
 */
export function EditorPrints({
  productId,
  prints,
  onChange,
}: {
  productId: string;
  prints: string[];
  onChange: (prints: string[]) => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(0);
  const [url, setUrl] = useState("");

  async function enviar(arquivos: File[]) {
    const imagens = arquivos.filter((f) => f.type.startsWith("image/"));
    if (!imagens.length) {
      if (arquivos.length) toast.error("Só imagem.");
      return;
    }
    setEnviando((n) => n + imagens.length);
    const supabase = createClient();
    const novas: string[] = [];
    for (const arquivo of imagens) {
      const nome = (arquivo.name || "print.png").replace(/[^a-zA-Z0-9.-]/g, "_");
      const caminho = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${nome}`;
      const { error } = await supabase.storage.from(BUCKET).upload(caminho, arquivo);
      if (error) {
        toast.error(`Falha ao enviar ${nome}.`);
      } else {
        novas.push(supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl);
      }
      setEnviando((n) => n - 1);
    }
    if (novas.length) onChange([...prints, ...novas]);
  }

  function adicionarUrl() {
    const t = url.trim();
    if (!/^https?:\/\//i.test(t)) {
      toast.error("Endereço precisa começar com http:// ou https://");
      return;
    }
    if (!prints.includes(t)) onChange([...prints, t]);
    setUrl("");
  }

  return (
    <div>
      <div
        tabIndex={0}
        onPaste={(e) => {
          const arquivos = Array.from(e.clipboardData.files);
          if (arquivos.length) {
            e.preventDefault();
            void enviar(arquivos);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void enviar(Array.from(e.dataTransfer.files));
        }}
        className="flex flex-col items-center justify-center gap-2 border border-dashed border-border-strong bg-app px-4 py-6 text-center outline-none transition-colors focus:border-frame hover:border-frame-line"
      >
        {enviando > 0 ? (
          <Loader2 size={18} className="animate-spin text-text-tertiary" />
        ) : (
          <IconeImagem size={18} className="text-text-tertiary" />
        )}
        <p className="text-[12px] text-text-secondary">
          Arraste a imagem aqui, ou clique nesta área e cole com <kbd className="font-display">Ctrl+V</kbd>
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
          <Upload size={13} />
          Escolher arquivo
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            void enviar(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-2 flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              adicionarUrl();
            }
          }}
          placeholder="ou cole o endereço de uma imagem (https://...)"
        />
        <Button type="button" variant="secondary" onClick={adicionarUrl} disabled={!url.trim()}>
          <Plus size={14} />
          Adicionar
        </Button>
      </div>

      {prints.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {prints.map((p) => (
            <div key={p} className="group relative aspect-[4/3] overflow-hidden border border-border bg-app">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" className="h-full w-full object-cover object-top" />
              <button
                type="button"
                onClick={() => onChange(prints.filter((x) => x !== p))}
                aria-label="Tirar este print"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center border border-border bg-app text-text-secondary hover:text-danger"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
