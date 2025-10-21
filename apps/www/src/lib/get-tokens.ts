import type { DexApi } from "@rhiva-ag/dex-api";
import { collectionToMap } from "@rhiva-ag/shared";
import { PublicKey, type Connection } from "@solana/web3.js";
import {
  NATIVE_MINT,
  NATIVE_MINT_2022,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

type ParsedTokenAccount = {
  info: {
    isNative: boolean;
    mint: string;
    owner: string;
    state: "initialized";
    tokenAmount: {
      amount: string;
      decimals: number;
      uiAmount: number;
      uiAmountString: string;
    };
    type: "account";
  };
};

export const isNativeMint = (value: string | PublicKey) => {
  const valuePubkey = new PublicKey(value);
  return (
    NATIVE_MINT.equals(valuePubkey) || NATIVE_MINT_2022.equals(valuePubkey)
  );
};

export const getWalletTokens = async (
  connection: Connection,
  dexApi: DexApi,
  wallet: string,
) => {
  const walletPubkey = new PublicKey(wallet);
  const [nativeBalance, ...tokenAccountInfos] = await Promise.all([
    connection.getBalance(walletPubkey),
    connection
      .getParsedTokenAccountsByOwner(walletPubkey, {
        programId: TOKEN_PROGRAM_ID,
      })
      .then(({ value }) => value),
    connection
      .getParsedTokenAccountsByOwner(walletPubkey, {
        programId: TOKEN_2022_PROGRAM_ID,
      })
      .then(({ value }) => value),
  ] as const);

  const tokenAccounts = tokenAccountInfos.flat();

  if (tokenAccounts.length === 0 || nativeBalance === 0) return [];

  const mints = [
    NATIVE_MINT.toString(),
    ...tokenAccounts.map(
      (tokenAccount) =>
        (tokenAccount.account.data.parsed as ParsedTokenAccount).info.mint,
    ),
  ];

  const tokens = collectionToMap(
    await dexApi.jup.token.list({
      category: "search",
      query: mints.join(","),
    }),
    (token) => token.id,
  );

  const nativeToken = tokens.get(NATIVE_MINT.toBase58())!;

  return [
    { ...nativeToken, balance: nativeBalance / Math.pow(10, 9) },
    ...tokenAccounts.map((tokenAccount) => {
      const parsed = tokenAccount.account.data.parsed as ParsedTokenAccount;
      const token = tokens.get(parsed.info.mint)!;
      return { ...token, balance: parsed.info.tokenAmount.uiAmount };
    }),
  ];
};

export const getWalletPNL = async (
  ...args: Parameters<typeof getWalletTokens>
) => {
  const tokens = await getWalletTokens(...args);
  let balance24h = 0;
  let balance = 0;

  for (const token of tokens) {
    const price = token.usdPrice;
    const price24h = price - price * (token.stats24h.priceChange / 100);
    balance += token.balance * price;
    balance24h += token.balance * price24h;
  }

  return {
    summary: {
      balance,
      balance24h,
      balanceChange: ((balance - balance24h) / balance24h) * 100,
    },
    tokens,
  };
};
