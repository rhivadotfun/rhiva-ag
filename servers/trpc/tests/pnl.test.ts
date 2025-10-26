import { Connection } from "@solana/web3.js";
import { beforeAll, describe, test } from "bun:test";
import Coingecko from "@coingecko/coingecko-typescript";

import { getEnv } from "../src/env";
import { getOrcaPositionPnLById } from "../src/routers/pnls/orca/orca.controller";
import { getMeteoraPositionPnLById } from "../src/routers/pnls/meteora/meteora.controller";
import { getRaydiumPositionPnLById } from "../src/routers/pnls/raydium/raydium.controller";

describe("pnl", () => {
  let coingecko: Coingecko;
  let connection: Connection;

  beforeAll(async () => {
    connection = new Connection(getEnv("SOLANA_RPC_URL"));
    coingecko = new Coingecko({
      environment: "pro",
      proAPIKey: getEnv("COINGECKO_API_KEY"),
    });
  });

  test("meteora", async () => {
    const pnl = await getMeteoraPositionPnLById(coingecko, connection, {
      id: "5epgivXdz6DaW4b75tHxzhH9smGmiQt5QxyssdZRtJX6",
      pool: {
        id: "5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6",
        baseToken: {
          id: "So11111111111111111111111111111111111111112",
          decimals: 9,
        },
        quoteToken: {
          id: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          decimals: 6,
        },
      },
      config: {
        history: {
          openPrice: {
            baseToken: 197.00072890269692,
            quoteToken: 1,
          },
          closingPrice: {
            baseToken: 195.00072150266953,
            quoteToken: 1,
          },
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(pnl).toBeInstanceOf(Object);
    expect(pnl.tvl).toBeGreaterThan(0);
    expect(pnl.pnl).toBeGreaterThan(0);
    expect(pnl.amountUsdChange).toBeGreaterThan(0);
  });

  test("orca", async () => {
    const pnl = await getOrcaPositionPnLById(coingecko, connection, {
      id: "F8u8KJnsbPaYs8cDkN6S8MyDteHqJHktspV9w8K4zFTB",
      pool: {
        id: "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE",
        baseToken: {
          id: "So11111111111111111111111111111111111111112",
          decimals: 9,
        },
        quoteToken: {
          id: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          decimals: 6,
        },
      },
      config: {
        history: {
          openPrice: {
            baseToken: 197.51931655711817,
            quoteToken: 1,
          },
          closingPrice: {
            baseToken: 197.5841190720547,
            quoteToken: 0.9995793330453897,
          },
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(pnl).toBeInstanceOf(Object);
    expect(pnl.tvl).toBeGreaterThan(0);
    expect(pnl.pnl).toBeGreaterThan(0);
    expect(pnl.amountUsdChange).toBeGreaterThan(0);
  });

  test("raydium", async () => {
    const pnl = await getRaydiumPositionPnLById(coingecko, connection, {
      id: "oX5vYqFVJZS549PPGTD3Qoqzq4684XzNjwgvaRydinx",
      pool: {
        id: "3ucNos4NbumPLZNWztqGHNFFgkHeRMBQAVemeeomsUxv",
        baseToken: {
          id: "So11111111111111111111111111111111111111112",
          decimals: 9,
        },
        quoteToken: {
          id: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          decimals: 6,
        },
        rewardTokens: [
          {
            mint: {
              id: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
              decimals: 6,
            },
          },
        ],
      },
      config: {
        history: {
          openPrice: {
            baseToken: 197.63947117340538,
            quoteToken: 0.9997690188818446,
          },
          closingPrice: {
            baseToken: 197.5682018754903,
            quoteToken: 0.9974147699018739,
          },
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(pnl).toBeInstanceOf(Object);
    expect(pnl.tvl).toBeGreaterThan(0);
    expect(pnl.pnl).toBeGreaterThan(0);
    expect(pnl.amountUsdChange).toBeGreaterThan(0);
  });
});
