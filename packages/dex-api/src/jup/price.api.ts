import { ApiImpl } from "../api-impl";
import type { Price } from "./models/price.model";

export class PriceApi extends ApiImpl {
  protected override path = "price/v3";

  getPrices(...ids: string[]) {
    return ApiImpl.getData(
      this.xior.get<{ [key: string]: Price }>(
        this.buildPathWithQueryString(this.path, { ids }),
      ),
    );
  }
}
