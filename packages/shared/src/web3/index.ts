import xior from "xior";
import { format } from "util";
import { fromLegacyPublicKey } from "@solana/compat";
import {
  getTransferSolInstruction,
  type TransferSolInstruction,
} from "@solana-program/system";
import { lamports, type TransactionSigner } from "@solana/kit";
import {
  VersionedTransaction,
  type RpcResponseAndContext,
  SystemProgram,
  PublicKey,
  Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";

import {
  PercentileToKey,
  type GetBundleStatusesRequest,
  type GetBundleStatusesResponse,
  type JitoFeeConfig,
  type Percentile,
  type SendBundleRequest,
  type SimulateBundleRequest,
  type SimulateBundleResponse,
  type SolanaRPCResponse,
} from "./types";

export * from "./utils";
export type { SimulateBundleResponse };

export class SendTransaction {
  private readonly heliusURL: string;
  static readonly blockEngineURL = "https://bundles.jito.wtf";

  static jitoTipAddresses = [
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
  ];

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
    headers?: Headers,
  ) => {
    return xior.post<T>(
      url,
      {
        ...request,
        id: crypto.randomUUID(),
        jsonrpc: "2.0",
      },
      { headers },
    );
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
    >(
      format(
        "%s/api/v1/getBundleStatuses?uuid=%s",
        this.jitoApiURL,
        this.jitoUUID,
      ),
      {
        method: "sendBundle",
        params: [
          transactions.map((transaction) =>
            transaction instanceof VersionedTransaction
              ? transaction.serialize().toBase64()
              : transaction,
          ),
          { encoding: "base64" },
        ],
      },
    ).then(({ data }) => data);
  };

  readonly getBundleStatuses = async (...bundleIds: string[]) => {
    return this.sendRPCRequest<
      SolanaRPCResponse<RpcResponseAndContext<GetBundleStatusesResponse>>
    >(
      format(
        "%s/api/v1/getBundleStatuses?uuid=%s",
        this.jitoApiURL,
        this.jitoUUID,
      ),
      {
        params: [bundleIds],
      },
    ).then(({ data }) => data);
  };

  processJitoTipFromTxMessage(
    owner: PublicKey,
    transaction: TransactionInstruction[],
    config: JitoFeeConfig,
  ): Promise<TransactionInstruction[]>;
  processJitoTipFromTxMessage(
    owner: PublicKey,
    transaction: Transaction,
    config: JitoFeeConfig,
  ): Promise<Transaction>;
  processJitoTipFromTxMessage(
    owner: TransactionSigner,
    config: JitoFeeConfig,
  ): Promise<TransferSolInstruction>;
  async processJitoTipFromTxMessage(
    owner: PublicKey | TransactionSigner,
    transaction: Transaction | TransactionInstruction[] | JitoFeeConfig,
    config?: JitoFeeConfig,
  ) {
    let jitoTipLamports = BigInt(0);
    const tipAddress = SendTransaction.getJitoTipAddress();
    const jitoConfig = config ? config : (transaction as JitoFeeConfig);

    if (jitoConfig.type === "exact") jitoTipLamports = jitoConfig.amountLamport;
    else if (jitoConfig.type === "dynamic")
      jitoTipLamports = await this.recentJitoTop(
        jitoConfig.priorityFeePercentitle,
      );
    if (jitoTipLamports > 0n) {
      if (transaction instanceof Transaction)
        transaction.instructions = [
          SystemProgram.transfer({
            toPubkey: tipAddress,
            lamports: jitoTipLamports,
            fromPubkey: owner as PublicKey,
          }),
          ...transaction.instructions,
        ];
      else if (Array.isArray(transaction))
        return [
          ...transaction,
          SystemProgram.transfer({
            toPubkey: tipAddress,
            lamports: jitoTipLamports,
            fromPubkey: owner as PublicKey,
          }),
        ];
      else
        return getTransferSolInstruction({
          source: owner as TransactionSigner,
          amount: jitoTipLamports,
          destination: fromLegacyPublicKey(tipAddress),
        });

      return transaction;
    }

    return transaction;
  }

  async getJitoTipInstruction(
    owner: PublicKey,
    jitoConfig: JitoFeeConfig,
  ): Promise<TransactionInstruction | undefined> {
    let jitoTipLamports = BigInt(0);
    const tipAddress = SendTransaction.getJitoTipAddress();

    if (jitoConfig.type === "exact") jitoTipLamports = jitoConfig.amountLamport;
    else if (jitoConfig.type === "dynamic")
      jitoTipLamports = await this.recentJitoTop(
        jitoConfig.priorityFeePercentitle,
      );
    if (jitoTipLamports > 0n)
      return SystemProgram.transfer({
        toPubkey: tipAddress,
        lamports: jitoTipLamports,
        fromPubkey: owner as PublicKey,
      });
  }

  recentJitoTop = async (priorityFeePercentitle: Percentile = "50") => {
    const {
      data: [data],
      response,
    } = await xior.get(
      format(
        "%s%s",
        SendTransaction.blockEngineURL,
        "/api/v1/bundles/tip_floor",
      ),
    );

    if (!response.ok) return 0n;

    const key = PercentileToKey[priorityFeePercentitle];

    if (key)
      return lamports(
        BigInt(Math.floor(Number(data[key]) * Math.pow(10, 9))),
      ).valueOf();

    return 0n;
  };

  static getJitoTipAddress(): PublicKey {
    const index = Math.floor(
      Math.random() * SendTransaction.jitoTipAddresses.length,
    );

    return new PublicKey(SendTransaction.jitoTipAddresses[index]!);
  }
}
