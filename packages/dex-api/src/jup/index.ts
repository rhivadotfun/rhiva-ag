import xior from "xior";
import type { XiorInstance } from "xior";

import TokenApi from "./token.api";
import { PriceApi } from "./price.api";
import type { ApiConfig } from "../type";

export class JupApi {
  private readonly xior: XiorInstance;

  readonly token: TokenApi;
  readonly price: PriceApi;

  constructor({ baseURL, apiKey }: ApiConfig) {
    this.xior = xior.create({
      baseURL,
      params: {
        apiKey,
      },
    });

    this.price = new PriceApi(this.xior);
    this.token = new TokenApi(this.xior);
  }
}
