import Image from "next/image";

import IcOrcaIcon from "./ic_orca";
import IcSarosIcon from "./ic_saros.png";
import IcMeteoraIcon from "./ic_meteora.png";
import IcRaydiumIcon from "./ic_raydium.png";

type IcDexProps = {
  width?: number;
  height?: number;
  className?: string;
  dex: "raydium-clmm" | "orca" | "meteora" | "saros-dlmm" | (string & {});
};

export default function IcDex({ dex, ...props }: IcDexProps) {
  const mapIcons = {
    orca: IcOrcaIcon,
    meteora: (props: { width?: number; height?: number }) => (
      <Image
        src={IcMeteoraIcon}
        width={24}
        height={24}
        alt="meteora"
        {...props}
      />
    ),
    "saros-dlmm": (props: { width?: number; height?: number }) => (
      <Image
        src={IcSarosIcon}
        width={24}
        height={24}
        alt="saros"
        {...props}
      />
    ),
    "raydium-clmm": (props: { width?: number; height?: number }) => (
      <Image
        src={IcRaydiumIcon}
        width={24}
        height={24}
        alt="raydium"
        {...props}
      />
    ),
  } as const;

  if (dex in mapIcons) {
    const Icon = mapIcons[dex as keyof typeof mapIcons];
    return <Icon {...props} />;
  }
}
