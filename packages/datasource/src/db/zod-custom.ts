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

export const publicKey = () =>
  z
    .string()
    .min(32)
    .transform(async (value) => {
      const { PublicKey } = await import("@solana/web3.js");
      return new PublicKey(value);
    });

export const address = () =>
  z
    .string()
    .min(32)
    .transform(async (value) => {
      const { address } = await import("@solana/kit");
      return address(value);
    });
