import { ChevronLeft, Phone as PhoneIcon, Video, SmilePlus, Camera, Mic, Image as ImageIcon, Sticker, Plus } from "lucide-react";
import { StatusBar } from "./status-bar";
import type { ConversationMessage } from "@/lib/supabase/types";

interface InstagramChatProps {
  contactName: string;
  contactAvatarUrl: string | null;
  contactStatus: string;
  statusBarTime: string;
  messages: ConversationMessage[];
}

// Mensagem só com emoji(s) — o Instagram renderiza sem balão, em fonte grande.
// Regex montada via construtor (não literal) pra não esbarrar na checagem de
// flag "u" do TypeScript quando o target de compilação não é es6+.
const EMOJI_ONLY_REGEX = new RegExp("^(\\p{Extended_Pictographic}|\\s)+$", "u");
function isEmojiOnly(text: string) {
  const trimmed = text.trim();
  return trimmed.length > 0 && EMOJI_ONLY_REGEX.test(trimmed);
}

export function InstagramChat({
  contactName,
  contactAvatarUrl,
  contactStatus,
  statusBarTime,
  messages,
}: InstagramChatProps) {
  return (
    <div className="flex h-full flex-col bg-black">
      <StatusBar time={statusBarTime} dark />

      <div className="flex items-center gap-2.5 px-3 py-2 text-white">
        <ChevronLeft size={26} />
        <Avatar url={contactAvatarUrl} name={contactName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight">{contactName || "usuario"}</p>
          <p className="truncate text-[12px] text-white/50">{contactStatus || "usuario.ig"}</p>
        </div>
        <HeaderIconButton>
          <SmilePlus size={16} />
        </HeaderIconButton>
        <HeaderIconButton>
          <PhoneIcon size={16} />
        </HeaderIconButton>
        <HeaderIconButton>
          <Video size={17} />
        </HeaderIconButton>
      </div>

      <div className="flex flex-1 flex-col justify-end space-y-1 overflow-y-auto px-3 py-3">
        {messages.map((message, index) => {
          const isLeft = message.sender === "left";
          const nextSameSender = messages[index + 1]?.sender === message.sender;
          const showAvatar = isLeft && !nextSameSender;
          const emojiOnly = !message.image_url && message.text && isEmojiOnly(message.text);

          return (
            <div key={index} className={`flex items-end gap-1.5 ${isLeft ? "justify-start" : "justify-end"}`}>
              {isLeft &&
                (showAvatar ? (
                  <Avatar url={contactAvatarUrl} name={contactName} small />
                ) : (
                  <div className="w-6 shrink-0" />
                ))}

              {emojiOnly ? (
                <p className="max-w-[75%] px-1 py-0.5 text-[38px] leading-tight">{message.text}</p>
              ) : (
                <div
                  className={`overflow-hidden rounded-[20px] ${message.image_url ? "w-56" : "max-w-[75%]"} ${
                    isLeft ? "bg-[#262626] text-white" : "bg-[#7c4dff] text-white"
                  }`}
                >
                  {message.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={message.image_url} alt="" className="block aspect-square w-full object-cover" />
                  )}
                  {message.text && (
                    <p className="whitespace-pre-wrap break-words px-3.5 py-2 text-[14.5px] leading-snug">
                      {message.text}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5 px-3 pb-3 pt-1">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3797f0]">
          <Camera size={16} className="text-white" />
        </div>
        <div className="flex flex-1 items-center gap-2.5 rounded-full border border-white/30 px-3.5 py-2">
          <span className="flex-1 truncate text-[14px] text-white/50">Mensagem...</span>
          <Mic size={19} className="shrink-0 text-white" />
          <ImageIcon size={19} className="shrink-0 text-white" />
          <Sticker size={19} className="shrink-0 text-white" />
        </div>
        <Plus size={24} className="shrink-0 text-white" />
      </div>
    </div>
  );
}

function HeaderIconButton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
      {children}
    </div>
  );
}

function Avatar({ url, name, small }: { url: string | null; name: string; small?: boolean }) {
  const size = small ? "h-6 w-6" : "h-8 w-8";
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className={`${size} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-xs font-medium text-white`}
    >
      {name.slice(0, 1).toUpperCase() || "?"}
    </div>
  );
}
