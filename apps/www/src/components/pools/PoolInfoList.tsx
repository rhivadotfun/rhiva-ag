import clsx from "clsx";

export default function PoolInfoList(props: React.ComponentProps<"div">) {
  const intl = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const poolInfos = [
    { title: "TVL", value: 731_456_780 },
    { title: "24H Volume", value: 108_890_234_890 },
    { title: "24H Fees", value: 124_678_909 },
  ];

  return (
    <div
      {...props}
      className={clsx("flex space-x-2", props.className)}
    >
      {poolInfos.map((poolInfo) => (
        <div
          key={poolInfo.title}
          className="flex-1 bg-white/5 px-4 py-3 rounded-md"
        >
          <p className="text-xs text-gray">{poolInfo.title}</p>
          <p>{intl.format(poolInfo.value)}</p>
        </div>
      ))}
    </div>
  );
}
