import { IoChevronDown } from "react-icons/io5";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

import Image from "../Image";
import type { getWalletTokens } from "@/lib/get-tokens";

type TokenSelectProps<
  T extends Awaited<ReturnType<typeof getWalletTokens>> = Awaited<
    ReturnType<typeof getWalletTokens>
  >,
> = {
  tokens: T;
  value: T[number];
  onChange: (value: T[number]) => void;
};

export default function TokenSelect({
  tokens,
  value,
  onChange,
}: TokenSelectProps) {
  return (
    <Menu
      as="div"
      className="relative flex flex-col space-y-12"
    >
      <MenuButton className="flex items-center justify-between border border-white/5 bg-black/10 p-3 rounded">
        <div className="flex items-center space-x-2">
          <Image
            src={value.icon}
            width={24}
            height={24}
            alt={value.symbol}
            className="rounded-full"
          />
          <span>{value.symbol}</span>
        </div>
        <IoChevronDown />
      </MenuButton>
      <MenuItems className="max-h-56 overflow-y-scroll absolute inset-x-0 flex flex-col bg-black/10 backdrop-blur-2xl border border-white/10 p-2 rounded-md">
        {tokens.map((token) => (
          <MenuItem key={token.id}>
            <button
              type="button"
              onClick={() => onChange(token)}
              className="flex items-center space-x-2 p-2"
            >
              <Image
                src={token.icon}
                width={24}
                height={24}
                alt={token.symbol}
                className="rounded-full"
              />
              <span>{token.symbol}</span>
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
