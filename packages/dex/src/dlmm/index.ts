import { createSolanaRpc } from "@solana/kit";
import type { Connection } from "@solana/web3.js";
import type { Raydium } from "@raydium-io/raydium-sdk-v2";

import { OrcaDLMM } from "./orca";
import { SarosDLMM } from "./saros";
import { RaydiumCLMM } from "./raydium";
import { MeteoraDLMM } from "./meteora";

export { OrcaDLMM, SarosDLMM, RaydiumCLMM, MeteoraDLMM };

export class DLMM {
  readonly rpc: ReturnType<typeof createSolanaRpc>;

  readonly orca: OrcaDLMM;
  readonly saros: SarosDLMM;
  readonly meteora: MeteoraDLMM;
  readonly raydium: RaydiumCLMM;

  constructor(connection: Connection, raydium?: Raydium) {
    this.rpc = createSolanaRpc(connection.rpcEndpoint);
    this.orca = new OrcaDLMM(this.rpc);
    this.saros = new SarosDLMM();
    this.meteora = new MeteoraDLMM();
    this.raydium = new RaydiumCLMM(raydium);
  }
}
