import { vortexAdapter } from "./vortex";
import type { ContractAdapter } from "./types";

export type { ContractAdapter, NormalizedContractEvent } from "./types";

// Nova origem = novo arquivo de adapter + uma linha aqui. Nada de schema
// muda. Hoje só o Vortex repassa assinatura; se um dia a ZapSign apontar
// direto pra cá, entra um "zapsign" aqui lendo o payload cru dela.
export const CONTRACT_ADAPTERS: Record<string, ContractAdapter> = {
  vortex: vortexAdapter,
};

export const CONTRACT_PLATFORMS = Object.keys(CONTRACT_ADAPTERS);
