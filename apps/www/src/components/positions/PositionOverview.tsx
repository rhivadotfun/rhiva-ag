import clsx from "clsx";

type PositionOverviewProps = {} & React.ComponentProps<"div">;
export default function PositionOverview(props: PositionOverviewProps) {
  return (
    <div
      className={clsx(
        "flex flex-col space-y-2 border border-white/10 p-4 rounded-md",
        props.className,
      )}
    >
      <div className="flex justify-between">
        <div className="flex items-center space-x-2 text-light">
          <span>Estimated Yield</span>
          <div className="text-gray bg-primary/10 px-2 rounded">24H</div>
        </div>
        <p>0.028%</p>
      </div>
      <div className="flex justify-between">
        <p>Deposit</p>
        <p>50% SOL/50% USDC</p>
      </div>
    </div>
  );
}
