"use client";
import clsx from "clsx";
import Link from "next/link";
import { MdChevronRight } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";

import { dexApi } from "@/instances";
import TokenCard from "../token/TokenCard";

type PeekHotTokenList = {
  initialData?: null;
} & React.ComponentProps<"section">;

export default function PeekHotTokenList({
  initialData,
  ...props
}: PeekHotTokenList) {
  const { data } = useQuery({
    initialData,
    queryKey: ["token", "toptrending"],
    queryFn: () =>
      dexApi.jup.token.list({
        category: "toptrending",
        timestamp: "5m",
        limit: 4,
      }),
  });

  return (
    <section
      {...props}
      className={clsx(
        "flex flex-col space-y-2 bg-dark-secondary p-4 border border-white/6 rounded-xl",
        props.className,
      )}
    >
      <div className="flex items-center">
        <p className="flex-1 text-base text-gray">Hot Tokens 🔥</p>
        <Link
          href="/tokens"
          className="p-2"
        >
          <MdChevronRight
            size={24}
            className="text-gray"
          />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-y-2 md:grid-cols-2 md:gap-4">
        {data?.slice(0, 8).map((data) => (
          <TokenCard
            key={data.id}
            token={data}
          />
        ))}
      </div>
    </section>
  );
}
