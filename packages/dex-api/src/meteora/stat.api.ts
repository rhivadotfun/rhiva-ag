import { ApiImpl } from "../api-impl";

export class StatApi extends ApiImpl {
  protected path = "info";

  retrieve() {
    return this.xior.get<{
      daily_fee: number;
      daily_trade_volume: number;
      total_fee: number;
      total_trade_volume: number;
      total_tvl: number;
    }>(this.buildPath("protocol_metrics"));
  }
}
