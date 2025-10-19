import z from "zod";
import { createUpdateSchema } from "drizzle-zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import {
  mints,
  notifications,
  pnls,
  poolFilters,
  pools,
  positions,
  referrers,
  rewards,
  settings,
  users,
  wallets,
} from "./schema";

export * from "./zod-custom";

export const walletSelectSchema = createSelectSchema(wallets);
export const settingsInsertSchema = createInsertSchema(settings);
export const settingsUpdateSchema = createUpdateSchema(settings);
export const settingsSelectSchema = createSelectSchema(settings);

export const userInsertSchema = createInsertSchema(users);
export const userUpdateSchema = createUpdateSchema(users);
export const userSelectSchema = createSelectSchema(users).extend({
  xp: z.number(),
  rank: z.number(),
  referXp: z.number(),
  totalUsers: z.number(),
  todayXp: z.number(),
  totalRefer: z.number(),
  settings: settingsSelectSchema.omit({ user: true }),
  wallet: walletSelectSchema.omit({ user: true, key: true }),
});

export const poolFilterInsertSchema = createInsertSchema(poolFilters);
export const poolFilterSelectSchema = createSelectSchema(poolFilters);

export const refererInsertSchema = createInsertSchema(referrers);
export const refererSelectSchema = createSelectSchema(referrers, {
  user: userInsertSchema,
  referer: userSelectSchema,
});

export const notificationInsertSchema = createInsertSchema(notifications);
export const notificationSelectSchema = createSelectSchema(notifications);

export const mintInsertSchema = createInsertSchema(mints);
export const mintSelectSchema = createSelectSchema(mints);

export const poolInsertSchema = createInsertSchema(pools);
export const poolSelectSchema = createSelectSchema(pools, {
  baseToken: mintSelectSchema,
  quoteToken: mintSelectSchema,
});

export const positionInsertSchema = createInsertSchema(positions);
export const positionSelectSchema = createSelectSchema(positions, {
  pool: poolSelectSchema,
});

export const pnlSelectSchema = createSelectSchema(pnls);
export const pnlInsertSchema = createInsertSchema(pnls, {
  position: positionSelectSchema,
});

export const rewardInsertSchema = createInsertSchema(rewards);
export const rewardSelectSchema = createSelectSchema(rewards);
