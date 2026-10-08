"use client";

import { useState } from "react";
import { ArrowLeft, ChevronDown, Check, X, Smile, Paperclip, Zap, Type, Languages, Send } from "@/components/ui/icones";
import type { ConversationMessage } from "@/lib/supabase/types";

interface CrmChatProps {
  instanceName: string;
  contactName: string;
  contactAvatarUrl: string | null;
  assigneeName: string;
  assigneeAvatarUrl: string | null;
  status: string;
  messages: ConversationMessage[];
}

export function CrmChat({
  instanceName,
  contactName,
  contactAvatarUrl,
  assigneeName,
  assigneeAvatarUrl,
  status,
  messages,
}: CrmChatProps) {
  const [footerTab, setFooterTab] = useState<"mensagem" | "observacao">("mensagem");
  const isResolved = status.toLowerCase().includes("resolv");

  return (
    <div className="flex h-full flex-col bg-[#111318] text-white">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-3 py-2.5">
        <ArrowLeft size={18} className="shrink-0 text-white/50" />
        <span className="shrink-0 text-[11px] text-white/35">Bate-papos</span>
        <Avatar url={contactAvatarUrl} name={instanceName || contactName} size={30} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-tight">{instanceName || "Instância"}</p>
          <p className="truncate text-[11px] leading-tight text-white/50">{contactName || "Contato"}</p>
        </div>
        <X size={18} className="shrink-0 text-white/50" />
      </div>

      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-3 py-2">
        <p className="min-w-0 flex-1 truncate text-[12px] text-white/70">
          <span className="font-medium text-white/90">{instanceName || "Bot"}</span>
          <span className="mx-1 text-white/30">·</span>
          {contactName || "Contato"}
        </p>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-button border border-white/10 px-2 py-1 text-[11px] text-white/70"
        >
          <Avatar url={assigneeAvatarUrl} name={assigneeName} size={16} />
          <span className="max-w-[80px] truncate">{assigneeName || "Sem responsável"}</span>
          <ChevronDown size={12} />
        </button>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-button px-2 py-1 text-[11px] font-medium ${
            isResolved ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
          }`}
        >
          <Check size={12} />
          {status || "aberto"}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-end space-y-3 overflow-y-auto px-3 py-3">
        {messages.map((message, index) => {
          const isAgent = message.sender === "right";
          return (
            <div key={index} className={`flex flex-col ${isAgent ? "items-end" : "items-start"}`}>
              <div className={`flex max-w-[85%] items-end gap-2 ${isAgent ? "flex-row-reverse" : ""}`}>
                {!isAgent && <Avatar url={contactAvatarUrl} name={instanceName || contactName} size={22} />}
                <div
                  className={`overflow-hidden rounded-2xl text-[13px] leading-snug ${
                    message.image_url ? "w-56" : ""
                  } ${isAgent ? "rounded-br-sm bg-accent text-white" : "rounded-bl-sm bg-white/10 text-white"}`}
                >
                  {message.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={message.image_url} alt="" className="block aspect-square w-full object-cover" />
                  )}
                  {message.text && <p className="whitespace-pre-wrap break-words px-3 py-2">{message.text}</p>}
                </div>
              </div>
              <span className="mt-1 px-1 text-[10px] text-white/35">{message.time}</span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/10 px-3 py-2.5">
        <div className="flex gap-3 text-[11px]">
          <button
            type="button"
            onClick={() => setFooterTab("mensagem")}
            className={footerTab === "mensagem" ? "font-medium text-white" : "text-white/40"}
          >
            Mensagem
          </button>
          <button
            type="button"
            onClick={() => setFooterTab("observacao")}
            className={footerTab === "observacao" ? "font-medium text-white" : "text-white/40"}
          >
            Observação
          </button>
        </div>

        <div className="mt-2 rounded-input border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white/40">
          {footerTab === "mensagem" ? "Digite uma mensagem..." : "Escreva uma observação interna..."}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white/50">
            <Smile size={16} />
            <Paperclip size={16} />
            <Zap size={16} />
            <Type size={16} />
            <Languages size={16} />
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
            <Send size={14} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ url, name, size }: { url: string | null; name: string; size: number }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-white/15 font-medium text-white"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.slice(0, 1).toUpperCase() || "?"}
    </div>
  );
}
