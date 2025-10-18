import { getTokenDecoder } from "@solana-program/token";
import { isSystemProgram, isTokenProgram, mapFilter } from "@rhiva-ag/shared";
import { AccountLayout, NATIVE_MINT, type RawAccount } from "@solana/spl-token";
import type {
  Address,
  Rpc,
  RpcSimulateTransactionResult,
  SolanaRpcApiMainnet,
} from "@solana/kit";
import {
  Connection,
  type PublicKey,
  type SimulatedTransactionResponse,
} from "@solana/web3.js";

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
  const globalTokenBalanceChanges: Record<string, bigint> = {};

  for (const result of results) {
    const tokenBalanceChanges = getTokenBalanceChangesFromSimulation(
      result,
      preTokenBalanceChanges,
    );

    for (const [mint, value] of Object.entries(tokenBalanceChanges)) {
      const amount = globalTokenBalanceChanges[mint] ?? 0n;
      globalTokenBalanceChanges[mint] = amount + value;
    }
  }

  return globalTokenBalanceChanges;
};

export function getPreTokenBalanceForAccounts(
  rpc: Rpc<SolanaRpcApiMainnet>,
  accounts: Address[],
): Promise<Record<string, bigint>>;
export function getPreTokenBalanceForAccounts(
  connection: Connection,
  accounts: PublicKey[],
): Promise<Record<string, bigint>>;
export async function getPreTokenBalanceForAccounts(
  connection: Connection | Rpc<SolanaRpcApiMainnet>,
  accounts: PublicKey[] | Address[],
): Promise<Record<string, bigint>> {
  if (connection instanceof Connection) {
    const accountInfos = await connection.getMultipleAccountsInfo(
      accounts as PublicKey[],
    );
    return Object.fromEntries(
      mapFilter(accountInfos, (accountInfo) => {
        if (accountInfo) {
          const account = AccountLayout.decode(accountInfo.data);
          return [account.mint.toBase58(), account.amount];
        }

        return null;
      }),
    );
  }

  const tokenDecoder = getTokenDecoder();
  const { value: accountInfos } = await connection
    .getMultipleAccounts(accounts as Address[])
    .send();

  return Object.fromEntries(
    mapFilter(accountInfos, (accountInfo) => {
      if (accountInfo) {
        const [data, encoding] = accountInfo.data;
        const account = tokenDecoder.decode(Buffer.from(data, encoding));
        return [account.mint, account.amount];
      }

      return null;
    }),
  );
}
