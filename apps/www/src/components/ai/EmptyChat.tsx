import { useMemo } from "react";
import { MdManageHistory } from "react-icons/md";
import { FaCcDiscover, FaChartLine } from "react-icons/fa6";

type EmptyChatProps = { onPrompt: (value: string) => void };
export default function EmptyChat({ onPrompt }: EmptyChatProps) {
  const features = useMemo(
    () => [
      {
        icon: FaCcDiscover,
        description:
          "Discover Top Farming Pools: Personalized recommendations based on your interests.",
      },
      {
        icon: MdManageHistory,
        description:
          "Liquidity Management: Track your positions and monitor PnL with detailed insights.",
      },
      {
        icon: FaChartLine,
        description:
          "Position Analysis: Gain in-depth insights into selected position.",
      },
    ],
    [],
  );

  const autoFillOptions = useMemo(
    () => [
      "What is liquidity provision and how does it work",
      "Check my position",
      "What is DLMM?",
      "Suggest a good farming opportunity for me",
      "How do I calculate impermanent loss when providing liquidity?",
      "What's the difference between concentrated and full-range liquidity?",
    ],
    [],
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-16 p-4">
      <div className="flex flex-col space-y-4">
        <p className="text-xl font-bold text-primary-secondary text-center">
          Discover, analyze, and optimize your liquidity positions
        </p>
        <div className="flex flex-col space-y-2">
          {features.map((feature) => (
            <div
              key={feature.description}
              className="flex space-x-2"
            >
              <feature.icon className="text-primary-secondary" />
              <span className="text-white/70  lt-sm:text-xs">
                {feature.description}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-center justify-center">
        {autoFillOptions.map((option) => (
          <button
            key={option}
            type="button"
            className="bg-white/10 text-gray px-4 py-2 rounded-md lt-sm:text-xs"
            onClick={() => onPrompt(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
