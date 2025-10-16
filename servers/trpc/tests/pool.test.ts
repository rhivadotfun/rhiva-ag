import { describe, test } from "bun:test";
import { coingecko } from "../src/instances";
import { NATIVE_MINT } from "@solana/spl-token";

describe("pool.route", () => {
  test("list", async () => {
    const response = await coingecko.simple.tokenPrice.getID("solana", {
      vs_currencies: "usd",
      contract_addresses: NATIVE_MINT.toBase58(),
    });
    console.log(response);
  });
});
