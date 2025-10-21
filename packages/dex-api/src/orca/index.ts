import xior, { type XiorInstance } from "xior";

import { PoolApi } from "./pool.api";
import { StatApi } from "./stat.api";
import type { ApiConfig } from "../type";

export class OrcaApi {
  private readonly xior: XiorInstance;

  readonly pool: PoolApi;
  readonly stat: StatApi;

  constructor({ baseURL, apiKey }: ApiConfig) {
    this.xior = xior.create({ baseURL, params: { apiKey } });

    this.pool = new PoolApi(this.xior);
    this.stat = new StatApi(this.xior);
  }
}
