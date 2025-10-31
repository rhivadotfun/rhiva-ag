import type BN from "bn.js";
import type { PublicKey } from "@solana/web3.js";
import type { LbPosition, StrategyType } from "@meteora-ag/dlmm";
import type { LiquidityBookServices } from "@saros-finance/dlmm-sdk";

export class SarosDLMM {
  constructor(readonly _services: LiquidityBookServices) {}

  readonly buildCreatePosition = async (_args: {
    pool: PublicKey;
    totalXAmount: BN;
    totalYAmount: BN;
    position: PublicKey;
    owner: PublicKey;
    slippage: number;
    priceChanges: [number, number];
    strategyType: StrategyType;
  }) => {};

  readonly buildClaimReward = async (_args: {
    pool: PublicKey;
    owner: PublicKey;
    position: LbPosition;
  }) => {};

  readonly buildClosePosition = async (_args: {
    pool: PublicKey;
    owner: PublicKey;
    position: LbPosition;
  }) => {};
}
