import { format } from "util";
import superjson from "superjson";
import type { AppRouter } from "@rhiva-ag/trpc";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

export const getTRPCClient = (token?: string) =>
  createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: process.env.NEXT_PUBLIC_API_URL!,
        transformer: superjson,
        async headers() {
          const headers = new Headers();
          if (token) headers.set("authorization", format("Bearer %s", token));
          return headers;
        },
      }),
    ],
  });
