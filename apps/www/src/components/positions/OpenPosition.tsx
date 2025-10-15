import type { getPair } from "@/lib/dex-api";

import OrcaOpenPosition from "./orca";
import RaydiumOpenPosition from "./raydium";
import MeteoraOpenPosition from "./meteora";

type OpenPositionProps = {
  open: boolean;
  dex: "meteora" | "orca" | "raydium";
  pool: Awaited<ReturnType<typeof getPair>>;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
};
export default function OpenPosition({ dex, ...props }: OpenPositionProps) {
  if (dex === "orca") return <OrcaOpenPosition {...props} />;
  if (dex === "raydium") return <RaydiumOpenPosition {...props} />;
  if (dex === "meteora") return <MeteoraOpenPosition {...props} />;
}
