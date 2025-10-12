import { ApiImpl } from "../api-impl";
import type { Token } from "./models/token.model";

type TokenArgs = {
  query?: "verified" | "lst" | string;
  category:
    | "search"
    | "toporganicscore"
    | "toptraded"
    | "toptrending"
    | "recent"
    | "tag";
  timestamp?: "5m" | "1h" | "6h" | "24h";
  limit?: number;
};

export default class TokenApi extends ApiImpl {
  protected path = "tokens/v2";

  list(args: TokenArgs) {
    const path = this.buildPathWithQueryString(
      this.buildPath(args.category, args.timestamp),
      {
        query: args.query,
        limit: args.limit,
      },
    );

    return ApiImpl.getData(this.xior.get<Token[]>(path));
  }
}
