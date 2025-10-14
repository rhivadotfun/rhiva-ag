import { BN } from "bn.js";
import { AccountLayout } from "@solana/spl-token";
import DLMM, { StrategyType } from "@meteora-ag/dlmm";
import { beforeAll, describe, test, expect } from "bun:test";
import { mapFilter, SendTransaction } from "@rhiva-ag/shared";
import { createJupiterApiClient, type SwapApi } from "@jup-ag/api";
import { getAssociatedTokenAddressSync, NATIVE_MINT } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import { getEnv } from "../src/env";
import { MeteoraDLMM } from "../src/meteora";
import { getTokenBalanceChangesFromSimulation, loadWallet } from "../src/utils";

describe("meteora", () => {
  let pool: DLMM;
  let jupiter: SwapApi;
  let wallet: Keypair;
  let connection: Connection;
  let meteora: MeteoraDLMM;
  let sender: SendTransaction;

  beforeAll(async () => {
    meteora = new MeteoraDLMM();
    wallet = loadWallet(getEnv("DEV_WALLET"));
    jupiter = createJupiterApiClient();
    sender = new SendTransaction(
      getEnv("HELIUS_API_URL"),
      getEnv("HELIUS_API_KEY"),
    );
    connection = new Connection(getEnv("SOLANA_RPC_URL"));
    pool = await DLMM.create(
      connection,
      new PublicKey("5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6"),
    );
  });

  test("createPosition", async () => {
    const inputMint = NATIVE_MINT.toBase58();
    const outputMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const amount = 10_000_000;

    const inputMintAta = getAssociatedTokenAddressSync(
      new PublicKey(inputMint),
      wallet.publicKey,
    );
    const outputMintAta = getAssociatedTokenAddressSync(
      new PublicKey(outputMint),
      wallet.publicKey,
    );
    const quoteResponse = await jupiter.quoteGet({
      inputMint,
      outputMint,
      amount,
      slippageBps: 50,
    });

    const swapResponse = await jupiter.swapPost({
      swapRequest: {
        quoteResponse,
        dynamicSlippage: true,
        dynamicComputeUnitLimit: true,
        userPublicKey: wallet.publicKey.toBase58(),
      },
    });

    const swapV0Transaction = VersionedTransaction.deserialize(
      Buffer.from(swapResponse.swapTransaction, "base64"),
    );

    const simulateSwapResponse = await connection.simulateTransaction(
      swapV0Transaction,
      {
        accounts: {
          encoding: "base64",
          addresses: [inputMintAta.toBase58(), outputMintAta.toBase58()],
        },
        sigVerify: false,
        commitment: "max",
        replaceRecentBlockhash: true,
      },
    );

    expect(simulateSwapResponse.value.err).toBe(null);

    const atas = [inputMintAta, outputMintAta];
    const preAccountInfos = await connection.getMultipleAccountsInfo(atas);
    const preTokenBalanceChanges = Object.fromEntries(
      mapFilter(preAccountInfos, (accountInfo) => {
        if (accountInfo) {
          const account = AccountLayout.decode(accountInfo.data);
          return [account.mint, account.amount];
        }
      }),
    );

    const tokenBalanceChanges = getTokenBalanceChangesFromSimulation(
      simulateSwapResponse.value,
      preTokenBalanceChanges,
    );

    const inputTokenB = tokenBalanceChanges[outputMint]!;
    const position = Keypair.generate();

    const createPositionInstructions = await meteora.buildCreatePosition({
      pool,
      slippage: 50,
      priceChanges: [0.001, 0.001],
      totalXAmount: new BN(0),
      owner: wallet.publicKey,
      position: position.publicKey,
      strategyType: StrategyType.Spot,
      totalYAmount: new BN(inputTokenB.toString()),
    });

    const { blockhash: recentBlockhash } =
      await connection.getLatestBlockhash();

    const createPositionV0Message = new TransactionMessage({
      recentBlockhash,
      payerKey: wallet.publicKey,
      instructions: createPositionInstructions,
    }).compileToV0Message();

    const createPositionV0Transaction = new VersionedTransaction(
      createPositionV0Message,
    );

    swapV0Transaction.sign([wallet]);
    createPositionV0Transaction.sign([wallet, position]);

    const bundleSimulationResponse = await sender.simulateBundles({
      skipSigVerify: true,
      transactions: [swapV0Transaction, createPositionV0Transaction],
    });

    expect(
      bundleSimulationResponse.result.value.transactionResults.every(
        (tx) => tx.err === null,
      ),
    ).toBe(true);
  });
});
