import clsx from "clsx";
import { format } from "util";
import Image from "next/image";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { MdContentCopy, MdOutlineOpenInNew, MdWaterDrop } from "react-icons/md";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

import IcSolscan from "@/assets/ic_solscan.png";
import IcRugcheck from "@/assets/ic_rugcheck.jpg";
import IcBubbleMap from "@/assets/ic_bubblemap.png";
import IcDexScreener from "@/assets/ic_dexscreener.png";

import { truncateString } from "@/lib";

type AddressToolTipProps = {
  address: string;
} & React.ComponentProps<typeof PopoverButton>;

type Action = {
  name: string;
  icon: React.ReactNode;
  getLink?: (address: string) => string;
  onClick?: (address: string) => void;
};

export function TokenAddressTooltip(props: AddressToolTipProps) {
  const actions: Action[] = useMemo(
    () => [
      {
        name: "Copy",
        icon: <MdContentCopy />,
        onClick(address) {
          return navigator.clipboard.writeText(address);
        },
      },
      {
        name: "RugCheck",
        icon: (
          <Image
            src={IcRugcheck}
            width={24}
            height={24}
            alt="rugcheck"
            className="rounded"
          />
        ),
        getLink(address) {
          return format("https://rugcheck.xyz/tokens/%s", address);
        },
      },
      {
        name: "DexScreener",
        icon: (
          <Image
            src={IcDexScreener}
            width={24}
            height={24}
            alt="rugcheck"
            className="rounded-md"
          />
        ),
        getLink(address) {
          return format("https://dexscreener.com/%s/%s", "solana", address);
        },
      },
      {
        name: "Check Pools",
        icon: <MdWaterDrop />,
        getLink(address) {
          return format("/pools?query=%s", address);
        },
      },
    ],
    [],
  );

  return (
    <AddressTooltip
      {...props}
      actions={actions}
    />
  );
}

export function PoolAddressToolTip(props: AddressToolTipProps) {
  const actions: Action[] = useMemo(
    () => [
      {
        name: "Copy",
        icon: <MdContentCopy size={24} />,
        onClick(address) {
          return navigator.clipboard.writeText(address);
        },
      },
      {
        name: "SolScan",
        icon: (
          <Image
            src={IcSolscan}
            width={24}
            height={24}
            alt="rugcheck"
            className="rounded"
          />
        ),
        getLink(address) {
          return format("https://solscan.io/account/%s", address);
        },
      },
      {
        name: "RugCheck",
        icon: (
          <Image
            src={IcRugcheck}
            width={24}
            height={24}
            alt="rugcheck"
            className="rounded"
          />
        ),
        getLink(address) {
          return format("https://rugcheck.xyz/tokens/%s", address);
        },
      },
      {
        name: "BubbleMap",
        icon: (
          <Image
            src={IcBubbleMap}
            width={24}
            height={24}
            alt="rugcheck"
            className="rounded"
          />
        ),
        getLink(address) {
          return format("https://app.bubblemaps.io/sol/token/%s", address);
        },
      },
    ],
    [],
  );

  return (
    <AddressTooltip
      {...props}
      actions={actions}
    />
  );
}

export function AddressTooltip({
  address,
  actions,
  ...props
}: AddressToolTipProps & { actions: Action[] }) {
  const router = useRouter();

  return (
    <Popover
      as="div"
      className="relative"
    >
      <PopoverButton
        className={clsx(
          "flex items-center space-x-2 bg-white/10 px-2 p-0.5 rounded-md focus:outline-none",
          props.className,
        )}
      >
        <span className="text-sm">{truncateString(address)}</span>
        <MdOutlineOpenInNew />
      </PopoverButton>
      <PopoverPanel className="min-w-36 absolute inset-x-0 z-50 mt-2 flex flex-col bg-dark border border-white/10 rounded-xl">
        {actions.map((action) => (
          <PopoverButton
            key={action.name}
            type="button"
            className="group flex items-center space-x-2 p-2"
            onClick={() => {
              if (action.getLink) {
                const link = action.getLink(address);
                const external = /^(http|https)/.test(link);
                if (external) window.open(link);
                else router.push(link);
              } else action.onClick?.(address);
            }}
          >
            <div className="grayscale [&_svg]:fill-stone group-hover:grayscale-0 group-hover:[&_svg]:fill-light">
              {action.icon}
            </div>
            <span className="text-light text-nowrap">{action.name}</span>
          </PopoverButton>
        ))}
      </PopoverPanel>
    </Popover>
  );
}
