import { format } from "util";

export const truncateString = (value: string, length: number = 4) =>
  format("%s...%s", value.slice(0, length), value.slice(-length));

export function generateLiquidityDistribution(
  totalAmount: number,
  binStep: number,
  curveType: "Curve" | "BidAsk" | "Spot",
): number[] {
  const liquidityDistribution: number[] = [];

  switch (curveType) {
    case "Spot": {
      const equalAmount = totalAmount / binStep;
      for (let index = 0; index < binStep; index++)
        liquidityDistribution.push(equalAmount);
      break;
    }

    case "Curve": {
      const weights: number[] = [];
      const exponent = 2.5;
      const baseOffset = 0.1;
      for (let index = 0; index < binStep; index++) {
        const ratio = index / (binStep - 1);
        weights.push(
          baseOffset + (1 - baseOffset) * Math.sin(Math.PI * ratio) ** exponent,
        );
      }
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const scale = totalAmount / totalWeight;
      for (let index = 0; index < binStep; index++)
        liquidityDistribution.push(weights[index] * scale);
      break;
    }

    case "BidAsk": {
      const weights: number[] = [];
      const exponent = 1;
      const middleBoost = 0.1;
      for (let index = 0; index < binStep; index++) {
        const ratio = index / (binStep - 1);
        const edgeWeight = (1 - Math.sin(Math.PI * ratio)) ** exponent;
        const middleWeight = Math.sin(Math.PI * ratio) ** 2;
        weights.push(
          edgeWeight * (1 - middleBoost) + middleWeight * middleBoost,
        );
      }
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const scale = totalAmount / totalWeight;
      for (let index = 0; index < binStep; index++)
        liquidityDistribution.push(weights[index] * scale);
      break;
    }
  }

  return liquidityDistribution;
}

const supportedDexes = ["orca", "saros-dlmm", "raydium-clmm", "meteora"];
export const isSupportedDex = (
  value: string,
): value is "orca" | "saros-dlmm" | "raydium-clmm" | "meteora" =>
  supportedDexes.includes(value);
