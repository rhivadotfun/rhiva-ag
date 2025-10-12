export type Mint = {
  chainId: number;
  address: string;
  programid: string;
  logoURI: string;
  symbol: string;
  name: string;
  decimals: number;
  tags: string[];
  extension: Record<string, string>;
};

export type PairInfo = {
  volume: number;
  volumeQuote: number;
  volumeFee: number;
  apr: number;
  feeApr: number;
  priceMin: number;
  priceMax: number;
  rewardApr: number[];
};

export type Pair = {
  type: "Concentrated" | "Standard";
  programId: string;
  id: string;
  mintA: Mint;
  mintB: Mint;
  rewardDefaultPoolInfo: "Clmm";
  rewardDefaultInfo: { mint: Mint }[];
  price: number;
  mintAmountA: number;
  mintAmountB: number;
  feeRate: number;
  openTime: string;
  tvl: string;
  day: PairInfo;
  week: PairInfo;
  month: PairInfo;
  poolType: "Clmm"[];
  farmUpcomingCount: number;
  farmOncomingCount: number;
  farmFinishedCount: number;
  config: {
    id: string;
    index: number;
    burnPercent: number;
    protocolFeeRate: number;
    tradeFeeRate: number;
    tickSpacing: number;
    fundFeeRate: number;
    defaultRange: number;
    defaultRangePoint: number[];
    launchMigratePool: boolean;
  };
};
