import clsx from "clsx";
import Image from "next/image";
import { useTiers, type Tier } from "@/hooks/useTiers";

export default function PointTier({
  tiers,
  currentTier,
  ...props
}: React.ComponentProps<"div"> & { tiers: Tier[]; currentTier: Tier }) {
  return (
    <div
      className={clsx(
        "flex flex-col space-y-4 bg-white/3 p-4 rounded-xl",
        props.className,
      )}
    >
      <div>
        <p className="text-base font-medium sm:text-lg">Tier Roadmap</p>
        <p className="text-xs text-gray sm:text-base">
          Progress through the ranks and unlock exclusive badges
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        {tiers.map((tier) => {
          const selected = tier.name === currentTier.name;

          return (
            <div key={tier.name}>
              <Image
                src={tier.icon}
                width={128}
                height={128}
                alt={tier.name}
                className={clsx(
                  "w-16 h-14 sm:w-24 sm:h-20",
                  !selected && "grayscale blur-sm",
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
