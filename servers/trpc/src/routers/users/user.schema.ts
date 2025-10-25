import {
  settingsSelectSchema,
  userSelectSchema,
  walletSelectSchema,
} from "@rhiva-ag/datasource";

export const extendedUserSelectSchema = userSelectSchema
  .omit({ lastLogin: true })
  .extend({
    settings: settingsSelectSchema
      .omit({ user: true })
      .omit({ updatedAt: true }),
    wallet: walletSelectSchema.omit({
      key: true,
      user: true,
      wrappedDek: true,
      createdAt: true,
    }),
  });
