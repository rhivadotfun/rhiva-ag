"use client";

import { makeQueryClient } from "@/query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  isServer,
  type QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

let browserQueryClient: QueryClient;
function getQueryClient() {
  if (isServer) return makeQueryClient();

  if (!browserQueryClient) browserQueryClient = makeQueryClient();

  return browserQueryClient;
}

export default function ReactQueryProvider({
  children,
}: React.PropsWithChildren) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
