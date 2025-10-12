import clsx from "clsx";
import HorizontalChart from "../HorizontalChart";

export default function HonkIndexChart(props: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={clsx(
        "flex flex-col space-y-8  bg-dark-secondary p-4 border border-white/6 rounded-xl md:p-8",
        props.className,
      )}
    >
      <p className="text-gray">Honk Index</p>
      <div className="flex-1 flex flex-col space-y-4">
        <HorizontalChart
          label="Yield"
          progress={-21.2}
          className="sm:flex-1"
        />
        <HorizontalChart
          label="Active pools"
          progress={-3.8}
          className="sm:flex-1"
        />
        <HorizontalChart
          label="Volume"
          progress={21.8}
          className="sm:flex-1"
        />
      </div>
      <div className="flex items-center space-x-2">
        <div className=" size-3 bg-red-700 rounded-full sm:size-6" />
        <p>Consider Waiting</p>
      </div>
    </div>
  );
}
