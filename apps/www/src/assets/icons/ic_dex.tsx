import IcOrcaIcon from "./ic_orca";
import IcSarosIcon from "./ic_saros";
import IcMeteoraIcon from "./ic_meteora";
import IcRaydiumIcon from "./ic_raydium";

type IcDexProps = {
  dex: "raydium-clmm" | "orca" | "meteora" | "saros";
} & React.ComponentPropsWithoutRef<"svg">;

export default function IcDex({ dex, ...props }: IcDexProps) {
  const mapIcons = {
    orca: IcOrcaIcon,
    meteora: IcMeteoraIcon,
    "raydium-clmm": IcRaydiumIcon,
    saros: IcSarosIcon,
  } as const;

  const Icon = mapIcons[dex];

  return <Icon {...props} />;
}
