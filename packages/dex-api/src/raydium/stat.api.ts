import { ApiImpl } from "../api-impl";
import type { Response } from "./models";

export class StatApi extends ApiImpl {
  protected path = "main";

  retrieve() {
    return ApiImpl.getData(
      this.xior.get<
        Response<{
          tvl: string;
          volume24: string;
        }>
      >(this.buildPath("info")),
    );
  }
}
