import clsx from "clsx";
import Link from "next/link";
import { format } from "util";
import { useSearchParams } from "next/navigation";
import { IoChevronDownOutline } from "react-icons/io5";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

import IcOrcaIcon from "@/assets/icons/ic_orca";
import IcMeteoraIcon from "@/assets/icons/ic_meteora";
import IcRaydiumIcon from "@/assets/icons/ic_raydium";
import { MdCheck } from "react-icons/md";

const tabs = [
  { title: "All Pools", value: null },
  { title: "Meteora", value: "meteora", icon: IcMeteoraIcon },
  { title: "Orca", value: "orca", icon: IcOrcaIcon },
  { title: "Raydium", value: "raydium-clmm", icon: IcRaydiumIcon },
];

export default function PoolTab(props: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const dexes = searchParams.get("dexes");

  return (
    <div
      {...props}
      className={clsx("flex flex-nowrap space-x-4", props.className)}
    >
      {tabs.map((tab) => {
        const selected = tab.value === dexes;
        const urlSearchParams = new URLSearchParams(searchParams);
        if (tab.value) urlSearchParams.set("dexes", tab.value);
        else urlSearchParams.delete("dexes");

        return (
          <Link
            key={tab.title}
            href={format("?%s", urlSearchParams.toString())}
            className={clsx(
              "shrink-0 flex items-center space-x-2 border-b-4 px-2",
              selected ? "border-primary" : "border-b-transparent",
            )}
          >
            {tab.icon && (
              <tab.icon
                width={16}
                height={16}
              />
            )}
            <span>{tab.title}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function PoolTabSmall() {
  const searchParams = useSearchParams();
  const dexes = searchParams.get("dexes");

  return (
    <Menu
      as="div"
      className="relative z-50"
    >
      <MenuButton className="flex items-center space-x-2 focus:outline-none">
        <span>All Pools</span>
        <IoChevronDownOutline />
      </MenuButton>
      <MenuItems
        transition
        className="absolute origin-top-right flex flex-col  bg-dark-secondary  text-gray border border-white/10 px-4 py-2 rounded-md transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0 focus:outline-none"
      >
        {tabs.map((tab) => {
          const selected = tab.value === dexes;
          const urlSearchParams = new URLSearchParams(searchParams);
          if (tab.value) urlSearchParams.set("dexes", tab.value);
          else urlSearchParams.delete("dexes");

          return (
            <MenuItem key={tab.title}>
              <Link
                key={tab.title}
                href={format("?%s", urlSearchParams.toString())}
                className="flex space-x-2 items-center py-2"
              >
                {tab.icon && (
                  <tab.icon
                    width={24}
                    height={24}
                  />
                )}

                <span>{tab.title}</span>
                {selected && <MdCheck />}
              </Link>
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
}
