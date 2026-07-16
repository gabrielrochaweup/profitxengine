"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PromptPicker } from "@/components/prompt-picker";
import type { ConversationMessage, Platform } from "@/lib/supabase/types";

interface AiGeneratePanelProps {
  platform: Platform;
  onGenerated: (messages: ConversationMessage[], promptId: string | null) => void;
  hasExistingMessages: boolean;
}

function buildSystemPrompt(platform: Platform) {
  const platformLabel = platform === "whatsapp" ? "WhatsApp" : "Instagram Direct";
  return `Você gera conversas fictícias para simular telas de chat de ${platformLabel}, com foco no universo de criptomoedas quando fizer sentido pelo contexto pedido.
Responda APENAS com um JSON válido (sem markdown, sem texto antes ou depois) no formato de array de objetos seguindo este schema:
[{"sender":"left"|"right","text":"string","time":"HH:MM","read_status":"sent"|"delivered"|"read"}]
"left" é o contato, "right" é o dono da conta que está simulando a tela. Gere no máximo 12 mensagens, com horários plausíveis e crescentes.`;
}

function parseMessages(raw: string): ConversationMessage[] {
  const cleaned = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Formato inesperado.");
  return parsed.map((item) => ({
    sender: item.sender === "right" ? "right" : "left",
    text: String(item.text ?? ""),
    time: String(item.time ?? ""),
    read_status: ["sent", "delivered", "read"].includes(item.read_status) ? item.read_status : "read",
  }));
}

export function AiGeneratePanel({ platform, onGenerated, hasExistingMessages }: AiGeneratePanelProps) {
  const [prompt, setPrompt] = useState("");
  const [promptId, setPromptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    if (hasExistingMessages && !confirm("Isso vai substituir as mensagens atuais do editor. Continuar?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "conversa",
          prompt,
          system: buildSystemPrompt(platform),
          promptId: promptId ?? undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erro ao gerar conversa.");

      const messages = parseMessages(body.text);
      onGenerated(messages, promptId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar conversa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-secondary">Descreva a conversa desejada</label>
        <PromptPicker
          category="conversa"
          onSelect={(saved) => {
            setPrompt(saved.content);
            setPromptId(saved.id);
          }}
        />
      </div>

      <Textarea
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
          setPromptId(null);
        }}
        rows={4}
        placeholder="Ex: conversa entre cliente e vendedor negociando uma carteira de cripto, cliente com objeção de preço e depois fechando."
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="button" onClick={handleGenerate} disabled={loading || !prompt.trim()} className="w-full">
        <Sparkles size={16} />
        {loading ? "Gerando..." : "Gerar conversa com IA"}
      </Button>
    </div>
  );
}
