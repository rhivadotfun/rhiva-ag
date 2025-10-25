import "server-only";
import xior from "xior";
import type z from "zod";
import { format } from "util";
import type { safeAuthUserSchema } from "@rhiva-ag/trpc";

import AuthProvider from "./AuthProvider";

export default async function Auth({ children }: React.PropsWithChildren) {
  const user = await xior
    .get<z.infer<typeof safeAuthUserSchema>>(
      format("%s/api/auth/", process.env.NEXT_PUBLIC_BASE_URL),
    )
    .then(({ data }) => data)
    .catch((error) => {
      console.error(error);
      return undefined;
    });

  return <AuthProvider serverUser={user}>{children}</AuthProvider>;
}
