import { getTRPCClient } from "@/trpc.server";
import { getTokens } from "@civic/auth/nextjs";

import AiPageClient from "./page.client";

export default async function AiPage() {
  const token = await getTokens();
  const trpcClient = getTRPCClient(token?.accessToken);
  const threads = await trpcClient.ai.thread.list.query();

  return <AiPageClient threads={threads} />;
}
