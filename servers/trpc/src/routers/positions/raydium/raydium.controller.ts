import { BN } from "bn.js";
import assert from "assert";
import Decimal from "decimal.js";
import type { z } from "zod/mini";
import type Dex from "@rhiva-ag/dex";
import {
  batchSimulateTransactions,
  isNative,
  type SendTransaction,
} from "@rhiva-ag/shared";
import { getAssociatedTokenAddressSync, NATIVE_MINT } from "@solana/spl-token";
import {
  CLMM_PROGRAM_ID,
  getPdaPersonalPositionAddress,
  PositionInfoLayout,
  type ApiV3PoolInfoConcentratedItem,
} from "@raydium-io/raydium-sdk-v2";
import {
  getPreTokenBalanceForAccounts,
  getTokenBalanceChangesFromBatchSimulation,
  getTokenBalanceChangesFromSimulation,
} from "@rhiva-ag/dex";
import {
  type Keypair,
  PublicKey,
  type VersionedTransaction,
} from "@solana/web3.js";

import type {
  raydiumClaimRewardSchema,
  raydiumClosePositionSchema,
  raydiumCreatePositionSchema,
} from "./raydium.schema";

export const createPosition = async (
  dex: Dex,
  sender: SendTransaction,
  owner: Keypair,
  {
    pair,
    inputAmount,
    inputMint,
    slippage,
    priceChanges,
    jitoConfig,
  }: z.infer<typeof raydiumCreatePositionSchema>,
) => {
  const pool = await dex.dlmm.raydium.raydium.clmm.getRpcClmmPoolInfo({
    poolId: pair,
  });
  let tokenA = BigInt(0),
    tokenB = BigInt(0);

  const swapV0Transactions: VersionedTransaction[] = [];
  const tokenXMint = pool.mintA,
    tokenYMint = pool.mintB;

  const poolToken = [pool.mintA, pool.mintB];

  if (isNative(inputMint)) {
    for (const token of poolToken) {
      const amount = inputAmount / 2;
      const bigAmount = BigInt(
        new Decimal(amount).mul(Math.pow(10, 9)).toFixed(),
      );
      if (isNative(token)) {
        if (token === tokenXMint) {
          tokenA = bigAmount;
        } else if (token === tokenYMint) tokenB = bigAmount;
      } else {
        const { quote, transaction } = await dex.swap.jupiter.buildSwap({
          slippage,
          inputMint,
          amount: bigAmount,
          owner: owner.publicKey,
          outputMint: new PublicKey(token),
        });

        if (token === tokenXMint) {
          const quoteAmount = quote[tokenXMint.toBase58()] ?? 0n;
          if (quoteAmount > 0n) {
            tokenA = quoteAmount;
            swapV0Transactions.push(transaction);
          }
        } else if (token === tokenYMint) {
          const quoteAmount = quote[tokenYMint.toBase58()] ?? 0n;
          if (quoteAmount > 0n) {
            tokenB = quoteAmount;
            swapV0Transactions.push(transaction);
          }
        }
      }
    }
  } else throw new Error("unsupported input mint");

  const { signers, builder } = await dex.dlmm.raydium.buildCreatePosition({
    slippage,
    priceChanges,
    pool: pair.toBase58(),
    inputMint: (tokenB > 0n ? tokenYMint : tokenXMint).toBase58(),
    inputAmount: new BN((tokenB > 0n ? tokenB : tokenA).toString()),
  });

  const jitoTipInstruction = await sender.getJitoTipInstruction(
    owner.publicKey,
    jitoConfig,
  );

  if (jitoTipInstruction)
    builder.addInstruction({ instructions: [jitoTipInstruction] });

  const { transaction: createPositionV0Transaction } = await builder.buildV0();

  createPositionV0Transaction.sign([owner, ...signers]);
  for (const transaction of swapV0Transactions) transaction.sign([owner]);

  const transactions = [...swapV0Transactions, createPositionV0Transaction];

  const bundleSimulationResponse = await sender.simulateBundle({
    transactions,
    skipSigVerify: true,
    replaceRecentBlockhash: true,
  });

  return {
    bundleSimulationResponse,
    async execute() {
      const { result } = await sender.sendBundle(transactions);
      return result;
    },
  };
};
export const claimReward = async (
  dex: Dex,
  sender: SendTransaction,
  owner: Keypair,
  {
    position: positionPubkey,
    pair,
    slippage,
    jitoConfig,
  }: z.infer<typeof raydiumClaimRewardSchema>,
) => {
  const accountInfo = await dex.connection.getAccountInfo(
    getPdaPersonalPositionAddress(CLMM_PROGRAM_ID, positionPubkey).publicKey,
  );
  assert(accountInfo, "position not found.");

  const position = PositionInfoLayout.decode(accountInfo.data);
  const [poolInfo] = await dex.dlmm.raydium.raydium.api.fetchPoolById({
    ids: pair.toBase58(),
  });

  assert(poolInfo, "pool not found.");

  const { builder } = await dex.dlmm.raydium.buildClaimReward({
    position,
    poolInfo: poolInfo as ApiV3PoolInfoConcentratedItem,
  });
  const jitoTipInstruction = await sender.getJitoTipInstruction(
    owner.publicKey,
    jitoConfig,
  );

  if (jitoTipInstruction)
    builder.addInstruction({ instructions: [jitoTipInstruction] });

  const { transactions: claimRewardV0Transactions } =
    await builder.buildV0MultiTx({});

  const tokenAAta = getAssociatedTokenAddressSync(
    new PublicKey(poolInfo.mintA.address),
    owner.publicKey,
    false,
    new PublicKey(poolInfo.mintA.programId),
  );
  const tokenBAta = getAssociatedTokenAddressSync(
    new PublicKey(poolInfo.mintB.address),
    owner.publicKey,
    false,
    new PublicKey(poolInfo.mintB.programId),
  );

  const preTokenBalanceChanges = await getPreTokenBalanceForAccounts(
    dex.connection,
    [tokenAAta, tokenBAta],
  );

  const simulationResponses = await batchSimulateTransactions(dex.connection, {
    transactions: claimRewardV0Transactions,
    options: {
      sigVerify: false,
      replaceRecentBlockhash: true,
      accounts: {
        addresses: [tokenAAta.toBase58(), tokenBAta.toBase58()],
        encoding: "base64",
      },
    },
  });
  const errors = simulationResponses
    .filter((response) => response.err != null)
    .map((response) => response.err);
  if (errors.length > 0) throw errors;

  const tokenBalanceChanges = getTokenBalanceChangesFromBatchSimulation(
    simulationResponses,
    preTokenBalanceChanges,
  );

  const swapV0Transactions = [];
  const tokens = [poolInfo.mintA, poolInfo.mintB];

  for (const token of tokens) {
    if (!isNative(token.address)) {
      const quoteAmount = tokenBalanceChanges[token.address] ?? 0n;
      if (quoteAmount > 0n) {
        const { transaction } = await dex.swap.jupiter.buildSwap({
          slippage,
          inputMint: new PublicKey(token.address),
          outputMint: NATIVE_MINT,
          owner: owner.publicKey,
          amount: quoteAmount.toString(),
        });

        swapV0Transactions.push(transaction);
      }
    }
  }

  for (const transaction of swapV0Transactions) transaction.sign([owner]);
  for (const transaction of claimRewardV0Transactions)
    transaction.sign([owner]);

  const transactions = [...claimRewardV0Transactions, ...swapV0Transactions];

  const bundleSimulationResponse = await sender.simulateBundle({
    transactions,
    skipSigVerify: true,
    replaceRecentBlockhash: true,
  });

  return {
    bundleSimulationResponse,
    async execute() {
      const { result } = await sender.sendBundle(transactions);
      return result;
    },
  };
};

export const closePosition = async (
  dex: Dex,
  sender: SendTransaction,
  owner: Keypair,
  {
    position: positionPubkey,
    pair,
    slippage,
    jitoConfig,
  }: z.infer<typeof raydiumClosePositionSchema>,
) => {
  const accountInfo = await dex.connection.getAccountInfo(
    getPdaPersonalPositionAddress(CLMM_PROGRAM_ID, positionPubkey).publicKey,
  );
  assert(accountInfo, "position not found.");

  const position = PositionInfoLayout.decode(accountInfo.data);
  const [poolInfo] = await dex.dlmm.raydium.raydium.api.fetchPoolById({
    ids: pair.toBase58(),
  });

  assert(poolInfo, "pool not found.");

  const { builder } = await dex.dlmm.raydium.buildClosePosition({
    position,
    poolInfo: poolInfo as ApiV3PoolInfoConcentratedItem,
  });
  const jitoTipInstruction = await sender.getJitoTipInstruction(
    owner.publicKey,
    jitoConfig,
  );

  if (jitoTipInstruction)
    builder.addInstruction({ instructions: [jitoTipInstruction] });

  const { transaction: closePositionV0Transaction } = await builder.buildV0();

  const tokenAAta = getAssociatedTokenAddressSync(
    new PublicKey(poolInfo.mintA.address),
    owner.publicKey,
    false,
    new PublicKey(poolInfo.mintA.programId),
  );
  const tokenBAta = getAssociatedTokenAddressSync(
    new PublicKey(poolInfo.mintB.address),
    owner.publicKey,
    false,
    new PublicKey(poolInfo.mintB.programId),
  );

  const preTokenBalanceChanges = await getPreTokenBalanceForAccounts(
    dex.connection,
    [tokenAAta, tokenBAta],
  );

  const simulationResponse = await dex.connection.simulateTransaction(
    closePositionV0Transaction,
    {
      sigVerify: false,
      replaceRecentBlockhash: true,
      accounts: {
        addresses: [tokenAAta.toBase58(), tokenBAta.toBase58()],
        encoding: "base64",
      },
    },
  );

  if (simulationResponse.value.err) throw simulationResponse.value.err;

  const tokenBalanceChanges = getTokenBalanceChangesFromSimulation(
    simulationResponse.value,
    preTokenBalanceChanges,
  );

  const swapV0Transactions = [];
  const tokens = [poolInfo.mintA, poolInfo.mintB];

  for (const token of tokens) {
    if (!isNative(token.address)) {
      const quoteAmount = tokenBalanceChanges[token.address] ?? 0n;
      if (quoteAmount > 0n) {
        const { transaction } = await dex.swap.jupiter.buildSwap({
          slippage,
          inputMint: new PublicKey(token.address),
          outputMint: NATIVE_MINT,
          owner: owner.publicKey,
          amount: quoteAmount.toString(),
        });

        swapV0Transactions.push(transaction);
      }
    }
  }

  closePositionV0Transaction.sign([owner]);
  for (const transaction of swapV0Transactions) transaction.sign([owner]);
  const transactions = [closePositionV0Transaction, ...swapV0Transactions];
  const bundleSimulationResponse = await sender.simulateBundle({
    transactions,
    skipSigVerify: true,
    replaceRecentBlockhash: true,
  });

  return {
    bundleSimulationResponse,
    async execute() {
      const { result } = await sender.sendBundle(transactions);
      return result;
    },
  };
};
