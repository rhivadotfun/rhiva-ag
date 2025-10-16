import type { z } from "zod/mini";
import { Keypair } from "@solana/web3.js";
import type { Secret } from "@rhiva-ag/shared";
import type { walletSelectSchema } from "@rhiva-ag/datasource";

export const loadWallet = (
  wallet: Pick<z.infer<typeof walletSelectSchema>, "key">,
  secret: Secret,
) => {
  const privateKey = secret.decrypt<string>(wallet.key);
  return Keypair.fromSecretKey(Buffer.from(privateKey, "base64"));
};
