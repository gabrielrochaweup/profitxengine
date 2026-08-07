"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ImageGenerationPanel } from "@/components/image-generation-panel";

// Aba "Criativos": geração de imagem 100% livre por prompt, sem nenhum
// campo editável tipo simulador — o ImageGenerationPanel já traz as abas
// pré-definido/livre, galeria e botão de baixar prontos.
export function CriativosLivre() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  return (
    <div className="mt-6 mx-auto max-w-xl">
      <Card className="p-4">
        <ImageGenerationPanel
          contextType="criativo"
          contextId="gerador-criativos-livre"
          value={imageUrl}
          onChange={setImageUrl}
          label="Gerar criativo"
          placeholder="Descreva o criativo que você quer gerar..."
          rows={4}
        />
      </Card>
    </div>
  );
}
