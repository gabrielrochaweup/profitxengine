import { ArrowLeft, Video, Phone as PhoneIcon, MoreVertical, Smile, Paperclip, Mic, Check, CheckCheck } from "lucide-react";
import { StatusBar } from "./status-bar";
import type { ConversationMessage } from "@/lib/supabase/types";

interface WhatsappChatProps {
  contactName: string;
  contactAvatarUrl: string | null;
  contactStatus: string;
  statusBarTime: string;
  messages: ConversationMessage[];
}

export function WhatsappChat({
  contactName,
  contactAvatarUrl,
  contactStatus,
  statusBarTime,
  messages,
}: WhatsappChatProps) {
  return (
    <div className="flex h-full flex-col bg-[#e5ddd5]">
      <div className="bg-[#075e54]">
        <StatusBar time={statusBarTime} dark />
        <div className="flex items-center gap-3 px-3 pb-3 pt-1 text-white">
          <ArrowLeft size={22} />
          <Avatar url={contactAvatarUrl} name={contactName} />
          <div className="flex-1 min-w-0">
            <p className="truncate text-[16px] font-medium leading-tight">{contactName || "Contato"}</p>
            <p className="truncate text-[12px] text-white/80">{contactStatus || "online"}</p>
          </div>
          <VideoIconWrap />
          <CallIconWrap />
          <MoreVertical size={20} />
        </div>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sender === "right" ? "justify-end" : "justify-start"}`}>
            <div
              className={`relative max-w-[78%] rounded-lg px-2.5 py-1.5 shadow-sm ${
                message.sender === "right"
                  ? "rounded-tr-none bg-[#dcf8c6]"
                  : "rounded-tl-none bg-white"
              }`}
            >
              <p className="whitespace-pre-wrap break-words text-[14.5px] leading-snug text-[#111b21]">
                {message.text}
              </p>
              <div className="mt-0.5 flex items-center justify-end gap-1">
                <span className="text-[11px] text-[#667781]">{message.time}</span>
                {message.sender === "right" && <ReadTicks status={message.read_status} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-[#f0f0f0] px-2 py-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-3 py-2">
          <Smile size={20} className="text-[#54656f]" />
          <span className="flex-1 text-[14px] text-[#8696a0]">Digite uma mensagem</span>
          <Paperclip size={18} className="text-[#54656f]" />
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#075e54]">
          <Mic size={16} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className="h-9 w-9 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-medium text-white">
      {name.slice(0, 1).toUpperCase() || "?"}
    </div>
  );
}

function VideoIconWrap() {
  return <Video size={20} />;
}
function CallIconWrap() {
  return <PhoneIcon size={19} />;
}

function ReadTicks({ status }: { status?: ConversationMessage["read_status"] }) {
  if (!status || status === "sent") return <Check size={15} className="text-[#667781]" />;
  const color = status === "read" ? "text-[#53bdeb]" : "text-[#667781]";
  return <CheckCheck size={15} className={color} />;
}
