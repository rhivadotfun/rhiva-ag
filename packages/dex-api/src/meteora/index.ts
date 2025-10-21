import xior, { type XiorInstance } from "xior";

import { PairApi } from "./pair.api";
import type { ApiConfig } from "../type";

export class MeteoraApi {
  private readonly xior: XiorInstance;

  readonly pair: PairApi;

  constructor({ baseURL, apiKey }: ApiConfig) {
    this.xior = xior.create({
      baseURL,
      params: { apiKey },
    });

    this.pair = new PairApi(this.xior);
  }
}
