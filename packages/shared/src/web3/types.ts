import type {
  TransactionConfirmationStatus,
  TransactionError,
} from "@solana/web3.js";

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
    preExecutionAccountsConfigs?: {
      accountIndex?: number;
      address: string[];
    }[];
    postExecutionAccountsConfigs?: {
      accountIndex?: number;
      address: string[];
    }[];
    encodedTransactions: string[];
  }[];
};

export type SimulateBundleResponse = {
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

type AccountState = {
  lamports: number;
  owner: string;
  data: string;
  executable: boolean;
  rentEpoch: number;
};

export type SendBundleRequest = {
  method: "sendBundle";
  params: [string[], { encoding: "base64" }];
};

export type SendBundleResponse = {
  result: string;
};

export type GetBundleStatusesRequest = {
  params: [string[]];
};

export type GetBundleStatusesResponse = null | {
  bundle_id: string;
  transactions: [];
  slot: number;
  confirmationStatus: TransactionConfirmationStatus;
  err: {
    ok: null;
  };
};

export type SolanaRPCResponse<T> = {
  jsonrpc: string;
  id: string;
  result: T;
};
