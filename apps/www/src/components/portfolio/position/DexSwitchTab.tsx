import clsx from "clsx";
import Link from "next/link";
import { format } from "util";
import { useSearchParams } from "next/navigation";

import IcDex from "@/assets/icons/ic_dex";
import { useDexes, type Dex } from "@/hooks/useDexes";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { MdExpandMore } from "react-icons/md";

export default function DexSwitchTab() {
  const dexes = useDexes();
  const searchParams = useSearchParams();
  const dexId = searchParams.get("dex");

  return (
    <>
      <div className="flex items-center space-x-2 lt-sm:hidden">
        {dexes.map((dex) => {
          const selected = dex.value === dexId;
          const urlSearchParams = new URLSearchParams(searchParams);
          if (selected) urlSearchParams.delete("dex");
          else if (dex.value) urlSearchParams.set("dex", dex.value);
          else urlSearchParams.delete("dex");

          return (
            <Link
              key={dex.value}
              href={format("?%s", urlSearchParams.toString())}
              className={clsx(
                "flex items-center space-x-2 p-2 border-b-2",
                selected
                  ? "border-primary text-white"
                  : "text-gray border-transparent",
              )}
            >
              {dex.value && (
                <IcDex
                  dex={dex.value}
                  width={16}
                  height={16}
                  className="rounded-full"
                />
              )}
              <span>{dex.title}</span>
            </Link>
          );
        })}
      </div>
      <DexSwitchTabSmall
        dexes={dexes}
        className="sm:hidden"
      />
    </>
  );
}

type DexSwitchTabSmallProps = {
  dexes: Dex[];
} & React.ComponentProps<typeof Menu>;

function DexSwitchTabSmall({ dexes, ...props }: DexSwitchTabSmallProps) {
  const searchParams = useSearchParams();
  const dexId = searchParams.get("dex");

  const current = dexes.find((dex) => dex.value === dexId);

  return (
    <Menu
      as="div"
      className={clsx("relative z-50", props.className)}
    >
      <MenuButton className="flex items-center space-x-2 p-2">
        <span>{current?.title}</span>
        <MdExpandMore size={18} />
      </MenuButton>
      <MenuItems className="absolute flex flex-col bg-dark p-2 border border-white/10 p-2 rounded-xl">
        {dexes.map((dex) => {
          const selected = dex.value === dexId;
          const urlSearchParams = new URLSearchParams(searchParams);
          if (selected) urlSearchParams.delete("dex");
          else if (dex.value) urlSearchParams.set("dex", dex.value);
          else urlSearchParams.delete("dex");

          return (
            <MenuItem
              as={Link}
              key={dex.value}
              href={format("?%s", urlSearchParams.toString())}
              className={clsx(
                "flex items-center space-x-2 p-2",
                !selected && "text-gray hover:text-white",
              )}
            >
              {dex.value && (
                <IcDex
                  dex={dex.value}
                  width={16}
                  height={16}
                  className="rounded-full"
                />
              )}
              <span>{dex.title}</span>
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
}
