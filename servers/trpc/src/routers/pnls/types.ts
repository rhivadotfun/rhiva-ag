export type Position = {
  id: string;
  pool: {
    id: string;
    baseToken: {
      id: string;
      decimals: number;
    };
    quoteToken: {
      id: string;
      decimals: number;
    };
    rewardTokens?: {
      mint: {
        id: string;
        decimals: number;
      };
    }[];
  };
  config: {
    history?: {
      openPrice?: {
        quoteToken?: number;
        baseToken?: number;
      };
      closingPrice?: {
        quoteToken?: number;
        baseToken?: number;
      };
    };
  };
  createdAt: Date;
  updatedAt: Date;
};
