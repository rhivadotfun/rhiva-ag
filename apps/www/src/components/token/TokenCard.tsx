import clsx from "clsx";
import Link from "next/link";
import { format } from "util";
import { MdContentCopy } from "react-icons/md";
import type { DexApi } from "@rhiva-ag/dex-api";

import Image from "../Image";
import Decimal from "../Decimal";
import { compactCurrencyIntlArgs } from "@/constants/format";

type TokenCardProps = {
  token: Awaited<ReturnType<DexApi["jup"]["token"]["list"]>>[number];
};

export default function TokenCard({ token }: TokenCardProps) {
  return (
    <Link
      key={token.id}
      href={format("/tokens/%s/", token.id)}
      className="flex  space-x-2 items-center  bg-dark border border-white/10 p-4 rounded-md 2xl:min-w-xs"
    >
      <Image
        width={64}
        height={64}
        unoptimized
        src={token.icon}
        alt={token.symbol}
        className="size-12 rounded-md"
        errorProps={{
          className: "size-12 bg-gray/50 rounded-md",
        }}
      />
      <div className="flex-1 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-base md:text-lg">{token.name}</span>
            <button type="button">
              <MdContentCopy
                size={18}
                className="text-gray"
              />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span>Risk</span>
            <div
              className={clsx(
                "size-2 rounded-full",
                token.isVerified ? "bg-primary" : "bg-red-500",
              )}
            />
          </div>
        </div>
        <div className="flex justify-between space-x-2">
          <p className="shrink-0">
            <span className="text-gray">Mcap: </span>
            <Decimal
              value={token.mcap}
              intlArgs={compactCurrencyIntlArgs}
            />
          </p>
          <p className="shrink-0">
            <span className="ml-auto">24h Vol: </span>
            <Decimal
              value={
                token.stats24h.buyOrganicVolume +
                token.stats24h.sellOrganicVolume
              }
              intlArgs={compactCurrencyIntlArgs}
            />
          </p>
        </div>
      </div>
    </Link>
  );
}
