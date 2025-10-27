// don't waste time on performace on this script
// each dex guarantee to have O(1) and WSOL/USDC pool
import bs58 from "bs58";
import { eq } from "drizzle-orm";
import { Secret } from "@rhiva-ag/shared";
import { Keypair } from "@solana/web3.js";
import {
  createDB,
  mints,
  pools,
  positions,
  wallets,
} from "@rhiva-ag/datasource";

import { getEnv } from "../src/env";
import { AuthMiddleware } from "../src/controllers/auth.controller";

(async () => {
  const db = createDB(getEnv("DATABASE_URL"));
  const wallet = Keypair.fromSecretKey(bs58.decode(getEnv("DEV_WALLET")));
  const secret = new Secret(getEnv("SECRET_KEY"), {
    ivLength: 12,
    algorithm: "aes-256-gcm",
  });
  const user = await AuthMiddleware.upsertUser(db, secret, {
    uid: wallet.publicKey.toBase58(),
    email: "payouk.mystre@gmail.com",
  });
  if (user) {
    await db
      .update(wallets)
      .set({
        wrappedDek: null,
        id: wallet.publicKey.toBase58(),
        key: secret.encrypt(wallet.secretKey.toBase64()),
      })
      .where(eq(wallets.user, user.id));
    const baseToken = "So11111111111111111111111111111111111111112";
    const quoteToken = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const pairTokens: (typeof mints.$inferInsert)[] = [
      {
        id: "So11111111111111111111111111111111111111112",
        decimals: 9,
        name: "Solana",
        symbol: "SOL",
        image: "https://cryptologos.cc/logos/solana-sol-logo.png",
        tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      },
      {
        id: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        decimals: 6,
        name: "USD Coin",
        symbol: "USDC",
        image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
        tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      },
    ];
    const pairs: (typeof pools.$inferInsert)[] = [
      {
        dex: "meteora",
        id: "HTvjzsfX3yU6BUodCjZ5vZkUrAxMDTrBs3CJaq43ashR",
        baseToken,
        quoteToken,
        config: {},
      },
    ];

    const walletPositions: (typeof positions.$inferInsert)[] = [
      {
        id: "pitQ9ym11hjoxEAkifkWnkPjrFBkjbBfWrQRNmY21Ka",
        pool: "HTvjzsfX3yU6BUodCjZ5vZkUrAxMDTrBs3CJaq43ashR",
        amountUsd: 5.93,
        baseAmount: 0.029993998,
        quoteAmount: 0,
        active: true,
        state: "open",
        status: "successful",
        wallet: wallet.publicKey.toBase58(),
        config: {
          history: {
            openPrice: {
              baseToken: 197.70622109129965,
              quoteToken: 0.99,
            },
          },
        },
      },
    ];

    await db.insert(mints).values(pairTokens).onConflictDoNothing();
    await db.insert(pools).values(pairs).onConflictDoNothing();
    await db.insert(positions).values(walletPositions).onConflictDoNothing();
  }
})();
