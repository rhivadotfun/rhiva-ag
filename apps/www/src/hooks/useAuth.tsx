import { useContext } from "react";
import {
  AuthContext,
  type AuthContextArgs,
} from "@/providers/AuthProvider.client";

export const useAuth = () =>
  useContext(AuthContext) as NonNullable<AuthContextArgs>;
