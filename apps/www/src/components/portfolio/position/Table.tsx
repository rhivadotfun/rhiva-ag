import clsx from "clsx";
import { format } from "util";
import { type ReactNode, useState } from "react";
import { HiDotsVertical } from "react-icons/hi";

import Image from "../../Image";
import Decimal from "../../Decimal";
import type { PositionData } from "./types";
import CopyButton from "@/components/CopyButton";
import ActionModal, {
  type PositionType,
  type ActionItem,
} from "@/components/modals/ActionModal";
import Pagination from "../Pagination";

export type ColumnAlign = "left" | "center" | "right";

export type TableColumn<T> = {
  key: string;
  label: string;
  align?: ColumnAlign;
  sticky?: boolean;
  render: (row: T, openModal?: (row: T) => void) => ReactNode;
};

export type PaginationData = {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};

export interface TokenPair {
  tokenA: {
    symbol: string;
    icon: string;
  };
  tokenB: {
    symbol: string;
    icon: string;
  };
}

export interface PositionsTableProps<T = any> {
  title: string;
  columns: TableColumn<T>[];
  data: T[];
  totalRow?: Record<string, ReactNode>;
  showPagination?: boolean;
  paginationData?: PaginationData;
  positionType?: PositionType;
  customActions?: (row: T) => ActionItem[];
}

export default function PositionsTable<T extends { id: string }>({
  title,
  columns,
  data,
  totalRow,
  customActions,
  positionType = "open",
  paginationData,
}: PositionsTableProps<T>) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    positionData: T | null;
  }>({
    isOpen: false,
    positionData: null,
  });

  const openModal = (row: T) => {
    setModalState({
      isOpen: true,
      positionData: row,
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      positionData: null,
    });
  };

  const getAlignClass = (align?: ColumnAlign) => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 ">
      <div className="flex-1 border border-white/20 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          <div className="overflow-x-auto">
            <div className="relative">
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-dark to-transparent pointer-events-none lg:hidden z-10" />
              <div className="min-w-[900px]">
                <div
                  className="grid gap-4 px-6 py-3 border-b border-white/10 bg-white/5"
                  style={{
                    gridTemplateColumns: format(
                      "repeat(%s, minmax(0, 1fr))",
                      columns.length,
                    ),
                  }}
                >
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className={clsx(
                        "text-gray text-sm font-medium uppercase",
                        getAlignClass(column.align),
                        column.sticky && "left-0 z-20",
                      )}
                    >
                      {column.label}
                    </div>
                  ))}
                </div>
                <div className="divide-y divide-white/5">
                  {data.map((row) => (
                    <div
                      key={row.id}
                      className="grid gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors duration-150"
                      style={{
                        gridTemplateColumns: format(
                          "repeat(%s, minmax(0, 1fr))",
                          columns.length,
                        ),
                      }}
                    >
                      {columns.map((column) => (
                        <div
                          key={column.key}
                          className={clsx(
                            getAlignClass(column.align),
                            column.sticky && "left-0 bg-inherit z-10",
                          )}
                        >
                          {column.render(row, openModal)}
                        </div>
                      ))}
                    </div>
                  ))}

                  {totalRow && (
                    <div className="bg-white/5 border-t border-white/10">
                      <div
                        className="grid gap-4 px-6 py-4 items-center"
                        style={{
                          gridTemplateColumns: format(
                            "repeat(%s, minmax(0, 1fr))",
                            columns.length,
                          ),
                        }}
                      >
                        {columns.map((column) => (
                          <div
                            key={column.key}
                            className={clsx(
                              getAlignClass(column.align),
                              column.sticky && "left-0 z-10",
                            )}
                          >
                            {totalRow[column.key]}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {paginationData && <Pagination {...paginationData} />}
      </div>
      <ActionModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        positionType={positionType}
        positionData={modalState.positionData}
        actions={
          modalState.positionData && customActions
            ? customActions(modalState.positionData)
            : undefined
        }
      />
    </div>
  );
}

export const TokenPairCell = ({ pool }: { pool: PositionData["pool"] }) => (
  <div className="flex items-center space-x-3">
    <div className="relative flex items-center">
      <Image
        src={pool.baseToken.image}
        width={32}
        height={32}
        alt={pool.baseToken.symbol}
        className="rounded-full border-2 border-dark relative z-20"
      />
      <Image
        src={pool.quoteToken.image}
        width={32}
        height={32}
        alt={pool.quoteToken.symbol}
        className="rounded-full border-2 border-dark -ml-3 relative z-10"
      />
    </div>
    <div className="flex items-center space-x-2">
      <span className="text-white font-medium">
        {pool.baseToken.symbol}-{pool.quoteToken.symbol}
      </span>
      <CopyButton content={pool.id} />
    </div>
  </div>
);

export const ValueWithPercentageCell = ({
  amount,
  percentage,
  intlArgs,
  percentageIntl,
  colorize = false,
}: {
  amount: number;
  percentage?: number;
  suffix?: string;
  intlArgs?: Intl.NumberFormatOptions;
  percentageIntl?: Intl.NumberFormat;
  colorize?: boolean;
}) => {
  const isPositive = amount >= 0;
  const colorClass = colorize
    ? isPositive
      ? "text-green-500"
      : "text-red-500"
    : "text-white";

  return (
    <div>
      <div className={colorClass}>
        <Decimal
          value={amount}
          intlArgs={intlArgs}
        />
      </div>
      {percentage !== undefined && percentageIntl && (
        <div
          className={clsx("text-sm", colorize ? colorClass : "text-primary")}
        >
          {percentageIntl.format(percentage)}
        </div>
      )}
    </div>
  );
};

export const ActionCell = ({ onClick }: { onClick?: () => void }) => (
  <div className="flex justify-center">
    <button
      type="button"
      onClick={onClick}
      className="text-gray hover:text-white transition-colors"
      aria-label="Open actions menu"
    >
      <HiDotsVertical className="w-5 h-5" />
    </button>
  </div>
);
