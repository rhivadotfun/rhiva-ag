import { BN } from "bn.js";
import { AccountLayout } from "@solana/spl-token";
import { Raydium } from "@raydium-io/raydium-sdk-v2";
import { beforeAll, describe, test, expect } from "bun:test";
import { mapFilter, SendTransaction } from "@rhiva-ag/shared";
import { createJupiterApiClient, type SwapApi } from "@jup-ag/api";
import { getAssociatedTokenAddressSync, NATIVE_MINT } from "@solana/spl-token";
import {
  Connection,
  type Keypair,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import { getEnv } from "./env";
import { loadWallet } from "./utils";
import { RaydiumCLMM } from "../src/dlmm/raydium";
import { getTokenBalanceChangesFromSimulation } from "../src/utils";

describe("raydium", () => {
  let jupiter: SwapApi;
  let wallet: Keypair;
  let raydium: RaydiumCLMM;
  let connection: Connection;
  let sender: SendTransaction;

  beforeAll(async () => {
    wallet = loadWallet(getEnv("DEV_WALLET"));
    jupiter = createJupiterApiClient();
    sender = new SendTransaction(
      getEnv("HELIUS_API_URL"),
      getEnv("HELIUS_API_KEY"),
      getEnv("JITO_API_URL"),
      getEnv("JITO_UUID"),
    );
    connection = new Connection(getEnv("SOLANA_RPC_URL"));
    raydium = new RaydiumCLMM(
      await Raydium.load({
        connection,
        owner: wallet.publicKey,
      }),
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

    const createPositionTransaction = await raydium.buildCreatePosition({
      slippage: 50,
      inputMint: outputMint,
      inputAmount: new BN(inputTokenB),
      priceChanges: [0.001, 0.001],
      pool: "3ucNos4NbumPLZNWztqGHNFFgkHeRMBQAVemeeomsUxv",
    });

    const { blockhash: recentBlockhash } =
      await connection.getLatestBlockhash();

    let createPositionV0Transaction: VersionedTransaction;
    if (createPositionTransaction.transaction instanceof Transaction) {
      const createPositionV0Message = new TransactionMessage({
        recentBlockhash,
        payerKey: wallet.publicKey,
        instructions: createPositionTransaction.transaction.instructions,
      }).compileToV0Message();

      createPositionV0Transaction = new VersionedTransaction(
        createPositionV0Message,
      );
    } else createPositionV0Transaction = createPositionTransaction.transaction;

    swapV0Transaction.sign([wallet]);
    createPositionV0Transaction.sign([
      wallet,
      ...createPositionTransaction.signers,
    ]);

    const bundleSimulationResponse = await sender.simulateBundle({
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
