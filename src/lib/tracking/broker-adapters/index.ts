import { genericAdapter } from "./generic";
import { memextradeAdapter } from "./memextrade";
import type { BrokerAdapter } from "./types";

export type { BrokerAdapter, NormalizedBrokerEvent } from "./types";

// Nova corretora = novo arquivo de adapter + uma linha aqui. Nada de schema muda.
export const BROKER_ADAPTERS: Record<string, BrokerAdapter> = {
  generic: genericAdapter,
  memextrade: memextradeAdapter,
};

export const BROKER_PLATFORMS = Object.keys(BROKER_ADAPTERS);
