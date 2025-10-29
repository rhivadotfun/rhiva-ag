import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AiPageClient from "./page.client";
import { getQueryClient, getTRPC } from "@/trpc.server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function AiPage(props: PageProps<"/ai">) {
  const searchParams = await props.searchParams;

  const cookie = await cookies();
  const session = cookie.get("session");
  if (session) {
    const queryClient = getQueryClient();
    const trpc = getTRPC(session.value);
    await queryClient.prefetchQuery(trpc.ai.thread.list.queryOptions());

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AiPageClient searchParams={searchParams} />
      </HydrationBoundary>
    );
  }

  return redirect("/");
}
