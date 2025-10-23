import { DexApi } from "@rhiva-ag/dex-api";
import { Connection } from "@solana/web3.js";

export const dexApi = new DexApi();
export const solanaConnection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
);
