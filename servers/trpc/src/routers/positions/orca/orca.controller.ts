import Decimal from "decimal.js";
import type { z } from "zod/mini";
import type Dex from "@rhiva-ag/dex";
import { fetchWhirlpool } from "@orca-so/whirlpools-client";
import { fromLegacyPublicKey, fromVersionedTransaction } from "@solana/compat";
import { getAssociatedTokenAddressSync, NATIVE_MINT } from "@solana/spl-token";
import { isNative, mapFilter, type SendTransaction } from "@rhiva-ag/shared";
import {
  getPreTokenBalanceForAccounts,
  getTokenBalanceChangesFromSimulation,
} from "@rhiva-ag/dex";
import {
  type Keypair,
  PublicKey,
  type VersionedTransaction,
} from "@solana/web3.js";
import {
  appendTransactionMessageInstructions,
  createKeyPairSignerFromBytes,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type RpcSimulateTransactionResult,
  type Transaction,
} from "@solana/kit";

import type {
  orcaClosePositionSchema,
  orcaCreatePositionSchema,
} from "./orca.schema";

export const createPosition = async (
  dex: Dex,
  sender: SendTransaction,
  owner: Keypair,
  args: z.infer<typeof orcaCreatePositionSchema>,
) => {
  const signer = await createKeyPairSignerFromBytes(owner.secretKey);

  const { pair, inputAmount, inputMint, slippage, jitoConfig } = args;
  const pool = await fetchWhirlpool(dex.dlmm.rpc, pair);

  let tokenA = BigInt(0),
    tokenB = BigInt(0);

  const swapLegacyV0Transactions: VersionedTransaction[] = [];
  const tokenXMint = pool.data.tokenMintA,
    tokenYMint = pool.data.tokenMintB;

  const poolToken = [pool.data.tokenMintA, pool.data.tokenMintB];

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
          const quoteAmount = quote[tokenXMint] ?? 0n;
          if (quoteAmount > 0n) {
            tokenA = quoteAmount;
            swapLegacyV0Transactions.push(transaction);
          }
        } else if (token === tokenYMint) {
          const quoteAmount = quote[tokenYMint] ?? 0n;
          if (quoteAmount > 0n) {
            tokenB = quoteAmount;
            swapLegacyV0Transactions.push(transaction);
          }
        }
      }
    }
  } else throw new Error("unsupported input mint");

  const { instructions } = await dex.dlmm.orca.buildCreatePosition({
    ...args,
    tokenA,
    tokenB,
    pool,
    slippage,
    owner: signer,
  });

  const { value: recentBlockhash } = await dex.dlmm.rpc
    .getLatestBlockhash()
    .send();

  const createPositionV0Message = await pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(signer.address, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(recentBlockhash, tx),
    async (tx) =>
      appendTransactionMessageInstructions(
        [
          await sender.processJitoTipFromTxMessage(signer, jitoConfig),
          ...instructions,
        ],
        tx,
      ),
  );

  const swapV0Transactions = mapFilter(
    swapLegacyV0Transactions,
    (swapLegacyV0Transaction) => {
      swapLegacyV0Transaction.sign([owner]);
      return fromVersionedTransaction(swapLegacyV0Transaction);
    },
  );

  const createPositionV0Transaction: Transaction =
    await signTransactionMessageWithSigners(createPositionV0Message);

  const transactions = [...swapV0Transactions, createPositionV0Transaction];

  const bundleSimulationResponse = await sender.simulateBundle({
    skipSigVerify: true,
    replaceRecentBlockhash: true,
    transactions: transactions.map(getBase64EncodedWireTransaction),
  });

  return {
    bundleSimulationResponse,
    async execute() {
      const {
        result: { value },
      } = await sender.sendBundle(
        transactions.map(getBase64EncodedWireTransaction),
      );
      return value;
    },
  };
};

export const closePosition = async (
  dex: Dex,
  sender: SendTransaction,
  owner: Keypair,
  {
    slippage,
    position,
    pair,
    tokenA,
    tokenB,
    jitoConfig,
  }: z.infer<typeof orcaClosePositionSchema>,
) => {
  const signer = await createKeyPairSignerFromBytes(owner.secretKey);
  const pool = await fetchWhirlpool(dex.dlmm.rpc, pair);
  const { instructions } = await dex.dlmm.orca.buildClosePosition({
    position,
    slippage,
    owner: signer,
  });

  const { value: recentBlockhash } = await dex.dlmm.rpc
    .getLatestBlockhash()
    .send();

  const closePositionV0Message = await pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(signer.address, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(recentBlockhash, tx),
    async (tx) =>
      appendTransactionMessageInstructions(
        [
          await sender.processJitoTipFromTxMessage(signer, jitoConfig),
          ...instructions,
        ],
        tx,
      ),
  );

  const tokenAAta = getAssociatedTokenAddressSync(
    new PublicKey(pool.data.tokenMintA),
    owner.publicKey,
    false,
    new PublicKey(tokenA.owner),
  );
  const tokenBAta = getAssociatedTokenAddressSync(
    new PublicKey(pool.data.tokenMintB),
    owner.publicKey,
    false,
    new PublicKey(tokenB.owner),
  );

  const closePositionV0Transaction: Transaction =
    await signTransactionMessageWithSigners(closePositionV0Message);

  const preTokenBalanceChanges = await getPreTokenBalanceForAccounts(
    dex.connection,
    [tokenAAta, tokenBAta],
  );

  const simulationResponse = await dex.dlmm.rpc
    .simulateTransaction(
      getBase64EncodedWireTransaction(closePositionV0Transaction),
      {
        encoding: "base64",
        sigVerify: false,
        replaceRecentBlockhash: true,
        accounts: {
          addresses: [
            fromLegacyPublicKey(tokenAAta),
            fromLegacyPublicKey(tokenBAta),
          ],
          encoding: "base64",
        },
      },
    )
    .send();

  if (simulationResponse.value.err) throw simulationResponse.value.err;

  const tokenBalanceChanges = getTokenBalanceChangesFromSimulation(
    simulationResponse.value as unknown as RpcSimulateTransactionResult,
    preTokenBalanceChanges,
  );

  const swapV0Transactions = [];
  const tokens = [tokenA, tokenB];

  for (const token of tokens) {
    if (!isNative(token.mint)) {
      const quoteAmount = tokenBalanceChanges[token.mint] ?? 0n;
      if (quoteAmount > 0n) {
        const { transaction } = await dex.swap.jupiter.buildSwap({
          slippage,
          owner: owner.publicKey,
          outputMint: NATIVE_MINT,
          inputMint: new PublicKey(token.mint),
          amount: quoteAmount.toString(),
        });

        transaction.sign([owner]);

        swapV0Transactions.push(fromVersionedTransaction(transaction));
      }
    }
  }

  const transactions = [closePositionV0Transaction, ...swapV0Transactions];

  const bundleSimulationResponse = await sender.simulateBundle({
    skipSigVerify: true,
    replaceRecentBlockhash: true,
    transactions: transactions.map(getBase64EncodedWireTransaction),
  });

  return {
    bundleSimulationResponse,
    async execute() {
      const {
        result: { value },
      } = await sender.sendBundle(
        transactions.map(getBase64EncodedWireTransaction),
      );
      return value;
    },
  };
};
