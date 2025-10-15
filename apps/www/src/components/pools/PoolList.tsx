import { format } from "util";
import { MdContentCopy } from "react-icons/md";
import type { AppRouter } from "@rhiva-ag/trpc";

import Image from "../Image";
import Decimal from "../Decimal";
import { PoolTabSmall } from "./PoolTab";
import IcOrcaIcon from "@/assets/icons/ic_orca";
import IcRaydiumIcon from "@/assets/icons/ic_raydium";
import IcMeteoraIcon from "@/assets/icons/ic_meteora";
import { compactCurrencyIntlArgs, currencyIntlArgs } from "@/constants/format";
import Link from "next/link";
import IcDex from "@/assets/icons/ic_dex";

type PoolListProps = {
  pools: Awaited<ReturnType<AppRouter["pool"]["list"]>>;
};

export default function PoolList({ pools }: PoolListProps) {
  return (
    <>
      <div className="flex flex-wrap gap-4 lt-sm:hidden sm:grid sm:grid-cols-[repeat(auto-fit,minmax(320px,2fr))]">
        {pools.map((pool) => (
          <Link
            key={pool.address}
            href={format("/pools/%s/%s/", pool.dex.id, pool.address)}
            className="flex flex-col space-y-4 bg-dark-secondary p-4  border border-white/10 rounded-xl xl:min-w-72"
          >
            <div className="flex items-center">
              <div className="relative mr-2">
                <Image
                  width={24}
                  height={24}
                  alt={pool.base_token.name}
                  src={pool.base_token.image_url}
                  className="size-8 rounded-full"
                />
                <Image
                  width={24}
                  height={24}
                  alt={pool.base_token.name}
                  src={pool.quote_token.image_url}
                  className="absolute -left-1 top-3 size-5 rounded-full"
                />
              </div>
              <p className="font-semibold mr-2">
                {pool.name.replace(/\s/g, "").replace(/\//g, "-")}
              </p>
              <MdContentCopy className="text-gray mr-1 lt-sm:text-xs" />
              {pool.dex.id === "orca" && (
                <IcOrcaIcon className="size-4 rounded-full" />
              )}
              {pool.dex.id === "raydium-clmm" && (
                <IcRaydiumIcon className="size-4 rounded-full" />
              )}
              {pool.dex.id === "meteora" && (
                <IcMeteoraIcon className="size-4 rounded-full" />
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between">
                <p className="text-gray">TVL</p>
                <Decimal
                  value={pool.reserve_in_usd}
                  intlArgs={currencyIntlArgs}
                />
              </div>
              <div className="flex justify-between">
                <p className="text-gray">FDV</p>
                <Decimal
                  value={pool.fdv_usd ?? 0}
                  intlArgs={currencyIntlArgs}
                />
              </div>
              <div className="flex justify-between">
                <p className="text-gray">MCap</p>
                <Decimal
                  value={pool.market_cap_usd ?? 0}
                  intlArgs={currencyIntlArgs}
                />
              </div>
              <div className="flex justify-between">
                <p className="text-gray">24H VOL</p>
                <Decimal
                  value={pool.volume_usd.h24 ?? 0}
                  intlArgs={currencyIntlArgs}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
      <PoolListSmall pools={pools} />
    </>
  );
}

type PoolListSmallProps = {
  pools: Awaited<ReturnType<AppRouter["pool"]["list"]>>;
};

export function PoolListSmall({ pools }: PoolListSmallProps) {
  return (
    <table className="sm:hidden">
      <thead>
        <tr className="text-xs text-gray">
          <td>#</td>
          <td>
            <PoolTabSmall />
          </td>
          <td>FDV/Mcap</td>
          <td className="text-end text-nowrap">TVL/24H VOL</td>
        </tr>
      </thead>
      <tbody className="h-full divide-y divide-white/10 overflow-y-scroll">
        {pools.map((pool, index) => (
          <tr key={pool.address}>
            <td>{index + 1}</td>
            <td>
              <Link
                key={pool.address}
                href={format("/pools/%s/%s/", pool.dex.id, pool.address)}
                className="flex items-center"
              >
                <div className="relative mr-2">
                  <Image
                    width={24}
                    height={24}
                    alt={pool.base_token.name}
                    src={pool.base_token.image_url}
                    className="size-8 rounded-full"
                  />
                  <Image
                    width={24}
                    height={24}
                    alt={pool.base_token.name}
                    src={pool.quote_token.image_url}
                    className="absolute -left-1 top-3 size-5 rounded-full"
                  />
                </div>
                <p className="font-semibold mr-2">
                  {pool.name.replace(/\s/g, "").replace(/\//g, "-")}
                </p>
                <MdContentCopy className="text-gray mr-1 lt-sm:text-xs" />
                <IcDex
                  dex={
                    pool.dex.id as "orca" | "saros" | "raydium-clmm" | "meteora"
                  }
                  width={16}
                  height={16}
                />
              </Link>
            </td>
            <td>
              <Decimal
                as="p"
                value={pool.fdv_usd ?? 0}
                intlArgs={compactCurrencyIntlArgs}
              />
              <Decimal
                as="p"
                className="text-primary"
                value={pool.market_cap_usd ?? 0}
                intlArgs={compactCurrencyIntlArgs}
              />
            </td>
            <td className="text-end">
              <Decimal
                as="p"
                className="text-primary"
                value={pool.reserve_in_usd ?? 0}
                intlArgs={compactCurrencyIntlArgs}
              />
              <Decimal
                as="p"
                value={pool.volume_usd.h24 ?? 0}
                intlArgs={compactCurrencyIntlArgs}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
