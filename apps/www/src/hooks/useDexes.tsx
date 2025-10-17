import { useMemo } from "react";

import IcOrcaIcon from "@/assets/icons/ic_orca";
import IcMeteoraIcon from "@/assets/icons/ic_meteora";
import IcRaydiumIcon from "@/assets/icons/ic_raydium";

export type Dex = {
  title: string;
  icon?: React.ElementType;
  value: "orca" | "meteora" | "raydium-clmm" | null;
};

export function useDexes() {
  const dexes: Dex[] = useMemo(
    () => [
      { title: "All Pools", value: null },
      { title: "Orca", value: "orca", icon: IcOrcaIcon },
      { title: "Meteora", value: "meteora", icon: IcMeteoraIcon },
      { title: "Raydium", value: "raydium-clmm", icon: IcRaydiumIcon },
    ],
    [],
  );

  return dexes;
}
