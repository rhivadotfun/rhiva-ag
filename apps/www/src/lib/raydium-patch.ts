import type { Connection, PublicKey } from "@solana/web3.js";
import { SqrtPriceMath, PoolInfoLayout } from "@raydium-io/raydium-sdk-v2";

export const getPoolState = async (
  connection: Connection,
  poolPubkey: PublicKey,
) => {
  const accountInfo = await connection.getAccountInfo(poolPubkey);

  if (accountInfo) {
    const pool = PoolInfoLayout.decode(accountInfo.data);
    const currentPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
      pool.sqrtPriceX64,
      pool.mintDecimalsA,
      pool.mintDecimalsB,
    ).toNumber();

    return { currentPrice, ...pool };
  }

  return null;
};
