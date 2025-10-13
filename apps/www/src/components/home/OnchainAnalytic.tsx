"use client";
import clsx from "clsx";
import { Chart, ArcElement } from "chart.js";
import Annotation from "chartjs-plugin-annotation";

import FearGreedChart from "./FearGreedChart";
import HonkIndexChart from "./HonkIndexChart";

Chart.register(ArcElement, Annotation);

export default function OnchainAnalytic(
  props: React.ComponentProps<"section">,
) {
  return (
    <section
      {...props}
      className={clsx(
        "flex lt-sm:flex-col lt-sm:space-y-4 sm:space-x-4 ",
        props.className,
      )}
    >
      <FearGreedChart className="flex-1 lt-sm:h-48" />
      <HonkIndexChart className="flex-1 lt-sm:h-48" />
    </section>
  );
}
