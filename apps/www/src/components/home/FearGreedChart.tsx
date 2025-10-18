import clsx from "clsx";
import { Doughnut } from "react-chartjs-2";

export default function FearGreedChart(props: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={clsx("relative rounded-xl", props.className)}
    >
      <div className="flex flex-col justify-center bg-dark-secondary p-4 border border-white/6 rounded-xl md:p-8">
        <p className="text-gray">Fear & Greed</p>
        <div className="flex-1 flex items-center justify-center max-w-9/10 overflow-hidden">
          <Doughnut
            data={{
              datasets: [
                {
                  data: [50, 50, 50, 50, 50],
                  borderWidth: 0,
                  borderRadius: 100,
                  backgroundColor(ctx) {
                    const COLORS = [
                      "#A90808",
                      "#A90808",
                      "#FFED68",
                      "#18E36C",
                      "#18E36C",
                    ];
                    if (ctx.type === "data") return COLORS[ctx.dataIndex];
                    return;
                  },
                },
              ],
            }}
            options={{
              cutout: "88%",
              spacing: 24,
              rotation: -90,
              responsive: true,
              circumference: 180,
              borderColor: "none",
              plugins: {
                tooltip: { enabled: false },
                legend: { display: false },
                annotation: {
                  annotations: {
                    annotation: {
                      type: "doughnutLabel" as "label",
                      content: ["53", "Neutral"],
                      drawTime: "beforeDraw",
                      color: ["white", "white"],
                      font: [{ size: 18 }],
                      position: {
                        y: "-50%",
                      },
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
        <p>Coming Soon</p>
      </div>
    </div>
  );
}
