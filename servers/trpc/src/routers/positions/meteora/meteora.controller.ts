import BN from "bn.js";
import Decimal from "decimal.js";
import type { z } from "zod/mini";
import type Dex from "@rhiva-ag/dex";
import DLMM from "@meteora-ag/dlmm";
import { getAssociatedTokenAddressSync, NATIVE_MINT } from "@solana/spl-token";
import {
  getPreTokenBalanceForAccounts,
  getTokenBalanceChangesFromBatchSimulation,
} from "@rhiva-ag/dex";
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
  meteoraClaimRewardSchema,
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
    jitoConfig,
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
      const bigAmount = new BN(
        new Decimal(amount).mul(Math.pow(10, 9)).toFixed(),
      );
      if (isNative(side)) {
        if (side.equals(tokenXMint)) {
          totalXAmount = bigAmount;
        } else if (side.equals(tokenYMint)) totalYAmount = bigAmount;
      } else {
        const { quote, transaction } = await dex.swap.jupiter.buildSwap({
          slippage,
          inputMint,
          outputMint: side,
          owner: owner.publicKey,
          amount: BigInt(bigAmount.toString()),
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

  let createPositionInstructions = await dex.dlmm.meteora.buildCreatePosition({
    pool,
    slippage,
    strategyType,
    totalXAmount,
    totalYAmount,
    priceChanges,
    owner: owner.publicKey,
    position: position.publicKey,
  });

  createPositionInstructions = await sender.processJitoTipFromTxMessage(
    owner.publicKey,
    createPositionInstructions,
    jitoConfig,
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
    pair,
    slippage,
    jitoConfig,
    position: positionPubkey,
  }: z.infer<typeof meteoraClaimRewardSchema>,
) => {
  const pool = await DLMM.create(dex.connection, pair);
  const position = await pool.getPosition(positionPubkey);
  const claimRewardTransactions = await dex.dlmm.meteora.buildClaimReward({
    pool,
    position,
    owner: owner.publicKey,
  });

  const { blockhash: recentBlockhash } =
    await dex.connection.getLatestBlockhash();
  const claimRewardV0Transactions = await Promise.all(
    claimRewardTransactions.map(async (transaction, index) => {
      if (index === 0)
        transaction = await sender.processJitoTipFromTxMessage(
          owner.publicKey,
          transaction,
          jitoConfig,
        );
      const v0Message = new TransactionMessage({
        recentBlockhash,
        payerKey: owner.publicKey,
        instructions: transaction.instructions,
      }).compileToV0Message();

      return new VersionedTransaction(v0Message);
    }),
  );

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

  const preTokenBalanceChanges = await getPreTokenBalanceForAccounts(
    dex.connection,
    [tokenAAta, tokenBAta],
  );

  const simulationResponses = await batchSimulateTransactions(dex.connection, {
    transactions: claimRewardV0Transactions,
    options: {
      sigVerify: false,
      accounts: {
        encoding: "base64",
        addresses: [tokenAAta.toBase58(), tokenBAta.toBase58()],
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
  const tokenConfigs: [PublicKey, number][] = [
    [pool.tokenX.mint.address, pool.tokenX.mint.decimals],
    [pool.tokenY.mint.address, pool.tokenY.mint.decimals],
  ];

  for (const [mint] of tokenConfigs) {
    if (!isNative(mint)) {
      const quoteAmount = tokenBalanceChanges[mint.toBase58()] ?? 0n;
      if (quoteAmount > 0n) {
        const { transaction } = await dex.swap.jupiter.buildSwap({
          slippage,
          inputMint: mint,
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
    pair,
    slippage,
    jitoConfig,
    position: positionPubkey,
  }: z.infer<typeof meteoraClosePositionSchema>,
) => {
  const pool = await DLMM.create(dex.connection, pair);
  const position = await pool.getPosition(positionPubkey);
  const closePositionTransactions = await dex.dlmm.meteora.buildClosePosition({
    pool,
    position,
    owner: owner.publicKey,
  });

  const { blockhash: recentBlockhash } =
    await dex.connection.getLatestBlockhash();
  const closePositionV0Transactions = await Promise.all(
    closePositionTransactions.map(async (transaction, index) => {
      if (index === 0)
        transaction = await sender.processJitoTipFromTxMessage(
          owner.publicKey,
          transaction,
          jitoConfig,
        );
      const v0Message = new TransactionMessage({
        recentBlockhash,
        payerKey: owner.publicKey,
        instructions: transaction.instructions,
      }).compileToV0Message();

      return new VersionedTransaction(v0Message);
    }),
  );

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

  const preTokenBalanceChanges = await getPreTokenBalanceForAccounts(
    dex.connection,
    [tokenAAta, tokenBAta],
  );

  const simulationResponses = await batchSimulateTransactions(dex.connection, {
    transactions: closePositionV0Transactions,
    options: {
      sigVerify: false,
      accounts: {
        encoding: "base64",
        addresses: [tokenAAta.toBase58(), tokenBAta.toBase58()],
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
  const tokenConfigs: [PublicKey, number][] = [
    [pool.tokenX.mint.address, pool.tokenX.mint.decimals],
    [pool.tokenY.mint.address, pool.tokenY.mint.decimals],
  ];

  for (const [mint] of tokenConfigs) {
    if (!isNative(mint)) {
      const quoteAmount = tokenBalanceChanges[mint.toBase58()] ?? 0n;
      if (quoteAmount > 0n) {
        const { transaction } = await dex.swap.jupiter.buildSwap({
          slippage,
          inputMint: mint,
          outputMint: NATIVE_MINT,
          owner: owner.publicKey,
          amount: quoteAmount.toString(),
        });

        swapV0Transactions.push(transaction);
      }
    }
  }

  for (const transaction of swapV0Transactions) transaction.sign([owner]);
  for (const transaction of closePositionV0Transactions)
    transaction.sign([owner]);

  const transactions = [...closePositionV0Transactions, ...swapV0Transactions];

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
