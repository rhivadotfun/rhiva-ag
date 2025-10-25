import z from "zod";

export const walletAuthSchema = z.object({
  message: z.object({
    domain: z.url(),
    nonce: z.string(),
    publicKey: z.string(),
    statement: z.string(),
  }),
  signature: z.string(),
});

export const firebaseTokenAuthSchema = z.object({
  token: z.string(),
});
