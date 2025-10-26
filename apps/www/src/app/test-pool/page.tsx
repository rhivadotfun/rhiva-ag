"use client";

import type { z } from "zod";
import type { agentOutputSchema } from "@rhiva-ag/mcp";
import PoolPositionCard from "@/components/ai/PoolPositionCard";

// Infer types from agentOutputSchema
type AgentOutput = z.infer<typeof agentOutputSchema>;
type PoolData = NonNullable<AgentOutput["pools"]>[number];

export default function TestPoolPage() {
  // Mock data matching the design screenshot and agentOutputSchema
  const mockPool: PoolData = {
    name: "SOL-USDC",
    address: "mock_pool_address_123",
    pool_created_at: new Date().toISOString(),
    reserve_in_usd: "5000000",
    base_token_price_usd: "145.50",
    quote_token_price_usd: "1.00",
    base_token_price_base_token: "1.0",
    quote_token_price_base_token: "0.0069",
    base_token_price_native_currency: "145.50",
    quote_token_price_native_currency: "1.00",
    dex: {
      id: "raydium-clmm",
      name: "Raydium",
    },
    volume_usd: {
      h24: "150000",
      h6: "45000",
      h1: "8000",
      m5: "1200",
      m15: "3500",
      m30: "5000",
    },
    price_change_percentage: {
      h24: "2.5",
      h6: "1.2",
      h1: "0.5",
      m5: "0.1",
      m15: "0.3",
      m30: "0.4",
    },
    transactions: {
      h24: {
        buys: 1250,
        sells: 980,
        buyers: 450,
        sellers: 320,
      },
      h1: {
        buys: 120,
        sells: 95,
        buyers: 50,
        sellers: 40,
      },
      h6: {
        buys: 600,
        sells: 480,
        buyers: 200,
        sellers: 160,
      },
      m5: {
        buys: 15,
        sells: 12,
        buyers: 8,
        sellers: 6,
      },
      m15: {
        buys: 45,
        sells: 35,
        buyers: 20,
        sellers: 15,
      },
      m30: {
        buys: 80,
        sells: 65,
        buyers: 35,
        sellers: 28,
      },
    },
    analysis: {
      confidence: 0.5867,
      suggestedDeposit: 4052.83,
      suggestedRange: [95, 105],
      strategy: "spot",
    },
  };

  const mockPool2: PoolData = {
    name: "BONK-SOL",
    address: "mock_pool_address_456",
    pool_created_at: new Date().toISOString(),
    reserve_in_usd: "100000",
    base_token_price_usd: "0.00002",
    quote_token_price_usd: "145.50",
    base_token_price_base_token: "1.0",
    quote_token_price_base_token: "7275000",
    base_token_price_native_currency: "0.00002",
    quote_token_price_native_currency: "145.50",
    dex: {
      id: "orca",
      name: "Orca",
    },
    volume_usd: {
      h24: "300000",
      h6: "90000",
      h1: "15000",
      m5: "2500",
      m15: "7500",
      m30: "12000",
    },
    price_change_percentage: {
      h24: "15.3",
      h6: "8.2",
      h1: "2.5",
      m5: "0.5",
      m15: "1.2",
      m30: "1.8",
    },
    transactions: {
      h24: {
        buys: 2500,
        sells: 1800,
        buyers: 850,
        sellers: 620,
      },
      h1: {
        buys: 250,
        sells: 180,
        buyers: 90,
        sellers: 70,
      },
      h6: {
        buys: 1200,
        sells: 900,
        buyers: 400,
        sellers: 320,
      },
      m5: {
        buys: 30,
        sells: 22,
        buyers: 15,
        sellers: 12,
      },
      m15: {
        buys: 90,
        sells: 68,
        buyers: 40,
        sellers: 30,
      },
      m30: {
        buys: 160,
        sells: 120,
        buyers: 70,
        sellers: 55,
      },
    },
    analysis: {
      confidence: 0.72,
      suggestedDeposit: 2500,
      suggestedRange: [90, 110],
      strategy: "curve",
    },
  };

  const mockPool3: PoolData = {
    name: "USDT-USDC",
    address: "mock_pool_address_789",
    pool_created_at: new Date().toISOString(),
    reserve_in_usd: "10000000",
    base_token_price_usd: "1.00",
    quote_token_price_usd: "1.00",
    base_token_price_base_token: "1.0",
    quote_token_price_base_token: "1.0",
    base_token_price_native_currency: "1.00",
    quote_token_price_native_currency: "1.00",
    dex: {
      id: "meteora",
      name: "Meteora",
    },
    volume_usd: {
      h24: "50000",
      h6: "15000",
      h1: "2500",
      m5: "400",
      m15: "1200",
      m30: "2000",
    },
    price_change_percentage: {
      h24: "0.01",
      h6: "0.005",
      h1: "0.002",
      m5: "0.001",
      m15: "0.001",
      m30: "0.002",
    },
    transactions: {
      h24: {
        buys: 500,
        sells: 480,
        buyers: 180,
        sellers: 170,
      },
      h1: {
        buys: 50,
        sells: 48,
        buyers: 20,
        sellers: 19,
      },
      h6: {
        buys: 250,
        sells: 240,
        buyers: 90,
        sellers: 85,
      },
      m5: {
        buys: 8,
        sells: 7,
        buyers: 5,
        sellers: 4,
      },
      m15: {
        buys: 20,
        sells: 19,
        buyers: 12,
        sellers: 11,
      },
      m30: {
        buys: 35,
        sells: 33,
        buyers: 18,
        sellers: 17,
      },
    },
    analysis: {
      confidence: 0.35,
      suggestedDeposit: 1000,
      suggestedRange: [99, 101],
      strategy: "full",
    },
  };

  return (
    <div className="min-h-screen bg-white/10 backdrop-blur-2xl p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-2">
          Pool Position Card Test
        </h1>
        <p className="text-zinc-400 mb-8">
          Preview of the liquidity pool position card component using
          agentOutputSchema
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* SOL-USDC Pool */}
          <PoolPositionCard
            pool={mockPool}
            onOpenPosition={(pool) => {
              console.log("Opening position for:", pool);
              alert(`Opening position for ${pool.name}`);
            }}
          />

          {/* BONK-SOL Pool - High APR */}
          <PoolPositionCard
            pool={mockPool2}
            onOpenPosition={(pool) => {
              console.log("Opening position for:", pool);
              alert(`Opening position for ${pool.name}`);
            }}
          />

          {/* USDT-USDC Pool - Stablecoin pair */}
          <PoolPositionCard
            pool={mockPool3}
            onOpenPosition={(pool) => {
              console.log("Opening position for:", pool);
              alert(`Opening position for ${pool.name}`);
            }}
          />
        </div>

        {/* Raw data display */}
        <div className="mt-12 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h2 className="text-white text-xl font-semibold mb-4">
            Mock Data Structure (agentOutputSchema)
          </h2>
          <pre className="text-zinc-300 text-xs overflow-auto">
            {JSON.stringify(mockPool, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
