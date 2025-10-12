import xior, { type XiorInstance } from "xior";

import { PoolApi } from "./pool.api";
import { StatApi } from "./stat.api";

export class OrcaApi {
  private readonly xior: XiorInstance;

  readonly pool: PoolApi;
  readonly stat: StatApi;

  constructor(baseURL: string) {
    this.xior = xior.create({ baseURL });

    this.pool = new PoolApi(this.xior);
    this.stat = new StatApi(this.xior);
  }
}
