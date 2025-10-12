import Link from "next/link";
import { format } from "util";
import { useMemo } from "react";
import { IoChevronDown } from "react-icons/io5";
import { useSearchParams } from "next/navigation";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import clsx from "clsx";
import { MdCheck } from "react-icons/md";

type Sort = {
  name: "5m" | "1h" | "6h" | "24h";
  value: "5m_trending" | "1h_trending" | "24h_trending" | null;
};

export default function TokenTimeSort() {
  const searchParams = useSearchParams();
  const sortBy = searchParams.get("sort_by");

  const sorts: Sort[] = useMemo(
    () => [
      { name: "5m", value: "5m_trending" },
      { name: "1h", value: "1h_trending" },
      { name: "6h", value: null },
      { name: "24h", value: "24h_trending" },
    ],
    [],
  );

  return (
    <>
      <div className="flex space-x-2 border border-white/10 divide-x divide-white/10 rounded-md lt-sm:hidden">
        {sorts.map((sort) => {
          const selected = sortBy === sort.value;
          const urlSearchParams = new URLSearchParams();
          if (selected || !sort.value) urlSearchParams.delete("sort_by");
          else if (sort.value) urlSearchParams.set("sort_by", sort.value);

          return (
            <Link
              key={sort.value}
              href={format("?%s", urlSearchParams.toString())}
              className={clsx("px-4 py-2", selected && "bg-primary/10")}
            >
              {sort.name}
            </Link>
          );
        })}
      </div>
      <TokenTimeSortSmall sorts={sorts} />
    </>
  );
}

type TokenTimeSortSmallProps = {
  sorts: Sort[];
};

function TokenTimeSortSmall({ sorts }: TokenTimeSortSmallProps) {
  const searchParams = useSearchParams();
  const sortBy = searchParams.get("sort_by");
  const sortTitle = useMemo(
    () => sorts.find((sort) => sort.value === sortBy)?.name,
    [sortBy, sorts],
  );

  return (
    <Menu
      as="div"
      className="relative sm:hidden"
    >
      <MenuButton className="flex items-center space-x-2 w-16 border border-white/10 text-gray px-2 py-1 rounded focus:outline-none focus:border-primary">
        <span>{sortTitle}</span>
        <IoChevronDown />
      </MenuButton>
      <MenuItems className="mt-2 absolute inset-x-0 flex flex-col bg-dark-secondary border border-white/10 rounded focus:outline-none">
        {sorts.map((sort) => {
          const selected = sortBy === sort.value;
          const urlSearchParams = new URLSearchParams();
          if (selected || !sort.value) urlSearchParams.delete("sort_by");
          else if (sort.value) urlSearchParams.set("sort_by", sort.value);

          return (
            <MenuItem key={sort.value}>
              <Link
                href={format("?%s", urlSearchParams.toString())}
                className={clsx(
                  "flex items-center p-2",
                  selected ? "text-primary" : "text-gray",
                )}
              >
                <span className="flex-1">{sort.name}</span>
                {selected && <MdCheck />}
              </Link>
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
}
