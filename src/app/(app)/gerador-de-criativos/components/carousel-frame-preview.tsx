import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT_COLORS, spaceGrotesk } from "./post-preview";
import type { CarouselFrame } from "@/lib/supabase/types";

const PROFITX_LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028350273/VGgHhpMmMCjDsydKWSjVxS/LogoProfitxGrande_748f37a4.png";

// Mesmo espírito do parser leve de post-preview.tsx, mas só reconhece
// ==destaque== (aqui vira texto na cor de acento, sem fundo de marca-texto
// — combina melhor com o estilo das referências de carrossel).
const HIGHLIGHT_REGEX = /(==.+?==)/g;

function renderHeadline(text: string, accentColor: string) {
  return text.split("\n").map((line, lineIndex) => (
    // eslint-disable-next-line react/no-array-index-key
    <span key={lineIndex} className="block min-h-[1em]">
      {line
        .split(HIGHLIGHT_REGEX)
        .filter((part) => part.length > 0)
        .map((part, partIndex) =>
          part.startsWith("==") && part.endsWith("==") ? (
            <span key={partIndex} style={{ color: accentColor }}>
              {part.slice(2, -2)}
            </span>
          ) : (
            <span key={partIndex}>{part}</span>
          )
        )}
    </span>
  ));
}

interface CarouselFramePreviewProps {
  frame: CarouselFrame;
}

export function CarouselFramePreview({ frame }: CarouselFramePreviewProps) {
  const {
    backgroundImageUrl,
    scrimPosition,
    dateText,
    categoryText,
    headline,
    headlinePosition,
    subtitle,
    ctaText,
    showLogo,
    accent,
  } = frame;
  const accentColor = ACCENT_COLORS[accent].bright;
  const hasBadgeRow = Boolean(dateText || categoryText);
  const hasHeadlineBlock = Boolean(headline || subtitle);
  const hasFooterRow = showLogo || Boolean(ctaText);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0c]">
      {backgroundImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={backgroundImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1a1a1f] to-[#0a0a0c] text-white/30">
          <ImageIcon size={28} />
          <p className="text-sm">Gere um fundo com IA</p>
        </div>
      )}

      {(scrimPosition === "topo" || scrimPosition === "ambos") && (
        <div className="absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-black/70 to-transparent" />
      )}
      {(scrimPosition === "rodape" || scrimPosition === "ambos") && (
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/80 to-transparent" />
      )}

      {hasBadgeRow && (
        <div className="absolute left-12 right-12 top-10 flex items-center gap-3 text-[13px] font-medium uppercase tracking-wide text-white/70">
          {dateText && <span>{dateText}</span>}
          {categoryText && (
            <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-white/90">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
              {categoryText}
            </span>
          )}
        </div>
      )}

      {hasHeadlineBlock && (
        <div
          className={cn(
            "absolute left-12 right-12",
            headlinePosition === "topo" ? "top-24" : "bottom-24"
          )}
        >
          {headline && (
            <h2 className={cn("text-[44px] font-bold leading-[1.15] text-white", spaceGrotesk.className)}>
              {renderHeadline(headline, accentColor)}
            </h2>
          )}
          {subtitle && <p className="mt-3 text-[20px] leading-snug text-white/80">{subtitle}</p>}
        </div>
      )}

      {hasFooterRow && (
        <div className="absolute bottom-10 left-12 right-12 flex items-center justify-between">
          {showLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={PROFITX_LOGO_URL}
              alt="PROFITX"
              className="h-10 w-10 rounded-full bg-white/95 object-contain p-1.5"
            />
          ) : (
            <span />
          )}
          {ctaText && (
            <span className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/[0.12] px-5 py-2.5 text-[15px] font-semibold text-white">
              {ctaText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
