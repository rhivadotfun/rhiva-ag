import moment from "moment";
import { format } from "util";
import { MdContentCopy } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { useTRPC } from "@/trpc.client";
import type { PositionData } from "./types";
import { currencyIntlArgs, percentageIntlArgs } from "@/constants/format";
import PositionsTable, {
  type TableColumn,
  TokenPairCell,
  ValueWithPercentageCell,
  ActionCell,
} from "./Table";

export default function ClosedPositionTable() {
  const trpc = useTRPC();
  const itemsPerPage = useRef(5);
  const searchParams = useSearchParams();
  const dex = searchParams.get("dex");
  const [currentPage, setCurrentPage] = useState(0);

  const percentageIntl = useMemo(
    () => new Intl.NumberFormat("en-US", percentageIntlArgs),
    [],
  );

  const { data } = useQuery(
    trpc.position.list.queryOptions({
      offset: currentPage,
      limit: itemsPerPage.current,
      filter: {
        state: { eq: "closed" },
        dex: dex ? { eq: dex } : undefined,
      },
    }),
  );

  const allPositions = useMemo(() => {
    return data ? data.items : [];
  }, [data]);

  const totalPositions = useMemo(() => allPositions.length, [allPositions]);
  const totalPages = useMemo(
    () => Math.ceil(totalPositions / itemsPerPage.current),
    [totalPositions],
  );

  const positionsColumns: TableColumn<PositionData>[] = [
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
      render: (row) => {
        return (
          <span className="text-white">{moment(row.createdAt).fromNow()}</span>
        );
      },
    },
    {
      key: "invested",
      label: "Invested",
      align: "right",
      render: (row) => {
        return (
          <ValueWithPercentageCell
            amount={row.amountUsd}
            intlArgs={currencyIntlArgs}
            percentageIntl={percentageIntl}
          />
        );
      },
    },
    {
      key: "earned",
      label: "Earned",
      align: "right",
      render: (row) => {
        const [pnl] = row.pnls;
        const percentage = pnl.claimedFeeUsd / pnl.pnlUsd;

        return (
          <ValueWithPercentageCell
            amount={pnl.claimedFeeUsd}
            percentage={percentage}
            intlArgs={currencyIntlArgs}
            percentageIntl={percentageIntl}
          />
        );
      },
    },
    {
      key: "Pnl",
      label: "PnL",
      align: "right",
      render: (row) => {
        const [pnl] = row.pnls;
        const percentage = pnl.pnlUsd / pnl.amountUsd;

        return (
          <ValueWithPercentageCell
            amount={pnl.pnlUsd}
            percentage={percentage}
            intlArgs={currencyIntlArgs}
            percentageIntl={percentageIntl}
            colorize
          />
        );
      },
    },
    {
      key: "closed",
      label: "Closed",
      align: "center",
      render: (row) => {
        return (
          <span className="text-gray text-sm">
            {moment(row.updatedAt).fromNow()}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      align: "center",
      render: (row, openModal) => {
        return <ActionCell onClick={() => openModal?.(row)} />;
      },
    },
  ];

  return (
    <PositionsTable
      showPagination
      data={allPositions}
      columns={positionsColumns}
      positionType="closed"
      title={format("Closed positions (%s)", allPositions.length)}
      paginationData={{
        currentPage,
        totalPages,
        setCurrentPage,
        totalItems: allPositions.length,
        itemsPerPage: itemsPerPage.current,
      }}
    />
  );
}
