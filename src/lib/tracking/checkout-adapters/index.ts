import { genericAdapter } from "./generic";
import { hotmartAdapter } from "./hotmart";
import { onprofitAdapter } from "./onprofit";
import type { CheckoutAdapter } from "./types";

export type { CheckoutAdapter, NormalizedCheckoutEvent } from "./types";

// Nova plataforma = novo arquivo de adapter + uma linha aqui. Nada de
// schema muda.
export const CHECKOUT_ADAPTERS: Record<string, CheckoutAdapter> = {
  generic: genericAdapter,
  hotmart: hotmartAdapter,
  onprofit: onprofitAdapter,
};

export const CHECKOUT_PLATFORMS = Object.keys(CHECKOUT_ADAPTERS);
