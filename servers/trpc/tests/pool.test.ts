import { describe, test } from "bun:test";
import { coingecko } from "../src/instances";

describe("pool.route", () => {
  test("list", async () => {
    const response = await coingecko.onchain.pools.megafilter.get({
      networks: "solana",
      include: "base_token,quote_token,dex",
      dexes: "meteora,raydium,orca",
    });
    console.log(response);
  });
});
