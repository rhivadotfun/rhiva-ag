import { DexApi } from "@rhiva-ag/dex-api";
import { beforeAll, describe, test } from "bun:test";
import { clusterApiUrl, Connection } from "@solana/web3.js";

import { getWalletPNL } from "@/lib/get-tokens";

describe("get-wallet-token", () => {
  let dexApi: DexApi;
  let connection: Connection;

  beforeAll(() => {
    dexApi = new DexApi();
    connection = new Connection(clusterApiUrl("mainnet-beta"));
  });

  test("should get wallet tokens", async () => {
    const tokens = await getWalletPNL(
      connection,
      dexApi,
      "4nYVpmR3dUrbWB1uGRDA1vgjpcGy6zDac1PDiyi5BMbK",
    );

    console.log(tokens.summary, { depth: null });
  });
});
