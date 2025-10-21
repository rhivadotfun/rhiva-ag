import { useMemo, useState } from "react";
import { TabPanel } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { MdContentCopy } from "react-icons/md";

import PositionsTable, {
  type TableColumn,
  TokenPairCell,
  ValueWithPercentageCell,
  ActionCell,
} from "./PortfolioPositionsTable";
import Decimal from "../Decimal";
import { useTRPC, useTRPCClient } from "@/trpc.client";
import { currencyIntlArgs, percentageIntlArgs } from "@/constants/format";

// Mock position data interface - replace with actual TRPC response type
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

// Mock open positions data - replace with actual API data
const mockOpenPositions: Position[] = [
  {
    id: "1",
    pool: {
      tokenA: { symbol: "SOL", icon: "/tokens/sol.png" },
      tokenB: { symbol: "USDC", icon: "/tokens/usdc.png" },
    },
    age: "2d 14h",
    value: 1234.56,
    collectedFee: { amount: 12.34, percentage: 0.089 },
    uncollectedFee: { amount: 5.67, percentage: 0.045 },
    unrealizedPnl: { amount: 89.12, percentage: 0.072 },
  },
  {
    id: "2",
    pool: {
      tokenA: { symbol: "SOL", icon: "/tokens/sol.png" },
      tokenB: { symbol: "USDC", icon: "/tokens/usdc.png" },
    },
    age: "1d 8h",
    value: 2456.78,
    collectedFee: { amount: 23.45, percentage: 0.095 },
    uncollectedFee: { amount: 8.91, percentage: 0.036 },
    unrealizedPnl: { amount: -15.67, percentage: -0.006 },
  },
  {
    id: "3",
    pool: {
      tokenA: { symbol: "SOL", icon: "/tokens/sol.png" },
      tokenB: { symbol: "USDC", icon: "/tokens/usdc.png" },
    },
    age: "5d 2h",
    value: 567.89,
    collectedFee: { amount: 6.78, percentage: 0.119 },
    uncollectedFee: { amount: 2.34, percentage: 0.041 },
    unrealizedPnl: { amount: 34.56, percentage: 0.061 },
  },
  {
    id: "4",
    pool: {
      tokenA: { symbol: "SOL", icon: "/tokens/sol.png" },
      tokenB: { symbol: "USDC", icon: "/tokens/usdc.png" },
    },
    age: "12h",
    value: 890.12,
    collectedFee: { amount: 4.56, percentage: 0.051 },
    uncollectedFee: { amount: 1.23, percentage: 0.014 },
    unrealizedPnl: { amount: 45.67, percentage: 0.051 },
  },
];

// Mock closed positions data
const mockClosedPositions: ClosedPosition[] = [
  {
    id: "5",
    pool: {
      tokenA: { symbol: "SOL", icon: "/tokens/sol.png" },
      tokenB: { symbol: "USDC", icon: "/tokens/usdc.png" },
    },
    age: "3d 5h",
    invested: 1000.0,
    earned: { amount: 45.23, percentage: 0.045 },
    unrealizedPnl: { amount: 125.5, percentage: 0.125 },
    closed: "1 day ago",
  },
  {
    id: "6",
    pool: {
      tokenA: { symbol: "SOL", icon: "/tokens/sol.png" },
      tokenB: { symbol: "USDC", icon: "/tokens/usdc.png" },
    },
    age: "7d 12h",
    invested: 2500.0,
    earned: { amount: 78.9, percentage: 0.032 },
    unrealizedPnl: { amount: -50.25, percentage: -0.02 },
    closed: "3 days ago",
  },
];

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

  // Use mock data for now - replace with actual data when available
  const openPositions = mockOpenPositions;
  const closedPositions = mockClosedPositions;
  const totalPositions = 100; // Mock total
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
