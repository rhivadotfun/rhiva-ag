import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { makeTRPCClient } from "@/trpc";

export async function GET(request: NextRequest) {
  const cookie = await cookies();
  const session = cookie.get("session");
  console.log(request.cookies.getAll());

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
