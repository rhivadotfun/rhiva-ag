import type { TransactionError } from "@solana/web3.js";

export type SimulateBundleRequest = {
  method: "simulateBundle";
  params: {
    simulationBank?: string;
    skipSigVerify?: boolean;
    replaceRecentBlockhash?: boolean;
    accounts?: {
      encoding: "base64";
      addresses: string[];
    };
    preExecutionAccountsConfigs?: { accountIndex: number; address: string[] }[];
    postExecutionAccountsConfigs?: {
      accountIndex: number;
      address: string[];
    }[];
    encodedTransactions: string[];
  }[];
};

export type SimulateBundleResponse = {
  jsonrpc: string;
  id: string;
  result: {
    context: {
      apiVersion: string;
      slot: number;
    };
    value: {
      summary: "succeeded";
      transactionResults: {
        err: TransactionError | null;
        logs: string[];
        preExecutionAccounts: AccountState[];
        postExecutionAccounts: AccountState[];
        unitsConsumed: number;
        returnData: {
          programId: string;
          data: string;
        };
      }[];
    };
  };
};

type AccountState = {
  lamports: number;
  owner: string;
  data: string;
  executable: boolean;
  rentEpoch: number;
};
