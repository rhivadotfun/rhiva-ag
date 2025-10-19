import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";

import { dexApi } from "@/instances";
import { useAppDispatch } from "@/store";
import { walletActions } from "@/store/wallet";
import { getWalletPNL } from "@/lib/get-tokens";

export default function AppData() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { connection } = useConnection();

  const { data } = useQuery({
    queryKey: [
      "wallet",
      "tokens",
      "25kZHGK5ZhRVkPkdCxkLezycHYMFgSUdSpZB3yHZYPe5",
    ],
    queryFn: async () =>
      getWalletPNL(
        connection,
        dexApi,
        "25kZHGK5ZhRVkPkdCxkLezycHYMFgSUdSpZB3yHZYPe5",
      ),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (data) dispatch(walletActions.setWalletToken(data));
  }, [data, dispatch]);

  return null;
}
