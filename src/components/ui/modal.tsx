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
    <div className="fixed inset-0 z-40 flex items-center justify-center px-2 sm:px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={cn(
          "relative z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-panel bg-card p-3 shadow-popover sm:p-6",
          className
        )}
      >
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <h2 className="text-base font-semibold text-text-primary sm:text-lg">{title}</h2>
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
