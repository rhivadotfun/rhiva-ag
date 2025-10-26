import clsx from "clsx";
import Link from "next/link";
import { format } from "util";
import { useSearchParams } from "next/navigation";

import IcDex from "@/assets/icons/ic_dex";
import { useDexes } from "@/hooks/useDexes";

export default function DexSwitchTab() {
  const dexes = useDexes();
  const searchParams = useSearchParams();
  const dexId = searchParams.get("dex");

  return (
    <div className="flex items-center space-x-2">
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
  );
}
