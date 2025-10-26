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
  const percentage = useMemo(() => {
    const [min, max] = currentTier.xpRange;
    const raw = ((xp - min) / (max - min)) * 100;
    return Math.min(100, Math.max(0, raw));
  }, [xp, currentTier]);

  return (
    <div
      {...props}
      className={clsx(
        "flex space-x-4 bg-white/3 backdrop-blur-3xl border border-white/10 px-2 py-4 lg:px-4 lg:py-6 rounded-xl",
        props.className,
      )}
    >
      <Image
        src={currentTier.icon}
        width={300}
        height={300}
        alt={currentTier.name}
        className="ml-5"
      />
      <div className="flex-1 flex flex-col px-12">
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
              className="p-2 bg-primary rounded-full"
              style={{ width: format("%s%%", percentage) }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
