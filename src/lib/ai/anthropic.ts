import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { GenerateTextParams, GenerateTextResult } from "./types";

export async function generateText(
  params: GenerateTextParams,
  apiKey: string
): Promise<GenerateTextResult> {
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: params.model,
    max_tokens: params.maxTokens ?? 2048,
    system: params.system,
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
