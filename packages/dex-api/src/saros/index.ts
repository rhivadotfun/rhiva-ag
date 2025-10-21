import xior, { type XiorInstance } from "xior";
import { PoolApi } from "./pool.api";
import type { ApiConfig } from "../type";

export class SarosApi {
  private readonly xior: XiorInstance;

  readonly pool: PoolApi;

  constructor({ baseURL, apiKey }: ApiConfig) {
    this.xior = xior.create({ baseURL, params: { apiKey } });

    this.pool = new PoolApi(this.xior);
  }
}
