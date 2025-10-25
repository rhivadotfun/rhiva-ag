import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { makeTRPCClient } from "@/trpc";
import { TRPCProvider as Provider } from "@/trpc.client";

export default function TRPCProvider({ children }: React.PropsWithChildren) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const trpcClient = useMemo(() => makeTRPCClient(user?.token), [user?.token]);

  return (
    <Provider
      queryClient={queryClient}
      trpcClient={trpcClient}
    >
      {children}
    </Provider>
  );
}
