import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostDisplayStyle } from "@/lib/supabase/types";

interface PostPreviewProps {
  authorName: string;
  authorHandle: string;
  authorAvatarUrl: string | null;
  verified: boolean;
  displayStyle: PostDisplayStyle;
  body: string;
  subtitle: string;
  linkCardImageUrl: string | null;
  linkCardTitle: string;
  linkCardDescription: string;
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

export function PostPreview({
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
    <div className="w-[520px] shrink-0 bg-white px-12 py-14 font-sans text-black">
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
