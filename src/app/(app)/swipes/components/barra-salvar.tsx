"use client";

import { Loader2, Save } from "@/components/ui/icones";
import { Button } from "@/components/ui/button";

/** Barra presa no rodapé enquanto o formulário está aberto: salvar fica sempre à mão. */
export function BarraSalvar({
  salvando,
  onSalvar,
  onCancelar,
  rotulo = "Salvar swipe",
  nota,
}: {
  salvando: boolean;
  onSalvar: () => void;
  onCancelar: () => void;
  rotulo?: string;
  nota?: string;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-1 mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-frame-line bg-app px-1 py-3">
      {nota && <p className="mr-auto text-[12px] text-text-tertiary">{nota}</p>}
      <Button type="button" variant="ghost" onClick={onCancelar} disabled={salvando}>
        Cancelar
      </Button>
      <Button type="button" onClick={onSalvar} disabled={salvando}>
        {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {rotulo}
      </Button>
    </div>
  );
}
