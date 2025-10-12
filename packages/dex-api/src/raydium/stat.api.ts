import { ApiImpl } from "../api-impl";

export class StatApi extends ApiImpl {
  protected path = "main";

  retrieve() {
    return this.xior.get<{
      tvl: string;
      volume24: string;
    }>(this.buildPath("info"));
  }
}
