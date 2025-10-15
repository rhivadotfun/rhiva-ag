import { SqrtPriceMath } from "@raydium-io/raydium-sdk-v2";
import { init } from "@rhiva-ag/decoder/programs/raydium/index";
import type { Connection, PublicKey } from "@solana/web3.js";

export const getPoolState = async (
  connection: Connection,
  poolPubkey: PublicKey,
) => {
  const [program] = init(connection);
  const pool = await program.account.poolState.fetch(poolPubkey);

  const currentPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
    pool.sqrtPriceX64,
    pool.mintDecimals0,
    pool.mintDecimals1,
  ).toNumber();

  return { currentPrice, ...pool };
};
