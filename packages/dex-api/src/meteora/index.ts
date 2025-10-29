import xior, { type XiorInstance } from "xior";

import { PairApi } from "./pair.api";
import { StatApi } from "./stat.api";
import type { ApiConfig } from "../type";

export class MeteoraApi {
  private readonly xior: XiorInstance;

  readonly pair: PairApi;
  readonly stat: StatApi;

  constructor({ baseURL, apiKey }: ApiConfig) {
    this.xior = xior.create({
      baseURL,
      params: { apiKey },
    });

    this.pair = new PairApi(this.xior);
    this.stat = new StatApi(this.xior);
  }
}
