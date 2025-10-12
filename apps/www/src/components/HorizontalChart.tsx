import clsx from "clsx";
import { useMemo } from "react";
import { format } from "util";

type HorizontalChartProps = {
  label?: string;
  progress: number;
} & React.ComponentProps<"div">;

export default function HorizontalChart({
  label,
  progress,
  ...props
}: HorizontalChartProps) {
  const barProgress = useMemo(
    () => (progress > 0 ? 50 + progress / 2 : Math.abs(progress / 2)),
    [progress],
  );

  return (
    <div
      {...props}
      className={clsx(
        "flex lt-sm:relative lt-sm:flex-col lt-sm:space-y-8 sm:space-x-4 sm:items-center",
        props.className,
      )}
    >
      {label && <p>{label}</p>}
      <div className="flex items-center justify-center sm:relative  sm:flex-1">
        <div
          className="flex-1 h-2 bg-red-500"
          style={{ borderEndStartRadius: 8, borderStartStartRadius: 8 }}
        />
        <div
          className="flex-1 h-2 bg-green-500"
          style={{ borderEndEndRadius: 8, borderStartEndRadius: 8 }}
        />

        <div
          className="absolute lt-sm:top-[60%]"
          style={{
            left: format("%s%", barProgress),
            transform: "translateX(-50%)",
          }}
        >
          <div className="relative flex space-y-2">
            <div className="absolute bg-white text-xs text-black rounded -mt-4 px-1 py-0.5">
              {progress}%
            </div>
            <div className="w-1 h-6 bg-white rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
