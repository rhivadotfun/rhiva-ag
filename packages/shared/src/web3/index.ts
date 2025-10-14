import xior from "xior";
import { format } from "util";
import { VersionedTransaction } from "@solana/web3.js";

import type { SimulateBundleRequest, SimulateBundleResponse } from "./types";

export type { SimulateBundleResponse };

export class SendTransaction {
  constructor(
    private readonly heliusApiURL: string,
    private readonly heliusApiKey: string,
  ) {}

  readonly sendRPCRequest = async <T>(request: SimulateBundleRequest) => {
    return xior.post<T>(
      format("%s?api-key=%s", this.heliusApiURL, this.heliusApiKey),
      { ...request, id: crypto.randomUUID(), jsonrpc: "2.0" },
    );
  };

  readonly simulateBundles = async ({
    transactions,
    ...params
  }: { transactions: (VersionedTransaction | string)[] } & Omit<
    SimulateBundleRequest["params"][number],
    "encodedTransactions"
  >) => {
    return this.sendRPCRequest<SimulateBundleResponse>({
      method: "simulateBundle",
      params: [
        {
          ...params,
          encodedTransactions: transactions.map((transaction) =>
            transaction instanceof VersionedTransaction
              ? transaction.serialize().toBase64()
              : transaction,
          ),
        },
      ],
    }).then(({ data }) => data);
  };
}
