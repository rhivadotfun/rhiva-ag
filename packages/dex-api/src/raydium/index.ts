import xior, { type XiorInstance } from "xior";

import { PoolApi } from "./pool.api";
import type { ApiConfig } from "../type";
import { StatApi } from "./stat.api";

export class RaydiumApi {
  private readonly xior: XiorInstance;

  readonly stat: StatApi;
  readonly pool: PoolApi;

  constructor({ baseURL, apiKey }: ApiConfig) {
    this.xior = xior.create({ baseURL, params: { apiKey } });

    this.pool = new PoolApi(this.xior);
    this.stat = new StatApi(this.xior);
  }
}
