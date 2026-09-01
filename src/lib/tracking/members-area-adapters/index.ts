import { genericAdapter } from "./generic";
import { cademiAdapter } from "./cademi";
import type { MembersAreaAdapter } from "./types";

export type { MembersAreaAdapter, NormalizedMembersAreaEvent } from "./types";

// Nova plataforma = novo arquivo de adapter + uma linha aqui. Nada de
// schema muda.
export const MEMBERS_AREA_ADAPTERS: Record<string, MembersAreaAdapter> = {
  generic: genericAdapter,
  cademi: cademiAdapter,
};

export const MEMBERS_AREA_PLATFORMS = Object.keys(MEMBERS_AREA_ADAPTERS);
