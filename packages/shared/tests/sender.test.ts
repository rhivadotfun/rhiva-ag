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
import { batchSimulateTransactions } from "../src";

describe("sender", () => {
  let wallet: Keypair;
  let connection: Connection;

  beforeAll(() => {
    wallet = loadWallet(getEnv("DEV_WALLET"));
    connection = new Connection(clusterApiUrl("mainnet-beta"));
  });

  test("simulate transactions", async () => {
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

    expect(
      simulatedResponses.every((response) => response.value.err === null),
    ).toBe(true);
  });
});
