import { getTokens } from "@civic/auth/nextjs";

import { getTRPCClient } from "@/trpc.server";
import AuthProviderClient from "./AuthProvider.client";

export default async function AuthProvider({
  children,
}: React.PropsWithChildren) {
  const token = await getTokens();
  const trpc = getTRPCClient(token?.accessToken);
  const user = token ? await trpc.user.me.query() : undefined;

  return (
    <AuthProviderClient
      user={user ? { ...user, accessToken: token?.accessToken } : undefined}
    >
      {children}
    </AuthProviderClient>
  );
}
