import type z from "zod";
import type Dex from "@rhiva-ag/dex";
import { PublicKey, type Connection } from "@solana/web3.js";
import type {
  positionSelectSchema,
  settingsSelectSchema,
  walletSelectSchema,
} from "@rhiva-ag/datasource";
import {
  batchSimulateTransactions,
  loadWallet,
  type KMSSecret,
  type SendTransaction,
} from "@rhiva-ag/shared";

import { closeRaydiumPosition } from "../../../../trpc/src/external";

export const rabalanceRaydiumPosition = async ({
  dex,
  secret,
  wallet,
  sender,
  settings,
  position,
  connection,
}: {
  dex: Dex;
  secret: KMSSecret;
  connection: Connection;
  sender: SendTransaction;
  position: z.infer<typeof positionSelectSchema>;
  settings: z.infer<typeof settingsSelectSchema>;
  wallet: Pick<z.infer<typeof walletSelectSchema>, "id" | "key">;
}) => {
  const swapToNative = settings.rebalanceType === "swap";

  const owner = await loadWallet(wallet, secret);
  const { swapV0Transactions, closePositionV0Transaction } =
    await closeRaydiumPosition(dex, owner, sender, {
      position: new PublicKey(position.id),
      pair: new PublicKey(position.pool.id),
      swapToNative,
      slippage: settings.slippage,
      jitoConfig: { type: "dynamic", priorityFeePercentile: "75" },
    });
  const _nativeAmount = BigInt(0);

  const _simulationResults = await batchSimulateTransactions(connection, {
    transactions: [closePositionV0Transaction, ...swapV0Transactions],
    options: {
      sigVerify: false,
      replaceRecentBlockhash: true,
    },
  });
};
