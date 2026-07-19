"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Modal } from "./modal";
import { Button } from "./button";

interface ConfirmOptions {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Substitui window.confirm() por um diálogo com a cara do app. Uso:
 * const confirm = useConfirm();
 * if (!(await confirm("Excluir este item?"))) return;
 * Ou com mais controle: await confirm({ title, description, danger: true, confirmLabel: "Excluir" }).
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm precisa estar dentro de <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((arg) => {
    const resolved = typeof arg === "string" ? { description: arg } : arg;
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setOptions(resolved);
    });
  }, []);

  function handle(result: boolean) {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <Modal open onClose={() => handle(false)} title={options.title ?? "Confirmar ação"} className="max-w-sm">
          <p className="text-sm text-text-secondary">{options.description}</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => handle(false)}>
              {options.cancelLabel ?? "Cancelar"}
            </Button>
            <Button
              type="button"
              variant={options.danger ? "danger" : "primary"}
              size="sm"
              onClick={() => handle(true)}
            >
              {options.confirmLabel ?? "Confirmar"}
            </Button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}
