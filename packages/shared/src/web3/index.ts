import xior from "xior";
import { format } from "util";
import {
  VersionedTransaction,
  type RpcResponseAndContext,
} from "@solana/web3.js";

import type {
  GetBundleStatusesRequest,
  GetBundleStatusesResponse,
  SendBundleRequest,
  SimulateBundleRequest,
  SimulateBundleResponse,
  SolanaRPCResponse,
} from "./types";

export * from "./utils";
export type { SimulateBundleResponse };

export class SendTransaction {
  private readonly heliusURL: string;

  constructor(
    heliusApiURL: string,
    heliusApiKey: string,
    private readonly jitoApiURL: string,
    private readonly jitoUUID?: string,
  ) {
    this.heliusURL = format("%s?api-key=%s", heliusApiURL, heliusApiKey);
  }

  readonly sendRPCRequest = async <T>(
    url: string,
    request:
      | SimulateBundleRequest
      | SendBundleRequest
      | GetBundleStatusesRequest,
  ) => {
    return xior.post<T>(url, {
      ...request,
      id: crypto.randomUUID(),
      jsonrpc: "2.0",
    });
  };

  readonly simulateBundle = async ({
    transactions,
    ...params
  }: { transactions: (VersionedTransaction | string)[] } & Omit<
    SimulateBundleRequest["params"][number],
    "encodedTransactions"
  >) => {
    return this.sendRPCRequest<
      SolanaRPCResponse<RpcResponseAndContext<SimulateBundleResponse>>
    >(this.heliusURL, {
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

  readonly sendBundle = async (
    transactions: (VersionedTransaction | string)[],
  ) => {
    return this.sendRPCRequest<
      SolanaRPCResponse<RpcResponseAndContext<string>>
    >(format("%s/api/v1/getBundleStatuses", this.jitoApiURL), {
      method: "sendBundle",
      params: [
        transactions.map((transaction) =>
          transaction instanceof VersionedTransaction
            ? transaction.serialize().toBase64()
            : transaction,
        ),
        { encoding: "base64" },
      ],
    });
  };

  readonly getBundleStatuses = async (...bundleIds: string[]) => {
    return this.sendRPCRequest<
      SolanaRPCResponse<RpcResponseAndContext<GetBundleStatusesResponse>>
    >(format("%s/api/v1/getBundleStatuses", this.jitoApiURL), {
      params: [bundleIds],
    });
  };
}
