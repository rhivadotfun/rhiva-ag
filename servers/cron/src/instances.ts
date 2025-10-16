import { DexApi } from "@rhiva-ag/dex-api";
import { Coingecko } from "@coingecko/coingecko-typescript";

import { getEnv } from "./env";

export const dexApi = new DexApi();
export const coingecko = new Coingecko({
  environment: "pro",
  proAPIKey: getEnv("COINGECKO_API_KEY"),
});
