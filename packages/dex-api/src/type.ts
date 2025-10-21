import type { Token } from "./jup/models";
import type { Pair as OrcaPair } from "./orca/models";
import type { Pair as SarosPair } from "./saros/models";
import type { Pair as RaydiumPair } from "./raydium/models";
import type { Pair as MeteoraPair } from "./meteora/models";

export type NormalizedPair = {
  address: string;
  name: string;
  baseReserveAmount: number;
  quoteReserveAmount: number;
  tvl?: number;
  fees?: number;
  apr: number;
  volume24h: number;
  fees7d?: number;
  fees24H?: number;
  price?: number;
  binStep: number;
  maxFee: number;
  baseFee: number;
  liquidity: number;
  dynamicFee?: number;
};

export type Pair = NormalizedPair & {
  baseToken: Token;
  quoteToken: Token;
  extra: OrcaPair | RaydiumPair | MeteoraPair | SarosPair;
};

export type ApiConfig = {
  baseURL: string;
  apiKey?: string;
};
