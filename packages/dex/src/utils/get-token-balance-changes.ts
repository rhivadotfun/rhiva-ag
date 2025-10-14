import { isSystemProgram, isTokenProgram } from "@rhiva-ag/shared";
import type { RpcSimulateTransactionResult } from "@solana/kit";
import type { SimulatedTransactionResponse } from "@solana/web3.js";
import { AccountLayout, NATIVE_MINT, type RawAccount } from "@solana/spl-token";

export const getTokenBalanceChangesFromSimulation = (
  result: RpcSimulateTransactionResult | SimulatedTransactionResponse,
  preTokenBalanceChanges: Record<string, bigint>,
) => {
  const postTokenBalanceChanges: Record<string, bigint> = {};
  if (result.accounts)
    for (const account of result.accounts) {
      if (account?.owner)
        if (isTokenProgram(account.owner)) {
          let data: RawAccount;
          if (Array.isArray(account.data)) {
            const [encodedData, encoding] = account.data;

            data = AccountLayout.decode(
              Buffer.from(encodedData, encoding as BufferEncoding),
            );
          } else if (account.data instanceof Object)
            data = account.data.parsed as RawAccount;
          else throw new Error("unsupported encoding");

          postTokenBalanceChanges[data.mint.toBase58()] = data.amount;
        } else if (
          isSystemProgram(account.owner) &&
          "space" in account &&
          account.space === 0
        ) {
          postTokenBalanceChanges[NATIVE_MINT.toBase58()] = BigInt(
            account.lamports,
          );
        }
    }

  const tokens = [
    ...new Set([
      ...Object.keys(preTokenBalanceChanges),
      ...Object.keys(postTokenBalanceChanges),
    ]),
  ];

  return Object.fromEntries(
    tokens.map((mint) => {
      const pre = preTokenBalanceChanges[mint] ?? 0n;
      const post = postTokenBalanceChanges[mint] ?? 0n;

      return [mint, post - pre];
    }),
  );
};

export const getTokenBalanceChangesFromBatchSimulation = (
  results: (RpcSimulateTransactionResult | SimulatedTransactionResponse)[],
  preTokenBalanceChanges: Record<string, bigint>,
) => {
  const tokenBalanceChanges: Record<string, bigint> = {};

  for (const result of results) {
    const tokenBalanceChanges = getTokenBalanceChangesFromSimulation(
      result,
      preTokenBalanceChanges,
    );
    for (const [mint, value] of Object.entries(tokenBalanceChanges)) {
      const amount = tokenBalanceChanges[mint] ?? 0n;
      tokenBalanceChanges[mint] = amount + value;
    }
  }

  return tokenBalanceChanges;
};
