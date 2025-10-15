import xior from "xior";
import type { XiorInstance } from "xior";

import TokenApi from "./token.api";
import { PriceApi } from "./price.api";

export class JupApi {
  private readonly xior: XiorInstance;

  readonly token: TokenApi;
  readonly price: PriceApi;

  constructor(baseURL: string) {
    this.xior = xior.create({
      baseURL,
    });

    this.price = new PriceApi(this.xior);
    this.token = new TokenApi(this.xior);
  }
}
