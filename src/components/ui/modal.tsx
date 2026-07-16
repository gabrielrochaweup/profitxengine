"use client";

import { type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={cn(
          "relative z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-panel border border-border bg-card p-6 shadow-popover",
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-card-hover hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
