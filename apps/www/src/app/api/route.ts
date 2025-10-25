import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { makeTRPCClient } from "@/trpc";

export async function GET() {
  const cookie = await cookies();
  const session = cookie.get("session");

  if (session) {
    const trpcClient = makeTRPCClient(session.value);
    const user = await trpcClient.user.me.query();
    return NextResponse.json({
      ...user,
      token: session.value,
    });
  }

  return NextResponse.json({ message: "NOT_AUTHORIZED" }, { status: 401 });
}
