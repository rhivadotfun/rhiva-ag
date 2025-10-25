import "server-only";

import { cache } from "react";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { makeTRPCClient } from "./trpc";
import { makeQueryClient } from "./query";

export const getQueryClient = cache(makeQueryClient);
export const getTRPCClient = cache(makeTRPCClient);
export const getTRPC = cache((token?: string) => {
  const client = getTRPCClient(token);
  return createTRPCOptionsProxy({
    client,
    queryClient: getQueryClient,
  });
});
