import type z from "zod";
import {
  notifications,
  type Database,
  type notificationInsertSchema,
} from "@rhiva-ag/datasource";

export const sendNotification = (
  db: Database,
  values: z.infer<typeof notificationInsertSchema>,
) => {
  return db.update(notifications).set(values);
};
