import type {
  Address,
  Base64EncodedWireTransaction,
  Rpc,
  SimulateTransactionApi,
} from "@solana/kit";
import {
  type Connection,
  PublicKey,
  type SimulateTransactionConfig,
  SystemProgram,
  type VersionedTransaction,
} from "@solana/web3.js";
import {
  NATIVE_MINT,
  NATIVE_MINT_2022,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export const isNative = (value: string | PublicKey | Address) => {
  const pubkey = new PublicKey(value);
  return NATIVE_MINT.equals(pubkey) || NATIVE_MINT_2022.equals(pubkey);
};

export const isSystemProgram = (value: string | PublicKey | Address) => {
  const pubkey = new PublicKey(value);
  return SystemProgram.programId.equals(pubkey);
};

export const isTokenProgram = (value: string | PublicKey | Address) => {
  const pubkey = new PublicKey(value);
  return (
    TOKEN_PROGRAM_ID.equals(pubkey) || TOKEN_2022_PROGRAM_ID.equals(pubkey)
  );
};

export const batchRPCSimulateTransactions = (
  rpc: Rpc<SimulateTransactionApi>,
  {
    transactions,
    options,
  }: {
    transactions: Base64EncodedWireTransaction[];
    options: Exclude<
      Parameters<SimulateTransactionApi["simulateTransaction"]>[number],
      Base64EncodedWireTransaction
    >;
  },
) =>
  Promise.all(
    transactions.map((transaction) =>
      rpc
        .simulateTransaction(transaction, options)
        .send()
        .then(({ value }) => value),
    ),
  );

export const batchSimulateTransactions = (
  connection: Connection,
  {
    transactions,
    options,
  }: {
    transactions: VersionedTransaction[];
    options: SimulateTransactionConfig;
  },
) =>
  Promise.all(
    transactions.map((transaction) =>
      connection
        .simulateTransaction(transaction, options)
        .then(({ value }) => value),
    ),
  );
