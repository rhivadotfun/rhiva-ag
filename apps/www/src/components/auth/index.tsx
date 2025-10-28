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

export const getUser = async (
  refresh?: boolean,
): Promise<z.infer<typeof safeAuthUserSchema>> => {
  "use server";
  const cookie = await cookies();
  const sessionUser = cookie.get("user");
  const session = cookie.get("session");

  if (sessionUser && !refresh) return JSON.parse(sessionUser.value);
  if (session) {
    const trpcClient = makeTRPCClient(session.value);
    const response = await trpcClient.user.me.query();

    const user = { token: session.value, ...response };

    return user;
  }

  throw new Error("NOT_AUTHENTICATED");
};
