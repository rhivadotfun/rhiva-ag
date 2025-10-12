import { join } from "path";
import assert from "assert";
import { format } from "util";
import { mapFilter } from "@rhiva-ag/shared";
import type { XiorInstance, XiorResponse } from "xior";

export abstract class ApiImpl {
  protected abstract path?: string;

  constructor(protected readonly xior: XiorInstance) {}

  protected buildPath(...path: (string | number | undefined)[]) {
    assert(this.path, "path not override");

    return join(
      this.path,
      mapFilter(path, (path) => (path ? String(path) : null)).reduce((a, b) =>
        join(a, b),
      ),
    );
  }

  protected buildPathWithQueryString(
    path: string,
    query?: Record<string, string | boolean | number | string[] | undefined>,
  ) {
    let encodedQuery: Record<string, string> | undefined;

    if (query)
      encodedQuery = Object.fromEntries(
        mapFilter(Object.entries(query), ([key, value]) => {
          if (Array.isArray(value)) return [key, value.join(",")];
          else if (value) return [key, value.toString()];
          return null;
        }),
      );
    const q = new URLSearchParams(encodedQuery);
    return format("%s?%s", path, q.toString());
  }

  static async getData<T extends object | number | string>(
    response: Promise<XiorResponse<T>>,
  ) {
    const { data } = await response;
    return data;
  }
}
