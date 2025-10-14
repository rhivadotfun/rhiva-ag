import type { RpcSimulateTransactionResult } from "@solana/kit";
import { AccountLayout, type RawAccount } from "@solana/spl-token";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, type SimulatedTransactionResponse } from "@solana/web3.js";

function isTokenProgram(value: string) {
  const pubkey = new PublicKey(value);
  return (
    TOKEN_PROGRAM_ID.equals(pubkey) || TOKEN_2022_PROGRAM_ID.equals(pubkey)
  );
}

export const getTokenBalanceChangesFromSimulation = (
  result: RpcSimulateTransactionResult | SimulatedTransactionResponse,
  preTokenBalanceChanges: Record<string, bigint>,
) => {
  const postTokenBalanceChanges: Record<string, bigint> = {};
  if (result.accounts)
    for (const account of result.accounts) {
      if (account?.owner && isTokenProgram(account.owner)) {
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
      const pre = preTokenBalanceChanges[mint] || 0n;
      const post = postTokenBalanceChanges[mint] || 0n;

      return [mint, post - pre];
    }),
  );
};
