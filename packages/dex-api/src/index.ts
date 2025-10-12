import { JupApi } from "./jup";
import { OrcaApi } from "./orca";
import { SarosApi } from "./saros";
import { MeteoraApi } from "./meteora";
import { RaydiumApi } from "./raydium";
import { getEnv } from "./env" with { type: "macro" };

export { SarosApi, MeteoraApi };
export type { Chart } from "./saros/models";

export class DexApi {
  readonly jup: JupApi;
  readonly orca: OrcaApi;
  readonly saros: SarosApi;
  readonly raydium: RaydiumApi;
  readonly meteora: MeteoraApi;

  constructor() {
    this.jup = new JupApi(getEnv("JUPITER_API_URL"));
    this.orca = new OrcaApi(getEnv("ORCA_API_URL"));
    this.saros = new SarosApi(getEnv("SAROS_API_URL"));
    this.raydium = new RaydiumApi(getEnv("RAYDIUM_API_URL"));
    this.meteora = new MeteoraApi(getEnv("METEORA_API_URL"));
  }
}
