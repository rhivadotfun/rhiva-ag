import { format } from "util";
import { useMemo } from "react";
import superjson from "superjson";
import type { AppRouter } from "@rhiva-ag/trpc";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { TRPCProvider as Provider } from "@/trpc.client";

const queryClient = new QueryClient();

export default function TRPCProvider({ children }: React.PropsWithChildren) {
  const { user } = useAuth();
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
    <QueryClientProvider client={queryClient}>
      <Provider
        queryClient={queryClient}
        trpcClient={trpcClient}
      >
        {children}
      </Provider>
    </QueryClientProvider>
  );
}
