import "server-only";
import type z from "zod";
import { cookies } from "next/headers";
import type { safeAuthUserSchema } from "@rhiva-ag/trpc";

import { makeTRPCClient } from "@/trpc";
import AuthProvider from "./AuthProvider";

export default async function Auth({ children }: React.PropsWithChildren) {
  const cookie = await cookies();
  const session = cookie.get("session");
  let user: z.infer<typeof safeAuthUserSchema> | undefined;

  if (session) {
    const trpcClient = makeTRPCClient(session.value);
    const response = await trpcClient.user.me.query();

    user = { token: session.value, ...response };
  }

  return <AuthProvider serverUser={user}>{children}</AuthProvider>;
}
