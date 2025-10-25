import z from "zod";

export const walletAuthSchema = z.object({
  message: z.object({
    domain: z.url(),
    publicKey: z.string(),
    statement: z.string(),
    nonce: z.string().optional(), // todo csrf validation
  }),
  signature: z.string(),
});

export const firebaseTokenAuthSchema = z.object({
  token: z.string(),
});
