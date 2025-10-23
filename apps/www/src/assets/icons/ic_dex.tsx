import IcOrcaIcon from "./ic_orca";
import IcSarosIcon from "./ic_saros";
import IcMeteoraIcon from "./ic_meteora";
import IcRaydiumIcon from "./ic_raydium";

type IcDexProps = {
  dex: "raydium-clmm" | "orca" | "meteora" | "saros-dlmm" | (string & {});
} & React.ComponentPropsWithoutRef<"svg">;

export default function IcDex({ dex, ...props }: IcDexProps) {
  const mapIcons = {
    orca: IcOrcaIcon,
    meteora: IcMeteoraIcon,
    "saros-dlmm": IcSarosIcon,
    "raydium-clmm": IcRaydiumIcon,
  } as const;

  if (dex in mapIcons) {
    const Icon = mapIcons[dex as keyof typeof mapIcons];
    return <Icon {...props} />;
  }
}
