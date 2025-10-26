import type { AppRouter } from "@rhiva-ag/trpc";
import type { inferRouterOutputs } from "@trpc/server";

export type PositionData = PositionListOutput["items"][number];
export type RouterOutput = inferRouterOutputs<AppRouter>;
export type PositionListOutput = RouterOutput["position"]["list"];
