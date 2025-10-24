import { format } from "util";
import { useMemo } from "react";
import superjson from "superjson";
import type { AppRouter } from "@rhiva-ag/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

import { useAuth } from "@/hooks/useAuth";
import { TRPCProvider as Provider } from "@/trpc.client";

export default function TRPCProvider({ children }: React.PropsWithChildren) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const trpcClient = useMemo(
    () =>
      createTRPCClient<AppRouter>({
        links: [
          httpBatchLink({
            transformer: superjson,
            url: process.env.NEXT_PUBLIC_API_URL!,
            async headers() {
              const headers = new Headers();
              if (user?.accessToken)
                headers.set(
                  "authorization",
                  format("Bearer %s", user.accessToken),
                );
              return headers;
            },
          }),
        ],
      }),
    [user?.accessToken],
  );

  return (
    <Provider
      queryClient={queryClient}
      trpcClient={trpcClient}
    >
      {children}
    </Provider>
  );
}
