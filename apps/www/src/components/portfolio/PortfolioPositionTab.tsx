import { useMemo, useState } from "react";
import { TabPanel } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { MdContentCopy } from "react-icons/md";
import type { AppRouter } from "@rhiva-ag/trpc";
import type { inferRouterOutputs } from "@trpc/server";

import PositionsTable, {
  type TableColumn,
  TokenPairCell,
  ValueWithPercentageCell,
  ActionCell,
} from "./PortfolioPositionsTable";
import Decimal from "../Decimal";
import { useTRPC, useTRPCClient } from "@/trpc.client";
import { currencyIntlArgs, percentageIntlArgs } from "@/constants/format";

// Infer types from TRPC router
type RouterOutput = inferRouterOutputs<AppRouter>;
type PositionListOutput = RouterOutput["position"]["list"];
type PositionData = PositionListOutput[number];

// Transform position data for display
interface Position {
  id: string;
  pool: {
    tokenA: {
      symbol: string;
      icon: string;
    };
    tokenB: {
      symbol: string;
      icon: string;
    };
  };
  age: string;
  value: number;
  collectedFee: {
    amount: number;
    percentage: number;
  };
  uncollectedFee: {
    amount: number;
    percentage: number;
  };
  unrealizedPnl: {
    amount: number;
    percentage: number;
  };
}

// Closed position interface
interface ClosedPosition {
  id: string;
  pool: {
    tokenA: {
      symbol: string;
      icon: string;
    };
    tokenB: {
      symbol: string;
      icon: string;
    };
  };
  age: string;
  invested: number;
  earned: {
    amount: number;
    percentage: number;
  };
  unrealizedPnl: {
    amount: number;
    percentage: number;
  };
  closed: string;
}

// Helper function to transform API position data to display format
function transformPositionData(positionData: PositionData): Position {
  const latestPnl = positionData.pnls[0];

  return {
    id: positionData.id,
    pool: {
      tokenA: {
        symbol: positionData.pool.baseToken.symbol || "",
        icon: positionData.pool.baseToken.image || "/tokens/default.png",
      },
      tokenB: {
        symbol: positionData.pool.quoteToken.symbol || "",
        icon: positionData.pool.quoteToken.image || "/tokens/default.png",
      },
    },
    age: formatAge(positionData.createdAt),
    value: latestPnl?.amountUsd ?? positionData.amountUsd ?? 0,
    collectedFee: {
      amount: latestPnl?.claimedFeeUsd ?? 0,
      percentage: calculatePercentage(
        latestPnl?.claimedFeeUsd ?? 0,
        latestPnl?.amountUsd ?? positionData.amountUsd ?? 1,
      ),
    },
    uncollectedFee: {
      amount: latestPnl?.feeUsd ?? 0,
      percentage: calculatePercentage(
        latestPnl?.feeUsd ?? 0,
        latestPnl?.amountUsd ?? positionData.amountUsd ?? 1,
      ),
    },
    unrealizedPnl: {
      amount: latestPnl?.pnlUsd ?? 0,
      percentage: calculatePercentage(
        latestPnl?.pnlUsd ?? 0,
        latestPnl?.amountUsd ?? positionData.amountUsd ?? 1,
      ),
    },
  };
}

// Helper function to calculate percentage
function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return value / total;
}

// Helper function to format age
function formatAge(createdAt: Date | string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h`;
  }
  return `${diffHours}h`;
}

export default function PortfolioPositionTab() {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const [currentPage, setCurrentPage] = useState(1);

  const percentageIntl = useMemo(
    () => new Intl.NumberFormat("en-US", percentageIntlArgs),
    [],
  );

  const { data } = useQuery({
    queryKey: trpc.position.list.queryKey(),
    queryFn: () => trpcClient.position.list.query(),
  });

  // Transform API data for display
  const allPositions = useMemo(() => {
    if (!data) return [];
    return data.map(transformPositionData);
  }, [data]);

  // Separate open and closed positions based on state
  const openPositions = useMemo(() => {
    return allPositions.filter((_, index) => {
      const positionData = data?.[index];
      return (
        positionData?.state === "open" ||
        positionData?.state === "rebalanced" ||
        positionData?.state === "repositioned"
      );
    });
  }, [allPositions, data]);

  const closedPositions = useMemo(() => {
    return allPositions
      .filter((_, index) => {
        const positionData = data?.[index];
        return positionData?.state === "closed";
      })
      .map((position) => {
        // Transform to ClosedPosition format
        const positionData = data?.find((p) => p.id === position.id);
        return {
          id: position.id,
          pool: position.pool,
          age: position.age,
          invested: positionData?.amountUsd ?? 0,
          earned: position.collectedFee,
          unrealizedPnl: position.unrealizedPnl,
          closed: formatAge(
            positionData?.updatedAt ?? positionData?.createdAt ?? new Date(),
          ),
        } as ClosedPosition;
      });
  }, [allPositions, data]);

  const totalPositions = data?.length ?? 0;
  const itemsPerPage = 5;
  const totalPages = Math.ceil(totalPositions / itemsPerPage);

  // Calculate totals for open positions
  const openTotals = useMemo(() => {
    return openPositions.reduce(
      (acc, position) => ({
        value: acc.value + position.value,
        collectedFee: acc.collectedFee + position.collectedFee.amount,
        uncollectedFee: acc.uncollectedFee + position.uncollectedFee.amount,
        unrealizedPnl: acc.unrealizedPnl + position.unrealizedPnl.amount,
      }),
      { value: 0, collectedFee: 0, uncollectedFee: 0, unrealizedPnl: 0 },
    );
  }, [openPositions]);

  // Define columns for open positions
  const openPositionsColumns: TableColumn<Position>[] = [
    {
      key: "pool",
      label: "Position/Pool",
      align: "left",
      sticky: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <TokenPairCell pool={row.pool} />
          <MdContentCopy className="text-gray w-4 h-4" />
        </div>
      ),
    },
    {
      key: "age",
      label: "Age",
      align: "center",
      render: (row) => <span className="text-white">{row.age}</span>,
    },
    {
      key: "value",
      label: "Value",
      align: "right",
      render: (row) => (
        <ValueWithPercentageCell
          amount={row.value}
          intlArgs={currencyIntlArgs}
          percentageIntl={percentageIntl}
        />
      ),
    },
    {
      key: "collectedFee",
      label: "Collected Fee",
      align: "right",
      render: (row) => (
        <ValueWithPercentageCell
          amount={row.collectedFee.amount}
          percentage={row.collectedFee.percentage}
          suffix="SOL"
          intlArgs={currencyIntlArgs}
          percentageIntl={percentageIntl}
        />
      ),
    },
    {
      key: "uncollectedFee",
      label: "Uncollected Fee",
      align: "right",
      render: (row) => (
        <ValueWithPercentageCell
          amount={row.uncollectedFee.amount}
          percentage={row.uncollectedFee.percentage}
          suffix="SOL"
          intlArgs={currencyIntlArgs}
          percentageIntl={percentageIntl}
        />
      ),
    },
    {
      key: "unrealizedPnl",
      label: "uPnL",
      align: "right",
      render: (row) => (
        <ValueWithPercentageCell
          amount={row.unrealizedPnl.amount}
          percentage={row.unrealizedPnl.percentage}
          intlArgs={currencyIntlArgs}
          percentageIntl={percentageIntl}
          colorize
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "center",
      render: (row, openModal) => (
        <ActionCell onClick={() => openModal?.(row)} />
      ),
    },
  ];

  // Define columns for closed positions
  const closedPositionsColumns: TableColumn<ClosedPosition>[] = [
    {
      key: "pool",
      label: "Position/Pool",
      align: "left",
      sticky: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <TokenPairCell pool={row.pool} />
          <MdContentCopy className="text-gray w-4 h-4" />
        </div>
      ),
    },
    {
      key: "age",
      label: "Age",
      align: "center",
      render: (row) => <span className="text-white">{row.age}</span>,
    },
    {
      key: "invested",
      label: "Invested",
      align: "right",
      render: (row) => (
        <ValueWithPercentageCell
          amount={row.invested}
          intlArgs={currencyIntlArgs}
          percentageIntl={percentageIntl}
        />
      ),
    },
    {
      key: "earned",
      label: "Earned",
      align: "right",
      render: (row) => (
        <ValueWithPercentageCell
          amount={row.earned.amount}
          percentage={row.earned.percentage}
          suffix="SOL"
          intlArgs={currencyIntlArgs}
          percentageIntl={percentageIntl}
        />
      ),
    },
    {
      key: "unrealizedPnl",
      label: "uPnL",
      align: "right",
      render: (row) => (
        <ValueWithPercentageCell
          amount={row.unrealizedPnl.amount}
          percentage={row.unrealizedPnl.percentage}
          intlArgs={currencyIntlArgs}
          percentageIntl={percentageIntl}
          colorize
        />
      ),
    },
    {
      key: "closed",
      label: "Closed",
      align: "center",
      render: (row) => <span className="text-gray text-sm">{row.closed}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      align: "center",
      render: (row, openModal) => (
        <ActionCell onClick={() => openModal?.(row)} />
      ),
    },
  ];

  // Define total row for open positions
  const openTotalRow = {
    pool: <span className="text-gray font-medium">TOTAL</span>,
    age: null,
    value: (
      <Decimal
        value={openTotals.value}
        intlArgs={currencyIntlArgs}
        className="text-white font-semibold"
      />
    ),
    collectedFee: (
      <div className="text-white font-semibold">
        <Decimal
          value={openTotals.collectedFee}
          intlArgs={currencyIntlArgs}
        />{" "}
        SOL
      </div>
    ),
    uncollectedFee: (
      <div className="text-white font-semibold">
        <Decimal
          value={openTotals.uncollectedFee}
          intlArgs={currencyIntlArgs}
        />{" "}
        SOL
      </div>
    ),
    unrealizedPnl: (
      <div
        className={`font-semibold ${
          openTotals.unrealizedPnl >= 0 ? "text-green-500" : "text-red-500"
        }`}
      >
        <Decimal
          value={openTotals.unrealizedPnl}
          intlArgs={currencyIntlArgs}
        />
      </div>
    ),
    actions: null,
  };

  return (
    <TabPanel className="flex flex-col space-y-8">
      {/* Open Positions Table */}
      <PositionsTable
        title={`Open positions (${openPositions.length})`}
        columns={openPositionsColumns}
        data={openPositions}
        totalRow={openTotalRow}
        positionType="open"
        showPagination={true}
        paginationData={{
          currentPage,
          totalPages,
          itemsPerPage,
          totalItems: totalPositions,
          onPageChange: setCurrentPage,
        }}
      />

      {/* Closed Positions Table */}
      <PositionsTable
        title={`Closed positions (${closedPositions.length})`}
        columns={closedPositionsColumns}
        data={closedPositions}
        positionType="closed"
        showPagination={true}
        paginationData={{
          currentPage,
          totalPages,
          itemsPerPage,
          totalItems: totalPositions,
          onPageChange: setCurrentPage,
        }}
      />
    </TabPanel>
  );
}
