import merge from "deepmerge";
import type { ZodType } from "zod";
import type { $ZodIssue, ParseContext } from "zod/v4/core";

export const withZodSchema =
  <T>(schema: ZodType<T>, params?: Partial<ParseContext<$ZodIssue>>) =>
  (values: T): Partial<T> => {
    const result = schema.safeParse(values, params);

    if (result.success) return {};

    return result.error.issues.reduce((acc, curr) => {
      return merge(
        acc,
        curr.path.reduceRight(
          (errors, pathSegment) => ({
            [pathSegment]: !Object.keys(errors).length ? curr.message : errors,
          }),
          {},
        ),
      );
    }, {});
  };
