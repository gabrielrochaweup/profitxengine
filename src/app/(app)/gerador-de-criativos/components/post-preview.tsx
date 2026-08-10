import { Space_Grotesk, Inter } from "next/font/google";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostAccent, PostDisplayStyle, PostFormat, PostTemplate } from "@/lib/supabase/types";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["700"], display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

// Logo oficial da PROFITX, hospedada no CMS do site de lives — reaproveitada
// direto (mesmo asset), sempre no mesmo tamanho/posição no modelo "profitx".
const PROFITX_LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028350273/VGgHhpMmMCjDsydKWSjVxS/LogoProfitxGrande_748f37a4.png";

// Cores extraídas direto do CSS computado de lives.escolaprofitx.com.
const ACCENT_COLORS: Record<PostAccent, { bright: string; rgb: string }> = {
  dourado: { bright: "#FFB800", rgb: "212, 160, 0" },
  azul: { bright: "#60A5FA", rgb: "59, 130, 246" },
  verde: { bright: "#4ADE80", rgb: "34, 197, 94" },
};

// Tamanhos padrão de post (largura sempre 1080, só a altura muda) — os 3
// formatos padrão do Instagram. A largura exibida na tela fica fixa em
// PREVIEW_DISPLAY_WIDTH e só a altura do card varia com o aspect ratio;
// isso mantém o tamanho de fonte/padding já calibrado válido nos 3 casos.
// A exportação usa EXPORT_PIXEL_RATIO (post-export-controls.tsx) pra sair
// exatamente em 1080px de largura.
export const POST_FORMAT_DIMENSIONS: Record<PostFormat, { width: number; height: number; label: string }> = {
  quadrado: { width: 1080, height: 1080, label: "1080 x 1080 — quadrado" },
  feed: { width: 1080, height: 1350, label: "1080 x 1350 — feed" },
  stories: { width: 1080, height: 1920, label: "1080 x 1920 — stories" },
};
export const PREVIEW_DISPLAY_WIDTH = 520;

interface PostPreviewProps {
  template: PostTemplate;
  // Modelo X/Twitter
  authorName: string;
  authorHandle: string;
  authorAvatarUrl: string | null;
  verified: boolean;
  displayStyle: PostDisplayStyle;
  format: PostFormat;
  body: string;
  subtitle: string;
  linkCardImageUrl: string | null;
  linkCardTitle: string;
  linkCardDescription: string;
  // Modelo PROFITX Lives
  profitxBadgeText: string;
  profitxHeadline1: string;
  profitxHeadline2: string;
  profitxStatLabel: string;
  profitxStatValue: string;
  profitxStatCaption: string;
  profitxFooterLine1: string;
  profitxFooterLine2: string;
  profitxAccent: PostAccent;
}

// Post gerado inteiramente com texto simples + uma sintaxe leve
// (**negrito**, *itálico*, ==destaque==) em vez de um editor rich-text —
// evita puxar uma lib nova só pra isso.
const FORMAT_REGEX = /(\*\*.+?\*\*|\*.+?\*|==.+?==)/g;

function renderFormattedText(text: string) {
  return text.split("\n").map((line, lineIndex) => (
    // eslint-disable-next-line react/no-array-index-key
    <span key={lineIndex} className="block min-h-[1em]">
      {line
        .split(FORMAT_REGEX)
        .filter((part) => part.length > 0)
        .map((part, partIndex) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith("==") && part.endsWith("==")) {
            return (
              <mark key={partIndex} className="bg-[#3ddc50] px-1.5 py-0.5 text-black">
                {part.slice(2, -2)}
              </mark>
            );
          }
          if (part.startsWith("*") && part.endsWith("*")) {
            return <em key={partIndex}>{part.slice(1, -1)}</em>;
          }
          return <span key={partIndex}>{part}</span>;
        })}
    </span>
  ));
}

export function PostPreview(props: PostPreviewProps) {
  const { template, format } = props;
  const { width, height } = POST_FORMAT_DIMENSIONS[format];
  const displayHeight = (PREVIEW_DISPLAY_WIDTH * height) / width;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden",
        template === "profitx" ? "bg-[#08080b]" : "bg-white px-12 py-14 font-sans text-black"
      )}
      style={{ width: PREVIEW_DISPLAY_WIDTH, height: displayHeight }}
    >
      {template === "profitx" ? <ProfitxHero {...props} /> : <TwitterCard {...props} />}
    </div>
  );
}

function TwitterCard({
  authorName,
  authorHandle,
  authorAvatarUrl,
  verified,
  displayStyle,
  body,
  subtitle,
  linkCardImageUrl,
  linkCardTitle,
  linkCardDescription,
}: PostPreviewProps) {
  const hasLinkCard = Boolean(linkCardImageUrl || linkCardTitle || linkCardDescription);

  return (
    <>
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <Avatar url={authorAvatarUrl} name={authorName} />
          {verified && (
            <div className="absolute -right-1 -top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white">
              <BadgeCheck size={26} className="fill-[#1d9bf0] text-white" />
            </div>
          )}
        </div>
        <div className="pt-1.5">
          <p className="text-2xl font-bold leading-tight text-black">{authorName || "Nome do autor"}</p>
          <p className="text-lg text-[#71767b]">{authorHandle || "@handle"}</p>
        </div>
      </div>

      {hasLinkCard && (
        <div className="mt-7 overflow-hidden rounded-2xl border border-[#cfd9de]">
          {linkCardImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={linkCardImageUrl} alt="" className="block h-48 w-full object-cover" />
          )}
          <div className="space-y-1 p-4">
            {linkCardTitle && (
              <p className="font-serif text-xl font-bold leading-snug text-[#1a2b4c]">{linkCardTitle}</p>
            )}
            {linkCardDescription && <p className="text-sm text-[#536471]">{linkCardDescription}</p>}
          </div>
        </div>
      )}

      {body && (
        <div
          className={cn(
            "mt-7",
            displayStyle === "titulo_grande"
              ? "text-[40px] font-extrabold uppercase leading-[1.15]"
              : "text-[28px] font-normal leading-snug"
          )}
        >
          {renderFormattedText(body)}
        </div>
      )}

      {subtitle && <p className="mt-5 text-xl text-[#0f1419]">{subtitle}</p>}
    </>
  );
}

function ProfitxHero({
  profitxBadgeText,
  profitxHeadline1,
  profitxHeadline2,
  profitxStatLabel,
  profitxStatValue,
  profitxStatCaption,
  profitxFooterLine1,
  profitxFooterLine2,
  profitxAccent,
}: PostPreviewProps) {
  const accent = ACCENT_COLORS[profitxAccent];

  return (
    <div
      className={cn("flex h-full flex-col items-center justify-center px-12 py-16 text-center", inter.className)}
    >
      {profitxBadgeText && (
        <span
          className="mb-7 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white"
          style={{ background: `rgba(${accent.rgb}, 0.08)`, border: `1px solid rgba(${accent.rgb}, 0.2)` }}
        >
          <span style={{ color: accent.bright }}>⚡</span>
          {profitxBadgeText}
        </span>
      )}

      {(profitxHeadline1 || profitxHeadline2) && (
        <h1 className={cn("text-[46px] font-bold leading-[1.1]", spaceGrotesk.className)}>
          {profitxHeadline1 && <span className="block text-white">{profitxHeadline1}</span>}
          {profitxHeadline2 && (
            <span className="block" style={{ color: accent.bright }}>
              {profitxHeadline2}
            </span>
          )}
        </h1>
      )}

      {(profitxStatLabel || profitxStatValue || profitxStatCaption) && (
        <div
          className="mt-10 w-full max-w-[400px] rounded-2xl px-7 py-8"
          style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(${accent.rgb}, 0.25)` }}
        >
          {profitxStatLabel && (
            <div className="mb-3 flex items-center justify-center gap-2 text-[12px] font-bold uppercase tracking-wider text-white/70">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4ADE80]" />
              {profitxStatLabel}
            </div>
          )}
          {profitxStatValue && (
            <div
              className={cn("text-[66px] font-bold leading-none", spaceGrotesk.className)}
              style={{ color: accent.bright, textShadow: `0 0 44px rgba(${accent.rgb}, 0.55)` }}
            >
              {profitxStatValue}
            </div>
          )}
          {profitxStatCaption && <p className="mt-3 text-[13px] text-white/50">{profitxStatCaption}</p>}
        </div>
      )}

      {(profitxFooterLine1 || profitxFooterLine2) && (
        <div className="mt-8 space-y-1 text-[14px] font-semibold" style={{ color: accent.bright }}>
          {profitxFooterLine1 && <p>{profitxFooterLine1}</p>}
          {profitxFooterLine2 && <p>{profitxFooterLine2}</p>}
        </div>
      )}

      {/* Logo sempre fixa nesse canto — "local padrão", não editável. */}
      <div className="absolute bottom-9 left-1/2 -translate-x-1/2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PROFITX_LOGO_URL} alt="PROFITX" className="h-9 w-9 object-contain opacity-70" />
      </div>
    </div>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className="h-[110px] w-[110px] rounded-full object-cover" />;
  }
  return (
    <div className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-3xl font-medium text-white">
      {name.slice(0, 1).toUpperCase() || "?"}
    </div>
  );
}
