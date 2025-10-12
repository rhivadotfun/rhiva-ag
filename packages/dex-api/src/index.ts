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

  static defaultConfig = {
    orcaApiUrl: "https://api.orca.so/v2",
    jupApiUrl: "https://lite-api.jup.ag",
    meteoraApiUrl: "https://dlmm-api.meteora.ag",
    raydiumApiUrl: "https://api-v3.raydium.io",
    sarosApiUrl: "https://api.saros.xyz/api/dex-v3",
  };

  constructor(config?: {
    jupApiUrl?: string;
    orcaApiUrl?: string;
    sarosApiUrl?: string;
    raydiumApiUrl?: string;
    meteoraApiUrl?: string;
  }) {
    const { jupApiUrl, orcaApiUrl, sarosApiUrl, raydiumApiUrl, meteoraApiUrl } =
      { ...config, ...DexApi.defaultConfig };
    this.jup = new JupApi(jupApiUrl);
    this.orca = new OrcaApi(orcaApiUrl);
    this.saros = new SarosApi(sarosApiUrl);
    this.raydium = new RaydiumApi(raydiumApiUrl);
    this.meteora = new MeteoraApi(meteoraApiUrl);
  }
}
