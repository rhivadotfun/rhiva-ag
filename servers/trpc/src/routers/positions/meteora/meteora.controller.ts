import BN from "bn.js";
import Decimal from "decimal.js";
import type { z } from "zod/mini";
import type Dex from "@rhiva-ag/dex";
import DLMM from "@meteora-ag/dlmm";
import { getTokenBalanceChangesFromBatchSimulation } from "@rhiva-ag/dex";
import { getAssociatedTokenAddressSync, NATIVE_MINT } from "@solana/spl-token";
import {
  batchSimulateTransactions,
  isNative,
  type SendTransaction,
} from "@rhiva-ag/shared";
import {
  Keypair,
  type PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import type {
  meteoraClosePositionSchema,
  meteoraCreatePositionSchema,
} from "./meteora.schema";

export const createPosition = async (
  dex: Dex,
  sender: SendTransaction,
  owner: Keypair,
  {
    pair,
    inputAmount,
    inputMint,
    liquidityRatio,
    sides,
    slippage,
    priceChanges,
    strategyType,
  }: z.infer<typeof meteoraCreatePositionSchema>,
) => {
  const pool = await DLMM.create(dex.connection, pair);

  let totalXAmount = new BN(0),
    totalYAmount = new BN(0);

  const swapV0Transactions: VersionedTransaction[] = [];
  const tokenXMint = pool.tokenX.mint.address,
    tokenYMint = pool.tokenY.mint.address;

  if (isNative(inputMint)) {
    for (const [index, side] of sides.entries()) {
      const ratio = liquidityRatio ? liquidityRatio[index]! : 1;
      const amount = inputAmount * ratio;
      if (isNative(side)) {
        const bigAmount = new BN(
          new Decimal(amount).mul(Math.pow(10, 9)).toFixed(),
        );
        if (side.equals(tokenXMint)) {
          totalXAmount = bigAmount;
        } else if (side.equals(tokenYMint)) totalYAmount = bigAmount;
      } else {
        const { quote, transaction } = await dex.swap.jupiter.buildSwap({
          amount,
          slippage,
          inputMint,
          outputMint: side,
          owner: owner.publicKey,
        });

        if (side.equals(tokenXMint)) {
          const quoteAmount = quote[tokenXMint.toBase58()] ?? 0n;
          if (quoteAmount > 0n) {
            totalXAmount = new BN(quoteAmount.toString());
            swapV0Transactions.push(transaction);
          }
        } else if (side.equals(tokenYMint)) {
          const quoteAmount = quote[tokenYMint.toBase58()] ?? 0n;
          if (quoteAmount > 0n) {
            totalYAmount = new BN(quoteAmount.toString());
            swapV0Transactions.push(transaction);
          }
        }
      }
    }
  } else throw new Error("unsupported input mint");

  const position = Keypair.generate();

  const createPositionInstructions = await dex.dlmm.meteora.buildCreatePosition(
    {
      pool,
      slippage,
      strategyType,
      totalXAmount,
      totalYAmount,
      priceChanges,
      owner: owner.publicKey,
      position: position.publicKey,
    },
  );

  const { blockhash: recentBlockhash } =
    await dex.connection.getLatestBlockhash();

  const createPositionV0Message = new TransactionMessage({
    recentBlockhash,
    payerKey: owner.publicKey,
    instructions: createPositionInstructions,
  }).compileToV0Message();

  const createPositionV0Transaction = new VersionedTransaction(
    createPositionV0Message,
  );

  createPositionV0Transaction.sign([owner, position]);
  for (const transaction of swapV0Transactions) transaction.sign([owner]);

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
    pair,
    slippage,
    position: positionPubkey,
  }: z.infer<typeof meteoraClosePositionSchema>,
) => {
  const pool = await DLMM.create(dex.connection, pair);
  const position = await pool.getPosition(positionPubkey);
  const transactions = await dex.dlmm.meteora.buildClosePosition({
    pool,
    position,
    owner: owner.publicKey,
  });

  const { blockhash: recentBlockhash } =
    await dex.connection.getLatestBlockhash();
  const closePositionV0Transactions = transactions.map((transaction) => {
    const v0Message = new TransactionMessage({
      recentBlockhash,
      payerKey: owner.publicKey,
      instructions: transaction.instructions,
    }).compileToV0Message();

    return new VersionedTransaction(v0Message);
  });

  const tokenAAta = getAssociatedTokenAddressSync(
    pool.tokenX.mint.address,
    owner.publicKey,
    false,
    pool.tokenX.owner,
  );
  const tokenBAta = getAssociatedTokenAddressSync(
    pool.tokenY.mint.address,
    owner.publicKey,
    false,
    pool.tokenY.owner,
  );

  const simulationResponses = await batchSimulateTransactions(dex.connection, {
    transactions: closePositionV0Transactions,
    options: {
      sigVerify: false,
      accounts: {
        addresses: [tokenAAta.toBase58(), tokenBAta.toBase58()],
        encoding: "base64",
      },
    },
  });

  const tokenBalanceChanges = getTokenBalanceChangesFromBatchSimulation(
    simulationResponses,
    {},
  );

  const swapV0Transactions = [];
  const tokenConfigs: [PublicKey, number][] = [
    [pool.tokenX.mint.address, pool.tokenX.mint.decimals],
    [pool.tokenY.mint.address, pool.tokenY.mint.decimals],
  ];

  for (const [mint, decimals] of tokenConfigs) {
    if (!isNative(mint)) {
      const quoteAmount = tokenBalanceChanges[mint.toBase58()] ?? 0n;
      if (quoteAmount > 0n) {
        const { transaction } = await dex.swap.jupiter.buildSwap({
          slippage,
          inputMint: mint,
          outputMint: NATIVE_MINT,
          owner: owner.publicKey,
          amount: new Decimal(quoteAmount.toString())
            .div(Math.pow(10, decimals))
            .toNumber(),
        });

        swapV0Transactions.push(transaction);
      }
    }
  }

  for (const transaction of swapV0Transactions) transaction.sign([owner]);
  for (const transaction of closePositionV0Transactions)
    transaction.sign([owner]);

  const bundleSimulationResponse = await sender.simulateBundle({
    skipSigVerify: true,
    replaceRecentBlockhash: true,
    transactions: [...closePositionV0Transactions, ...swapV0Transactions],
  });

  return bundleSimulationResponse;
};
