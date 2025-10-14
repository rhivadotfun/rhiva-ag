import type { Connection } from "@solana/web3.js";
import type { Raydium } from "@raydium-io/raydium-sdk-v2";

import { DLMM } from "./dlmm";
import { SwapAggregator } from "./swap-ag";

export * from "./dlmm";
export * from "./utils";
export * from "./swap-ag";

export default class Dex {
  dlmm: DLMM;
  swap: SwapAggregator;

  constructor(
    readonly connection: Connection,
    raydium?: Raydium,
  ) {
    this.dlmm = new DLMM(connection, raydium);
    this.swap = new SwapAggregator(connection);
  }
}
