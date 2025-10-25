import { useMemo } from "react";

export type Dex = {
  title: string;
  value: "orca" | "meteora" | "saros-dlmm" | "raydium-clmm" | null;
};

export function useDexes() {
  const dexes: Dex[] = useMemo(
    () => [
      { title: "All Pools", value: null },
      { title: "Orca", value: "orca" },
      { title: "Saros", value: "saros-dlmm" },
      { title: "Meteora", value: "meteora" },
      { title: "Raydium", value: "raydium-clmm" },
    ],
    [],
  );

  return dexes;
}
