import type { Connection } from "@solana/web3.js";

export class OrcaDLMM {
  constructor(private readonly connection: Connection) {
    this.connection;
  }
}
