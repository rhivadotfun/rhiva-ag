import type { Pair } from "./models";
import { ApiImpl } from "../api-impl";
import type { NormalizedPair } from "../type";

type PairArgs = {
  page?: number;
  limit?: number;
  tags?: string[];
  skip_size?: number;
  sort_key?:
    | "tvl"
    | "volume"
    | "feetvlratio"
    | "lm"
    | "feetvlratio30m"
    | "feetvlratio1h"
    | "feetvlratio2h"
    | "feetvlratio4h"
    | "feetvlratio12h"
    | "volume30m"
    | "volume1h"
    | "volume2h"
    | "volume4h"
    | "volume12h";
  order_by?: "asc" | "desc";
  search_term?: string;
  hide_low_tvl?: boolean;
  hide_low_apr?: boolean;
  pools_to_top?: string[];
  include_unknown?: boolean;
  include_token_mints?: string[];
  include_pool_token_pairs?: string[];
};

export class PairApi extends ApiImpl {
  protected path: string = "pair";

  getPair(pair: string) {
    return ApiImpl.getData(this.xior.get<Pair>(this.buildPath(pair)));
  }

  allByGroups(args?: PairArgs) {
    return ApiImpl.getData(
      this.xior.get<{ groups: { name: string; pairs: Pair[] }[] }>(
        this.buildPathWithQueryString(this.buildPath("all_by_groups"), args),
      ),
    );
  }

  async allWithPagination(args?: PairArgs) {
    return ApiImpl.getData(
      this.xior.get<{ pairs: Pair[]; total: number }>(
        this.buildPathWithQueryString(
          this.buildPath("all_with_pagination"),
          args,
        ),
      ),
    );
  }

  normalize(
    pool: Pair,
    mintXDecimals: number,
    mintYDecimals: number,
  ): NormalizedPair {
    return {
      name: pool.name,
      address: pool.address,
      apr: pool.apr,
      binStep: pool.bin_step,
      price: pool.current_price,
      fees: pool.fees.hour_24,
      fees24H: pool.fees.hour_24,
      fees7d: pool.fees.hour_24,
      liquidity: parseFloat(pool.liquidity),
      maxFee: parseFloat(pool.max_fee_percentage),
      baseFee: parseFloat(pool.base_fee_percentage),
      volume24h: pool.trade_volume_24h,
      tvl: pool.fees_24h / pool.fee_tvl_ratio.hour_24,
      baseReserveAmount: pool.reserve_x_amount / Math.pow(10, mintXDecimals),
      quoteReserveAmount: pool.reserve_y_amount / Math.pow(10, mintYDecimals),
    };
  }
}
