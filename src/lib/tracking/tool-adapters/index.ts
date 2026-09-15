import { pepeAdapter } from "./pepe";
import type { ToolAdapter } from "./types";

export type { ToolAdapter, NormalizedToolEvent } from "./types";

// Ferramenta nova = novo arquivo de adapter + uma linha aqui. Nada de
// schema muda.
export const TOOL_ADAPTERS: Record<string, ToolAdapter> = {
  pepe: pepeAdapter,
};

export const TOOL_PLATFORMS = Object.keys(TOOL_ADAPTERS);
