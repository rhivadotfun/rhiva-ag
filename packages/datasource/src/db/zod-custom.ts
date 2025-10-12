import z from "zod";

export const commaEnum = <T extends [string, ...string[]]>(values: T) => {
  const baseEnum = z.enum(values);
  const baseType = z.array(baseEnum);

  return z
    .union([
      z
        .string()
        .transform((value) =>
          value
            .split(/,/g)
            .map((value) => value.trim())
            .filter(Boolean),
        )
        .pipe(baseType),
      baseType,
    ])
    .transform((arr) => arr.join(","));
};
