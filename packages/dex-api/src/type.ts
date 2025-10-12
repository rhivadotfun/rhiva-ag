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
