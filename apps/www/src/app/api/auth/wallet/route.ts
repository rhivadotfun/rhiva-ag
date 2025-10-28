import xior from "xior";
import type z from "zod";
import { format } from "util";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { safeAuthUserSchema } from "@rhiva-ag/trpc";

async function signIn(body: object) {
  const { data } = await xior.post<z.infer<typeof safeAuthUserSchema>>(
    format("%s/auth/wallet", process.env.NEXT_PUBLIC_API_URL),
    body,
  );
  return data;
}

export async function POST(request: Request) {
  const cookie = await cookies();

  const expiresIn = 604_800_000;
  const data = await request.json();
  const user = await signIn(data);

  cookie.set("session", user.token, {
    path: "/",
    secure: true,
    httpOnly: true,
    maxAge: expiresIn / 1_000,
  });
  cookie.set("user", JSON.stringify(user), {
    path: "/",
    secure: true,
    httpOnly: true,
    maxAge: 300,
  });

  return NextResponse.json(user);
}
