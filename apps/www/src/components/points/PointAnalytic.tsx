import clsx from "clsx";

type PointAnalyticProps = {
  totalUsers: number;
  stars: number;
  rank: number;
  xp: number;
  todayXp: number;
} & React.ComponentProps<"div">;
export default function PointAnalytic({
  totalUsers,
  stars,
  rank,
  xp,
  todayXp,
  ...props
}: PointAnalyticProps) {
  return (
    <div
      {...props}
      className={clsx(
        "grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 [&_.card]:flex-1 [&_.card]:flex [&_.card]:flex-col [&_.card]:bg-white/3 [&_.card]:p-4 [&_.card]:border-1 [&_.card]:border-white/10 [&_.card]:rounded-xl",
        props.className,
      )}
    >
      <div className="card space-y-4 ">
        <div className="flex-1">
          <p className="text-gray">Global Rank</p>
          <p className="text-lg">#{rank}</p>
        </div>
        <p className="text-gray">Total users: {totalUsers}</p>
      </div>
      <div className="card">
        <p className="text-gray">Total Stars</p>
        <p>{stars}</p>
      </div>
      <div className="card space-y-4 lt-sm:col-span-2">
        <div className="flex-1 flex flex-col ">
          <p className="text-gray">Total XP</p>
          <p className="text-lg">{xp}</p>
        </div>
        <p className="text-gray">+{todayXp} XP per day</p>
      </div>
    </div>
  );
}
