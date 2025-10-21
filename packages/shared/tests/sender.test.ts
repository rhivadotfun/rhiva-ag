import { describe, test, beforeAll, expect } from "bun:test";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  type Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import { getEnv } from "./env";
import { loadWallet } from "./utils";
import { batchSimulateTransactions, SendTransaction } from "../src";

describe("sender", () => {
  let wallet: Keypair;
  let connection: Connection;
  let sender: SendTransaction;

  beforeAll(() => {
    wallet = loadWallet(getEnv("DEV_WALLET"));
    sender = new SendTransaction(
      getEnv("HELIUS_API_URL"),
      getEnv("HELIUS_API_KEY"),
      getEnv("JITO_API_URL"),
      getEnv("JITO_UUID"),
    );
    connection = new Connection(clusterApiUrl("mainnet-beta"));
  });

  test("getBundleStatuses", async () => {
    const bundleId =
      "038a0521f6bb76fb8f4a7e2a7bb909dc37b20642e6cbd7dc6f0c1406b490ba96";
    const response = await sender.getBundleStatuses(bundleId);
    console.log(response, { depth: null });
    expect(response.result.value).toHaveLength(1);
  });

  test("batchSimulateTransactions", async () => {
    const to = new PublicKey("SKzz9oDd7auugMWr9YXyhmTDLaTFVKToodkYkiU18ET");
    const mint = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
    const toAta = getAssociatedTokenAddressSync(mint, to);
    const fromAta = getAssociatedTokenAddressSync(mint, wallet.publicKey);
    const transferInstructions = [
      createAssociatedTokenAccountIdempotentInstruction(
        wallet.publicKey,
        toAta,
        to,
        mint,
      ),
      createTransferInstruction(fromAta, toAta, wallet.publicKey, 10_000),
    ];

    const { blockhash: recentBlockhash } =
      await connection.getLatestBlockhash();
    const v0Message = new TransactionMessage({
      recentBlockhash,
      payerKey: wallet.publicKey,
      instructions: transferInstructions,
    }).compileToV0Message();
    const v0Transaction = new VersionedTransaction(v0Message);
    v0Transaction.sign([wallet]);

    const simulatedResponses = await batchSimulateTransactions(connection, {
      transactions: [v0Transaction],
      options: {
        accounts: {
          encoding: "base64",
          addresses: [toAta.toBase58(), fromAta.toBase58()],
        },
      },
    });

    expect(simulatedResponses.every((response) => response.err === null)).toBe(
      true,
    );
  });
});
