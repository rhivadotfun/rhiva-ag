import assert from "assert";
import type BN from "bn.js";
import Decimal from "decimal.js";
import {
  PoolUtils,
  TickUtils,
  TxVersion,
  type ClmmPositionLayout,
  type Raydium,
  type GetAmountParams,
  type PoolInfoLayout,
  SqrtPriceMath,
  LiquidityMath,
  getTransferAmountFeeV2,
  minExpirationTime,
  type TransferFeeDataBaseType,
  type PositionInfoLayout,
} from "@raydium-io/raydium-sdk-v2";

type CreatePositionArgs = {
  priceChanges: [endPrice: number, startPrice: number];
  pool: string;
  inputAmount: BN;
  inputMint: string;
  slippage: number;
};

export class RaydiumCLMM {
  readonly raydium: Raydium;

  constructor(raydium?: Raydium) {
    this.raydium = raydium!; // dangerous but we need too, assert for null runtime
  }

  readonly buildCreatePosition = async ({
    pool,
    inputAmount,
    inputMint,
    priceChanges,
    slippage,
  }: CreatePositionArgs) => {
    assert(this.raydium, "initialize raydium class to use this method");

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
      txVersion: TxVersion.V0,
    });
  };

  buildClosePosition = async ({
    pool,
    position,
  }: {
    pool: Awaited<ReturnType<Raydium["clmm"]["getPoolInfoFromRpc"]>>;
    position: ClmmPositionLayout;
  }) => {
    assert(this.raydium, "initialize raydium class to use this method");
    const { poolInfo, poolKeys } = pool;

    return this.raydium.clmm.closePosition({
      poolInfo,
      poolKeys,
      ownerPosition: position,
      txVersion: TxVersion.V0,
    });
  };

  static getAmountsFromLiquidity({
    poolInfo,
    ownerPosition,
    liquidity,
    add,
    mintA,
    mintB,
    epochInfo,
  }: Omit<GetAmountParams, "poolInfo" | "slippage" | "ownerPosition"> & {
    ownerPosition: ReturnType<typeof PositionInfoLayout.decode>;
    mintA?: { extensions?: { feeConfig?: TransferFeeDataBaseType } } | null;
    mintB?: { extensions?: { feeConfig?: TransferFeeDataBaseType } } | null;
    poolInfo: Pick<ReturnType<typeof PoolInfoLayout.decode>, "sqrtPriceX64">;
  }) {
    const sqrtPriceX64 = poolInfo.sqrtPriceX64;
    const sqrtPriceX64A = SqrtPriceMath.getSqrtPriceX64FromTick(
      ownerPosition.tickLower,
    );
    const sqrtPriceX64B = SqrtPriceMath.getSqrtPriceX64FromTick(
      ownerPosition.tickUpper,
    );

    const amounts = LiquidityMath.getAmountsFromLiquidity(
      sqrtPriceX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      liquidity,
      add,
    );

    const [amountA, amountB] = [
      getTransferAmountFeeV2(
        amounts.amountA,
        mintA?.extensions?.feeConfig,
        epochInfo,
        true,
      ),
      getTransferAmountFeeV2(
        amounts.amountB,
        mintB?.extensions?.feeConfig,
        epochInfo,
        true,
      ),
    ];

    return {
      liquidity,
      amountA,
      amountB,
      expirationTime: minExpirationTime(
        amountA.expirationTime,
        amountB.expirationTime,
      ),
    };
  }
}
