import type { z } from "zod/mini";
import type { Secret } from "@rhiva-ag/shared";
import type { walletSelectSchema } from "@rhiva-ag/datasource";
import { Keypair } from "@solana/web3.js";

export const loadWallet = (
  wallet: Pick<z.infer<typeof walletSelectSchema>, "key">,
  secret: Secret,
) => {
  const privateKey = secret.decrypt<string>(wallet.key);
  return Keypair.fromSecretKey(Buffer.from(privateKey, "base64"));
};
