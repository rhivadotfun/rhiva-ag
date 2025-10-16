import type { SwapApi } from "@jup-ag/api";
import { mapFilter } from "@rhiva-ag/shared";
import {
  AccountLayout,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  PublicKey,
  type Connection,
  VersionedTransaction,
} from "@solana/web3.js";

import { getTokenBalanceChangesFromSimulation } from "../utils";

export class Jupiter {
  constructor(
    private readonly jupiter: SwapApi,
    private readonly connection: Connection,
  ) {}

  buildSwap = async ({
    owner,
    inputMint,
    outputMint,
    slippage,
    amount,
  }: {
    owner: PublicKey;
    inputMint: PublicKey | string;
    outputMint: PublicKey | string;
    amount: number;
    slippage: number;
  }) => {
    const inputMintAta = getAssociatedTokenAddressSync(
      new PublicKey(inputMint),
      owner,
    );
    const outputMintAta = getAssociatedTokenAddressSync(
      new PublicKey(outputMint),
      owner,
    );

    const quoteResponse = await this.jupiter.quoteGet({
      amount,
      slippageBps: slippage,
      inputMint: inputMint.toString(),
      outputMint: outputMint.toString(),
    });

    const swapResponse = await this.jupiter.swapPost({
      swapRequest: {
        quoteResponse,
        dynamicSlippage: true,
        dynamicComputeUnitLimit: true,
        userPublicKey: owner.toBase58(),
      },
    });

    const swapV0Transaction = VersionedTransaction.deserialize(
      Buffer.from(swapResponse.swapTransaction, "base64"),
    );

    const atas = [inputMintAta, outputMintAta];
    const preAccountInfos = await this.connection.getMultipleAccountsInfo(atas);
    const preTokenBalanceChanges = Object.fromEntries(
      mapFilter(preAccountInfos, (accountInfo) => {
        if (accountInfo) {
          const account = AccountLayout.decode(accountInfo.data);
          return [account.mint, account.amount];
        }
      }),
    );

    const simulateSwapResponse = await this.connection.simulateTransaction(
      swapV0Transaction,
      {
        accounts: {
          encoding: "base64",
          addresses: [inputMintAta.toBase58(), outputMintAta.toBase58()],
        },
        sigVerify: false,
        replaceRecentBlockhash: true,
      },
    );

    const tokenBalanceChanges = getTokenBalanceChangesFromSimulation(
      simulateSwapResponse.value,
      preTokenBalanceChanges,
    );

    return {
      quote: tokenBalanceChanges,
      transaction: swapV0Transaction,
    };
  };
}
