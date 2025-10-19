import clsx from "clsx";
import { format } from "util";
import Image from "next/image";
import { useMemo } from "react";

import type { Tier } from "@/hooks/useTiers";

type PointOverviewProps = {
  xp: number;
  nextTier?: Tier;
  currentTier: Tier;
} & React.ComponentProps<"div">;

export default function PointOverview({
  xp,
  nextTier,
  currentTier,
  ...props
}: PointOverviewProps) {
  const percentage = useMemo(
    () => (xp / currentTier.xpRange[1]) * 100,
    [xp, currentTier],
  );

  return (
    <div
      {...props}
      className={clsx(
        "flex space-x-4 bg-white/3 backdrop-blur-3xl border border-white/10 px-2 py-4 rounded-xl",
        props.className,
      )}
    >
      <Image
        src={currentTier.icon}
        width={128}
        height={128}
        alt={currentTier.name}
      />
      <div className="flex-1 flex flex-col">
        {nextTier && (
          <div className="self-end flex space-x-2">
            <span className="text-gray">Next Tier:</span>
            <span className="uppercase">{nextTier.name}</span>
          </div>
        )}
        <div className="flex-1 flex flex-col justify-center space-y-2">
          <div className="flex space-x-1">
            <span>{xp}</span>
            <span className="text-gray">of</span>
            <span>{currentTier.xpRange[1]} XP</span>
          </div>
          <div className=" flex bg-white/3 max-w-xl overflow-hidden rounded-full">
            <div
              className="p-1 bg-primary rounded-full"
              style={{ width: format("%s%%", percentage) }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
