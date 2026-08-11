import { Image as ImageIcon } from "lucide-react";
import { Space_Grotesk } from "next/font/google";
import type { CarouselFrame } from "@/lib/supabase/types";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["700"], display: "swap" });

interface CarouselFramePreviewProps {
  frame: CarouselFrame;
}

// Design bem simples e fixo: fundo gerado por IA + gradiente escuro no
// rodapé (sempre ligado, não é opção) + título + subtítulo — sem logo, CTA,
// data/categoria ou seleção de cor, por pedido explícito do usuário.
export function CarouselFramePreview({ frame }: CarouselFramePreviewProps) {
  const { backgroundImageUrl, headline, subtitle } = frame;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0c]">
      {backgroundImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={backgroundImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1a1a1f] to-[#0a0a0c] text-white/30">
          <ImageIcon size={28} />
          <p className="text-sm">Gerando fundo com IA...</p>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/85 to-transparent" />

      {(headline || subtitle) && (
        <div className="absolute inset-x-0 bottom-12 px-12">
          {headline && (
            <h2 className={`whitespace-pre-line text-[42px] font-bold leading-[1.15] text-white ${spaceGrotesk.className}`}>
              {headline}
            </h2>
          )}
          {subtitle && <p className="mt-3 whitespace-pre-line text-[20px] leading-snug text-white/80">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
