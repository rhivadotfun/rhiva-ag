import { useMemo } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import clsx from "clsx";
import { IoChevronDown } from "react-icons/io5";
import { MdCheck } from "react-icons/md";

type RebalanceTimeProps = {
  value: number;
  onChange: (value: number) => void;
} & React.ComponentProps<"div">;

export default function RebalanceTime({
  value,
  onChange,
  ...props
}: RebalanceTimeProps) {
  const rebalanceTimeOptions = useMemo(
    () => [
      { label: "1 Minutes", value: 60 },
      { label: "5 Minutes", value: 300 },
      { label: "10 Minutes", value: 600 },
      { label: "15 Minutes", value: 900 },
      { label: "30 Minutes", value: 1800 },
      { label: "1 Hours", value: 3600 },
      { label: "6 Hours", value: 21600 },
      { label: "24 Hours", value: 86400 },
    ],
    [],
  );

  const rebalanceTime = useMemo(
    () => rebalanceTimeOptions.find((option) => option.value === value)?.label,
    [value, rebalanceTimeOptions],
  );

  return (
    <Menu
      as="div"
      {...props}
      className={clsx("relative flex flex-col z-50", props.className)}
    >
      <MenuButton className="flex items-center  border border-white/10 p-2 rounded focus:outline-none">
        <span className="flex-1 text-start">{rebalanceTime}</span>
        <IoChevronDown />
      </MenuButton>
      <MenuItems className="mt-12 max-h-48 overflow-y-scroll absolute inset-x-0 flex flex-col bg-dark border border-white/10 rounded-md focus:outline-none">
        {rebalanceTimeOptions.map((option) => {
          const selected = option.value === value;

          return (
            <MenuItem key={option.value}>
              <button
                type="button"
                className={clsx(
                  "flex items-center p-2",
                  selected ? "text-primary" : "text-gray",
                )}
                onClick={() => onChange(option.value)}
              >
                <span className="flex-1 text-start">{option.label}</span>
                {selected && <MdCheck />}
              </button>
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
}
