export type Mint = {
  address: string;
  decimals: number;
  imageUrl: string;
  name: string;
  programId: string;
  symbol: string;
  tags: string[];
};

type PairStat = {
  fees: string;
  rewards: string;
  volume: string;
  yieldOverTvl: string;
};

export type Pair = {
  address: string;
  feeGrowthGlobalA: string;
  feeGrowthGlobalB: string;
  feeRate: number;
  liquidity: string;
  protocolFeeOwedA: string;
  protocolFeeOwedB: string;
  protocolFeeRate: number;
  rewardLastUpdatedTimestamp: string;
  sqrtPrice: string;
  tickCurrentIndex: number;
  tickSpacing: number;
  tickSpacingSeed: number[];
  tokenMintA: string;
  tokenMintB: string;
  tokenVaultA: number[];
  tokenVaultB: string;
  updatedAt: string;
  updatedSlot: number;
  whirlpoolBump: number[];
  whirlpoolsConfig: string;
  writeVersion: string;
  adaptiveFee?: {
    constants: {
      adaptiveFeeControlFactor: number;
      decayPeriod: number;
      filterPeriod: number;
      majorSwapThresholdTicks: number;
      maxVolatilityAccumulator: number;
      reductionFactor: number;
      tickGroupSize: number;
    };
    currentRate: number;
    maxRate: number;
    variables: {
      lastMajorSwapTimestamp: string;
      lastReferenceUpdateTimestamp: string;
      tickGroupIndexReference: number;
      volatilityAccumulator: number;
      volatilityReference: number;
    };
    tradeEnableTimestamp: string;
  } | null;
  adaptiveFeeEnabled: boolean;
  addressLookupTable: string;
  feeTierIndex: number;
  hasWarning: boolean;
  lockedLiquidityPercent: {
    lockedPercentage: string;
    name: string;
  }[];
  poolType: "splashpool";
  price: string;
  rewards: [
    {
      authority: string;
      emissions_per_second_x64: string;
      growth_global_x64: string;
      mint: string;
      vault: string;
      active: boolean;
      emissionsPerSecond: string;
    },
  ];
  stats: {
    "24h": PairStat;
    "7d": PairStat;
    "30d": PairStat;
  };
  tokenA: Mint;
  tokenB: Mint;
  tokenBalanceA: string;
  tokenBalanceB: string;
  tradeEnableTimestamp: string;
  tvlUsdc: string;
  yieldOverTvl: string;
};
