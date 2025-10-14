import type BN from "bn.js";
import Decimal from "decimal.js";
import {
  PoolUtils,
  TickUtils,
  TxVersion,
  type ClmmPositionLayout,
  type Raydium,
} from "@raydium-io/raydium-sdk-v2";

type CreatePositionArgs = {
  priceChanges: [endPrice: number, startPrice: number];
  pool: string;
  inputAmount: BN;
  inputMint: string;
  slippage: number;
};

export class RaydiumDLMM {
  constructor(private readonly raydium: Raydium) {}

  readonly buildCreatePosition = async ({
    pool,
    inputAmount,
    inputMint,
    priceChanges,
    slippage,
  }: CreatePositionArgs) => {
    const rpcPoolInfo = await this.raydium.clmm.getPoolInfoFromRpc(pool);
    const { poolInfo, poolKeys } = rpcPoolInfo;
    const [lowerPriceChange, upperPriceChange] = priceChanges;
    const currentPrice = poolInfo.price;
    const lowerPrice = currentPrice - currentPrice * lowerPriceChange;
    const upperPrice = currentPrice + currentPrice * upperPriceChange;

    const baseIn = poolInfo.mintA.address === inputMint;

    const { tick: lowerTick } = TickUtils.getPriceAndTick({
      baseIn,
      poolInfo,
      price: new Decimal(lowerPrice),
    });

    const { tick: upperTick } = TickUtils.getPriceAndTick({
      baseIn,
      poolInfo,
      price: new Decimal(upperPrice),
    });

    const epochInfo = await this.raydium.fetchEpochInfo();
    const tickLower = Math.min(lowerTick, upperTick),
      tickUpper = Math.max(lowerTick, upperTick);

    const liquidity = await PoolUtils.getLiquidityAmountOutFromAmountIn({
      poolInfo,
      epochInfo,
      slippage,
      tickLower,
      tickUpper,
      add: true,
      inputA: true,
      amountHasFee: true,
      amount: inputAmount,
    });

    return this.raydium.clmm.openPositionFromBase({
      poolInfo,
      poolKeys,
      tickLower,
      tickUpper,
      base: baseIn ? "MintA" : "MintB",
      baseAmount: baseIn
        ? liquidity.amountSlippageA.amount
        : liquidity.amountSlippageB.amount,
      otherAmountMax: baseIn
        ? liquidity.amountSlippageB.amount
        : liquidity.amountSlippageA.amount,
      ownerInfo: {
        useSOLBalance: true,
      },
    });
  };

  buildClosePosition = async ({
    pool,
    position,
  }: {
    pool: string;
    position: ClmmPositionLayout;
  }) => {
    const rpcPoolInfo = await this.raydium.clmm.getPoolInfoFromRpc(pool);
    const { poolInfo, poolKeys } = rpcPoolInfo;

    return this.raydium.clmm.closePosition({
      poolInfo,
      poolKeys,
      ownerPosition: position,
      txVersion: TxVersion.V0,
    });
  };
}
