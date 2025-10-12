import xior from "xior";
import type { XiorInstance } from "xior";
import TokenApi from "./token.api";

export class JupApi {
  private readonly xior: XiorInstance;

  readonly token: TokenApi;

  constructor(baseURL: string) {
    this.xior = xior.create({
      baseURL,
    });

    this.token = new TokenApi(this.xior);
  }
}
