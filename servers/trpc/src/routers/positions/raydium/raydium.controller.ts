import { BN } from "bn.js";
import assert from "assert";
import Decimal from "decimal.js";
import type { z } from "zod/mini";
import type Dex from "@rhiva-ag/dex";
import { PositionInfoLayout } from "@raydium-io/raydium-sdk-v2";
import { isNative, type SendTransaction } from "@rhiva-ag/shared";
import { getTokenBalanceChangesFromSimulation } from "@rhiva-ag/dex";
import { getAssociatedTokenAddressSync, NATIVE_MINT } from "@solana/spl-token";
import {
  type Keypair,
  PublicKey,
  type VersionedTransaction,
} from "@solana/web3.js";

import type {
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
      if (isNative(token)) {
        const bigAmount = BigInt(
          new Decimal(amount).mul(Math.pow(10, 9)).toFixed(),
        );
        if (token === tokenXMint) {
          tokenA = bigAmount;
        } else if (token === tokenYMint) tokenB = bigAmount;
      } else {
        const { quote, transaction } = await dex.swap.jupiter.buildSwap({
          amount,
          slippage,
          inputMint,
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

  const { signers, transaction: createPositionV0Transaction } =
    await dex.dlmm.raydium.buildCreatePosition({
      slippage,
      priceChanges,
      pool: pair.toBase58(),
      inputMint: (tokenB > 0n ? tokenYMint : tokenXMint).toBase58(),
      inputAmount: new BN((tokenB > 0n ? tokenB : tokenA).toString()),
    });

  for (const transaction of swapV0Transactions) transaction.sign([owner]);

  createPositionV0Transaction.sign([owner, ...signers]);

  const bundleSimulationResponse = await sender.simulateBundle({
    skipSigVerify: true,
    replaceRecentBlockhash: true,
    transactions: [...swapV0Transactions, createPositionV0Transaction],
  });

  return bundleSimulationResponse;
};

export const closePosition = async (
  dex: Dex,
  sender: SendTransaction,
  owner: Keypair,
  {
    position: positionPubkey,
    pair,
    slippage,
  }: z.infer<typeof raydiumClosePositionSchema>,
) => {
  const accountInfo = await dex.connection.getAccountInfo(positionPubkey);
  assert(accountInfo, "position not found.");
  const position = PositionInfoLayout.decode(accountInfo.data);
  const pool = await dex.dlmm.raydium.raydium.clmm.getPoolInfoFromRpc(pair);

  const { transaction: closePositionV0Transaction, signers } =
    await dex.dlmm.raydium.buildClosePosition({
      pool,
      position,
    });

  const tokenAAta = getAssociatedTokenAddressSync(
    new PublicKey(pool.poolInfo.mintA.address),
    owner.publicKey,
    false,
    new PublicKey(pool.poolInfo.mintA.programId),
  );
  const tokenBAta = getAssociatedTokenAddressSync(
    new PublicKey(pool.poolInfo.mintB.address),
    owner.publicKey,
    false,
    new PublicKey(pool.poolInfo.mintB.programId),
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

  const tokenBalanceChanges = getTokenBalanceChangesFromSimulation(
    simulationResponse.value,
    {},
  );

  const swapV0Transactions = [];
  const tokens = [pool.poolInfo.mintA, pool.poolInfo.mintB];

  for (const token of tokens) {
    if (!isNative(token.address)) {
      const quoteAmount = tokenBalanceChanges[token.address] ?? 0n;
      if (quoteAmount > 0n) {
        const { transaction } = await dex.swap.jupiter.buildSwap({
          slippage,
          inputMint: new PublicKey(token.address),
          outputMint: NATIVE_MINT,
          owner: owner.publicKey,
          amount: new Decimal(quoteAmount.toString())
            .div(Math.pow(10, token.decimals))
            .toNumber(),
        });

        swapV0Transactions.push(transaction);
      }
    }
  }

  closePositionV0Transaction.sign([owner, ...signers]);
  for (const transaction of swapV0Transactions) transaction.sign([owner]);

  const bundleSimulationResponse = await sender.simulateBundle({
    skipSigVerify: true,
    replaceRecentBlockhash: true,
    transactions: [closePositionV0Transaction, ...swapV0Transactions],
  });

  return bundleSimulationResponse;
};
