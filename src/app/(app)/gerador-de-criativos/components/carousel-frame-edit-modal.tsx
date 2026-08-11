"use client";

import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScaledFramePreview } from "./scaled-frame-preview";
import type { CarouselFrame } from "@/lib/supabase/types";

interface CarouselFrameEditModalProps {
  frame: CarouselFrame | null;
  frameIndex: number;
  canvasWidth: number;
  canvasHeight: number;
  onClose: () => void;
  onChange: (patch: Partial<CarouselFrame>) => void;
}

export function CarouselFrameEditModal({
  frame,
  frameIndex,
  canvasWidth,
  canvasHeight,
  onClose,
  onChange,
}: CarouselFrameEditModalProps) {
  return (
    <Modal open={frame !== null} onClose={onClose} title={`Editar frame ${frameIndex + 1}`}>
      {frame && (
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="mx-auto shrink-0 sm:mx-0">
            <ScaledFramePreview frame={frame} canvasWidth={canvasWidth} canvasHeight={canvasHeight} targetWidth={180} />
          </div>
          <div className="flex-1 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Título</label>
              <Input value={frame.headline} onChange={(e) => onChange({ headline: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Texto</label>
              <Textarea value={frame.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} rows={3} />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
