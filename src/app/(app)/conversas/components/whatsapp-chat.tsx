import { ArrowLeft, Video, Phone as PhoneIcon, MoreVertical, Plus, Camera, Mic, Check, CheckCheck } from "@/components/ui/icones";
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
    <div className="flex h-full flex-col bg-[#0b141a]">
      <div className="bg-[#1f2c34]">
        <StatusBar time={statusBarTime} dark />
        <div className="flex items-center gap-3 px-3 pb-3 pt-1 text-white">
          <ArrowLeft size={22} className="text-[#8696a0]" />
          <Avatar url={contactAvatarUrl} name={contactName} />
          <div className="flex-1 min-w-0">
            <p className="truncate text-[16px] font-medium leading-tight">{contactName || "Contato"}</p>
            <p className="truncate text-[12px] text-white/60">{contactStatus || "online"}</p>
          </div>
          <VideoIconWrap />
          <CallIconWrap />
          <MoreVertical size={20} className="text-[#8696a0]" />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-end space-y-1.5 overflow-y-auto px-3 py-3">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sender === "right" ? "justify-end" : "justify-start"}`}>
            <div
              className={`relative overflow-hidden rounded-lg shadow-sm ${
                message.image_url ? "w-56" : "max-w-[78%]"
              } ${
                message.sender === "right"
                  ? "rounded-tr-none bg-[#005c4b]"
                  : "rounded-tl-none bg-[#1f2c34]"
              }`}
            >
              {message.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={message.image_url} alt="" className="block aspect-square w-full object-cover" />
              )}
              <div className="px-2.5 py-1.5">
                {message.text && (
                  <p className="whitespace-pre-wrap break-words text-[14.5px] leading-snug text-[#e9edef]">
                    {message.text}
                  </p>
                )}
                <div className="mt-0.5 flex items-center justify-end gap-1">
                  <span className="text-[11px] text-[#8696a0]">{message.time}</span>
                  {message.sender === "right" && <ReadTicks status={message.read_status} />}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-[#1f2c34] px-2 py-2">
        <Plus size={22} className="shrink-0 text-[#8696a0]" />
        <div className="flex flex-1 items-center rounded-full bg-[#2a3942] px-3 py-2">
          <span className="flex-1 text-[14px] text-[#8696a0]">Digite uma mensagem</span>
        </div>
        <Camera size={20} className="shrink-0 text-[#8696a0]" />
        <Mic size={20} className="shrink-0 text-[#8696a0]" />
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
  return <Video size={20} className="text-[#8696a0]" />;
}
function CallIconWrap() {
  return <PhoneIcon size={19} className="text-[#8696a0]" />;
}

function ReadTicks({ status }: { status?: ConversationMessage["read_status"] }) {
  if (!status || status === "sent") return <Check size={15} className="text-[#8696a0]" />;
  const color = status === "read" ? "text-[#53bdeb]" : "text-[#8696a0]";
  return <CheckCheck size={15} className={color} />;
}
