import { useContext } from "react";
import type { NonNullable } from "@rhiva-ag/shared";

import { AuthContext, type TAuthContext } from "@/components/auth/AuthProvider";

export const useAuth = () =>
  useContext(AuthContext) as NonNullable<TAuthContext>;
