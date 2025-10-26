"use client";

import { useMemo } from "react";
import type { z } from "zod";
import type { agentOutputSchema } from "@rhiva-ag/mcp";
import { IoStatsChart } from "react-icons/io5";
import { GiTwoCoins } from "react-icons/gi";

// Infer types from agentOutputSchema
type AgentOutput = z.infer<typeof agentOutputSchema>;
type PoolData = AgentOutput["pools"][number];

interface PoolPositionCardProps {
  pool: PoolData;
  onOpenPosition?: (pool: PoolData) => void;
}

export default function PoolPositionCard({
  pool,
  onOpenPosition,
}: PoolPositionCardProps) {
  // Calculate metrics from pool data
  const metrics = useMemo(() => {
    const suggestedDeposit = pool.analysis?.suggestedDeposit ?? 0;
    const confidence = pool.analysis?.confidence ?? 0;
    const strategy = pool.analysis?.strategy ?? "spot";
    const suggestedRange = pool.analysis?.suggestedRange ?? [0, 0];

    // Calculate range percentage
    const rangePercentage =
      suggestedRange[1] > 0
        ? (((suggestedRange[1] - suggestedRange[0]) / suggestedRange[0]) *
            100) /
          2
        : 5;

    // Mock APR calculation (would come from backend analysis in production)
    // For now using a placeholder based on volume/liquidity ratio
    const volume24h = parseFloat(pool.volume_usd?.h24 ?? "0");
    const liquidity = parseFloat(pool.reserve_in_usd ?? "0");
    const mockAPR =
      liquidity > 0 ? ((volume24h / liquidity) * 365 * 100).toFixed(2) : "0";

    // Mock daily earnings calculation
    const mockDailyEarn = (suggestedDeposit * parseFloat(mockAPR)) / 365 / 100;
    const mockDailyEarnPercentage =
      suggestedDeposit > 0
        ? ((mockDailyEarn / suggestedDeposit) * 100).toFixed(2)
        : "0";

    // Mock fee percentage (would come from pool data in production)
    const mockFee = "0.4";

    return {
      apr: mockAPR,
      fee: mockFee,
      confidence: (confidence * 100).toFixed(2),
      suggestedDeposit: suggestedDeposit.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
      suggestedRange: `±${rangePercentage.toFixed(0)}%`,
      strategy:
        strategy.charAt(0).toUpperCase() + strategy.slice(1).toLowerCase(),
      estimatedEarnPerDay: mockDailyEarn.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
      estimatedEarnPercentage: mockDailyEarnPercentage,
    };
  }, [pool]);

  // Extract pool name and tokens
  const poolName = pool.name ?? "Unknown Pool";
  const tokens = poolName.split("-");

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-6 shadow-lg max-w-md">
      {/* Header Section - Single Row */}
      <div className="flex items-center justify-between mb-6">
        {/* LEFT: Pool Identity */}
        <div className="flex items-center gap-2">
          {/* Overlapping token icons */}
          <div className="relative flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold z-10">
              {tokens[0]?.[0] ?? "?"}
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold -ml-3">
              {tokens[1]?.[0] ?? "?"}
            </div>
          </div>
          <h3 className="text-white font-semibold text-lg">{poolName}</h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex px-3 py-1.5 bg-orange-500/10 border border-transparent rounded items-center gap-1.5">
            <span className="text-orange-400 text-sm font-medium">
              Fee: {metrics.fee}%
            </span>
          </div>

          <div className="flex px-3 py-1.5 items-center gap-1.5 border border-white/10 rounded">
            <span className="text-zinc-300 text-sm font-medium">Risk</span>
            <IoStatsChart className="text-zinc-300 text-base" />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* APR */}
        <div className="space-y-1">
          <p className="text-zinc-500 text-xs uppercase tracking-wide">APR</p>
          <p className="text-green-400 text-xl font-bold">{metrics.apr}%</p>
        </div>

        {/* Suggested Range */}
        <div className="space-y-1">
          <p className="text-zinc-500 text-xs uppercase tracking-wide">
            Suggested Range
          </p>
          <p className="text-white text-xl font-semibold">
            {metrics.suggestedRange}
          </p>
        </div>

        {/* Confidence */}
        <div className="space-y-1">
          <p className="text-zinc-500 text-xs uppercase tracking-wide">
            Confidence
          </p>
          <p className="text-white text-xl font-semibold">
            {metrics.confidence}%
          </p>
        </div>

        {/* Strategy */}
        <div className="space-y-1">
          <p className="text-zinc-500 text-xs uppercase tracking-wide">
            Strategy
          </p>
          <p className="text-white text-xl font-semibold">{metrics.strategy}</p>
        </div>

        {/* Suggested Deposit */}
        <div className="space-y-1">
          <p className="text-zinc-500 text-xs uppercase tracking-wide">
            Suggested Deposit
          </p>
          <p className="text-white text-xl font-semibold">
            {metrics.suggestedDeposit}
          </p>
        </div>

        {/* Estimated Earn Per Day */}
        <div className="space-y-1">
          <p className="text-zinc-500 text-xs uppercase tracking-wide">
            Est. Earn / Day
          </p>
          <p className="text-white text-xl font-semibold">
            {metrics.estimatedEarnPerDay}
          </p>
          <p className="text-zinc-400 text-xs">
            {metrics.estimatedEarnPercentage}%
          </p>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={() => onOpenPosition?.(pool)}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        Open Position
      </button>
    </div>
  );
}
