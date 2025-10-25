import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AiPageClient from "./page.client";
import { getTRPCClient } from "@/trpc.server";

export default async function AiPage() {
  const cookie = await cookies();
  const session = cookie.get("session");
  if (session) {
    const trpcClient = getTRPCClient(session.value, "Session");
    const threads = await trpcClient.ai.thread.list.query();

    return <AiPageClient threads={threads} />;
  }

  return redirect("/");
}
