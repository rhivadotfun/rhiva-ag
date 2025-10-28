ALTER TABLE "pnls" ADD COLUMN "baseAmount" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pnls" ADD COLUMN "baseAmountUsd" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pnls" ADD COLUMN "quoteAmount" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pnls" ADD COLUMN "quoteAmountUsd" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pnls" ADD COLUMN "unclaimedBaseFee" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pnls" ADD COLUMN "unclaimedQuoteFee" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pnls" ADD COLUMN "config" jsonb;--> statement-breakpoint
ALTER TABLE "positions" DROP COLUMN "baseAmount";--> statement-breakpoint
ALTER TABLE "positions" DROP COLUMN "quoteAmount";