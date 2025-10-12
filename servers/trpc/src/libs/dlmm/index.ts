import type { Connection } from "@solana/web3.js";

import { OrcaDLMM } from "./orca";
import { SarosDLMM } from "./saros";
import { RaydiumDLMM } from "./raydium";
import { MeteoraDLMM } from "./meteora";

export class DLMM {
  readonly orca: OrcaDLMM;
  readonly saros: SarosDLMM;
  readonly meteora: MeteoraDLMM;
  readonly raydium: RaydiumDLMM;

  constructor(connection: Connection) {
    this.orca = new OrcaDLMM(connection);
    this.saros = new SarosDLMM(connection);
    this.meteora = new MeteoraDLMM(connection);
    this.raydium = new RaydiumDLMM(connection);
  }
}
