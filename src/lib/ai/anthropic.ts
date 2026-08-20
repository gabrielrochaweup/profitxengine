import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { combineSystem, type GenerateTextParams, type GenerateTextResult } from "./types";

export async function generateText(
  params: GenerateTextParams,
  apiKey: string
): Promise<GenerateTextResult> {
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: params.model,
    // 4096 em vez de 2048 — dá mais folga pra respostas mais longas (ex:
    // conversas com várias mensagens em JSON) não cortarem no meio.
    max_tokens: params.maxTokens ?? 4096,
    system: combineSystem(params),
    messages: [{ role: "user", content: params.prompt }],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return {
    text,
    tokensUsed: (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
  };
}

export async function validateKey(apiKey: string): Promise<boolean> {
  const client = new Anthropic({ apiKey });
  await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1,
    messages: [{ role: "user", content: "oi" }],
  });
  return true;
}
