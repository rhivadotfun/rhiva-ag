import { useContext } from "react";
import type { NonNullable } from "@rhiva-ag/shared";

import {
  AuthContext,
  type AuthContextArgs,
} from "@/providers/AuthProvider.client";

export const useAuth = () =>
  useContext(AuthContext) as globalThis.NonNullable<AuthContextArgs> & {
    user: NonNullable<AuthContextArgs["user"]>;
  };
