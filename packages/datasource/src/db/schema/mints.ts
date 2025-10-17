import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";

type Extension = {
  feeConfig?: {
    transferFeeConfigAuthority: string;
    withdrawWithheldAuthority: string;
    withheldAmount: string;
    olderTransferFee: {
      epoch: string;
      maximumFee: string;
      transferFeeBasisPoints: number;
    };
    newerTransferFee: {
      epoch: string;
      maximumFee: string;
      transferFeeBasisPoints: number;
    };
  };
};

export const mints = pgTable("mints", {
  id: text().primaryKey(),
  image: text(),
  name: text(),
  symbol: text(),
  decimals: integer().notNull(),
  tokenProgram: text().notNull(),
  extensions: jsonb().$type<Extension>(),
});
