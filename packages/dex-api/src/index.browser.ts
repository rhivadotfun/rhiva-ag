import { JupApi } from "./jup";
import { OrcaApi } from "./orca";
import { SarosApi } from "./saros";
import { MeteoraApi } from "./meteora";
import { RaydiumApi } from "./raydium";

export { SarosApi, MeteoraApi };
export type { Chart } from "./saros/models";

export class DexApi {
  readonly jup: JupApi;
  readonly orca: OrcaApi;
  readonly saros: SarosApi;
  readonly raydium: RaydiumApi;
  readonly meteora: MeteoraApi;

  constructor() {
    this.jup = new JupApi(process.env.APP_JUPITER_API_URL!);
    this.orca = new OrcaApi(process.env.APP_ORCA_API_URL!);
    this.saros = new SarosApi(process.env.APP_SAROS_API_URL!);
    this.raydium = new RaydiumApi(process.env.APP_RAYDIUM_API_URL!);
    this.meteora = new MeteoraApi(process.env.APP_METEORA_API_URL!);
  }
}
