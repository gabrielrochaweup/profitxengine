import { ChevronLeft, Phone as PhoneIcon, Video, Info, Camera, Mic, Image as ImageIcon, Heart } from "lucide-react";
import { StatusBar } from "./status-bar";
import type { ConversationMessage } from "@/lib/supabase/types";

interface InstagramChatProps {
  contactName: string;
  contactAvatarUrl: string | null;
  contactStatus: string;
  statusBarTime: string;
  messages: ConversationMessage[];
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

      <div className="flex items-center gap-2 px-2 py-2 text-white">
        <ChevronLeft size={26} />
        <Avatar url={contactAvatarUrl} name={contactName} />
        <div className="flex-1 min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight">{contactName || "usuario"}</p>
          <p className="truncate text-[12px] text-white/50">{contactStatus || "Ativo agora"}</p>
        </div>
        <PhoneIcon size={21} />
        <Video size={23} className="ml-3" />
        <Info size={21} className="ml-3" />
      </div>

      <div className="flex flex-1 flex-col justify-end space-y-1 overflow-y-auto px-3 py-3">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sender === "right" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] overflow-hidden rounded-[20px] ${
                message.sender === "right" ? "bg-[#3797f0] text-white" : "bg-[#262626] text-white"
              }`}
            >
              {message.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={message.image_url} alt="" className="block w-full max-w-[240px] object-cover" />
              )}
              {message.text && (
                <p className="whitespace-pre-wrap break-words px-3.5 py-2 text-[14.5px] leading-snug">
                  {message.text}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2.5 px-3 pb-3 pt-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70">
          <Camera size={16} className="text-white" />
        </div>
        <div className="flex flex-1 items-center rounded-full border border-white/30 px-3.5 py-2">
          <span className="text-[14px] text-white/50">Message...</span>
        </div>
        <ImageIcon size={22} className="text-white" />
        <Mic size={22} className="text-white" />
        <Heart size={22} className="text-white" />
      </div>
    </div>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className="h-8 w-8 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-xs font-medium text-white">
      {name.slice(0, 1).toUpperCase() || "?"}
    </div>
  );
}
