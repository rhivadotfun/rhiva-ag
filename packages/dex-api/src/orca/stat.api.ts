import { ApiImpl } from "../api-impl";

export class StatApi extends ApiImpl {
  protected path = "solana/protocol";

  retrieve() {
    return this.xior.get<{
      fees24hUsdc: string;
      revenue24hUsdc: string;
      tvl: string;
      volume24hUsdc: string;
    }>(this.path);
  }
}
