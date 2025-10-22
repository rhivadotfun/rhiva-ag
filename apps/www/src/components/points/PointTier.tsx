import clsx from "clsx";
import Image from "next/image";
import type { Tier } from "@/hooks/useTiers";

export default function PointTier({
  tiers,
  currentTier,
  ...props
}: React.ComponentProps<"div"> & { tiers: Tier[]; currentTier: Tier }) {
  return (
    <div
      className={clsx(
        "flex flex-col space-y-4 bg-white/3 p-4 rounded-xl sm:p-6",
        props.className,
      )}
    >
      <div>
        <p className="text-base font-medium sm:text-lg">Tier Roadmap</p>
        <p className="text-xs text-gray sm:text-base">
          Progress through the ranks and unlock exclusive badges
        </p>
      </div>
      <div className="grid grid-cols-5 gap-4 sm:gap-6">
        {tiers.map((tier) => {
          const selected = tier.name === currentTier.name;

          return (
            <div
              key={tier.name}
              className="flex justify-center"
            >
              <Image
                src={tier.icon}
                width={256}
                height={256}
                alt={tier.name}
                className={clsx(
                  "w-20 h-auto sm:w-28 md:w-32 lg:w-50",
                  !selected && "grayscale blur-sm opacity-50",
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
