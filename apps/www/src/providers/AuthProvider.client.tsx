"use client";
import type z from "zod";
import { createContext, useState } from "react";
import type { userSelectSchema } from "@rhiva-ag/datasource";

export type AuthContextArgs = {
  user?: z.infer<typeof userSelectSchema> & { accessToken?: string };
  setUser: React.Dispatch<
    React.SetStateAction<
      (z.infer<typeof userSelectSchema> & { accessToken?: string }) | undefined
    >
  >;
};

export const AuthContext = createContext<AuthContextArgs | null>(null);

export default function AuthProviderClient({
  children,
  ...props
}: React.PropsWithChildren<{
  user?: z.infer<typeof userSelectSchema> & { accessToken?: string };
}>) {
  const [user, setUser] = useState(props.user);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
