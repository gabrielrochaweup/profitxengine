"use client";

import { type ReactNode } from "react";
import { X } from "@/components/ui/icones";
import { cn } from "@/lib/utils";
import { FaixaTitulo } from "./faixa";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-2 sm:px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={cn(
          "relative z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-panel border border-border-strong bg-card p-3 shadow-[inset_0_2px_0_var(--frame),var(--shadow-popover)] sm:p-5",
          className
        )}
      >
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <FaixaTitulo>{title}</FaixaTitulo>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-button text-text-muted hover:bg-card-hover hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
