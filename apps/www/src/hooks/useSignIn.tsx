import { useCallback } from "react";
import { useCookies } from "react-cookie";
import { getTokens } from "@civic/auth/nextjs";
import { useToken, useUser } from "@civic/auth/react";

import { useAuth } from "./useAuth";
import { makeTRPCClient } from "@/trpc";

export const useSignIn = () => {
  const token = useToken();
  const { setUser } = useAuth();
  const { signIn } = useUser();
  const [cookies] = useCookies<
    "referralCode" | "displayName" | "user",
    { referralCode: string; user: string; displayName: string }
  >(["referralCode", "user", "displayName"]);

  const onSignIn = useCallback(async () => {
    return signIn().then(async () => {
      const accessToken = token.accessToken
        ? token.accessToken
        : await getTokens().then((token) => token?.accessToken);
      const trpcClient = makeTRPCClient(accessToken);

      await Promise.all([
        cookies.user
          ? trpcClient.refer.create.mutate({ referer: cookies.user })
          : undefined,
        cookies.displayName
          ? trpcClient.user.update.mutate({ displayName: cookies.displayName })
          : undefined,
      ]);

      const user = await trpcClient.user.me.query();

      setUser({ ...user, accessToken });
    });
  }, [cookies, signIn, token, setUser]);

  return onSignIn;
};
