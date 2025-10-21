import clsx from "clsx";
import { type ReactNode, useState } from "react";
import { HiDotsVertical } from "react-icons/hi";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

import Image from "../Image";
import Decimal from "../Decimal";
import ActionModal, {
  type PositionType,
  type ActionItem,
} from "../modals/ActionModal";

// Column alignment types
export type ColumnAlign = "left" | "center" | "right";

// Column definition
export interface TableColumn<T = any> {
  key: string;
  label: string;
  align?: ColumnAlign;
  sticky?: boolean;
  render: (row: T, openModal?: (row: T) => void) => ReactNode;
}

// Pagination data
export interface PaginationData {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

// Token pair data for consistent rendering
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

// Table props
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
  showPagination = false,
  paginationData,
  positionType = "open",
  customActions,
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
    <div className="flex flex-col space-y-4">
      {/* Container with Header and Table */}
      <div className="border border-white/20 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>

        {/* Table Container with vertical scroll for small screens */}
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {/* Horizontal scroll wrapper - enabled on mobile */}
          <div className="overflow-x-auto">
            {/* Scroll gradient indicator on mobile */}
            <div className="relative">
              {/* Right edge gradient to indicate more content */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-dark to-transparent pointer-events-none lg:hidden z-10" />

              {/* Table with fixed minimum width to enable horizontal scroll */}
              <div className="min-w-[900px]">
                {/* Table Headers */}
                <div
                  className="grid gap-4 px-6 py-3 border-b border-white/10 bg-white/5"
                  style={{
                    gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
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

                {/* Data Rows */}
                <div className="divide-y divide-white/5">
                  {data.map((row) => (
                    <div
                      key={row.id}
                      className="grid gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors duration-150"
                      style={{
                        gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
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

                  {/* Total Row */}
                  {totalRow && (
                    <div className="bg-white/5 border-t border-white/10">
                      <div
                        className="grid gap-4 px-6 py-4 items-center"
                        style={{
                          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
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
      </div>

      {/* Pagination */}
      {showPagination && paginationData && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray">
            Showing{" "}
            {(paginationData.currentPage - 1) * paginationData.itemsPerPage + 1}{" "}
            to{" "}
            {Math.min(
              paginationData.currentPage * paginationData.itemsPerPage,
              paginationData.totalItems,
            )}{" "}
            of {paginationData.totalItems} positions
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() =>
                paginationData.onPageChange(
                  Math.max(1, paginationData.currentPage - 1),
                )
              }
              disabled={paginationData.currentPage === 1}
              className={clsx(
                "p-2 rounded",
                paginationData.currentPage === 1
                  ? "text-gray cursor-not-allowed"
                  : "text-white hover:bg-white/10",
              )}
            >
              <IoChevronBack className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {[1, 2, 3, "...", paginationData.totalPages].map((page) => (
                <button
                  key={typeof page === "number" ? `page-${page}` : "ellipsis"}
                  type="button"
                  onClick={() =>
                    typeof page === "number" &&
                    paginationData.onPageChange(page)
                  }
                  disabled={typeof page !== "number"}
                  className={clsx(
                    "w-8 h-8 rounded text-sm",
                    page === paginationData.currentPage
                      ? "bg-primary text-black font-medium"
                      : typeof page === "number"
                        ? "text-white hover:bg-white/10"
                        : "text-gray cursor-default",
                  )}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                paginationData.onPageChange(
                  Math.min(
                    paginationData.totalPages,
                    paginationData.currentPage + 1,
                  ),
                )
              }
              disabled={
                paginationData.currentPage === paginationData.totalPages
              }
              className={clsx(
                "p-2 rounded",
                paginationData.currentPage === paginationData.totalPages
                  ? "text-gray cursor-not-allowed"
                  : "text-white hover:bg-white/10",
              )}
            >
              <IoChevronForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Action Modal */}
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

// Reusable cell renderers
export const TokenPairCell = ({
  pool,
  showCheckbox = false,
}: {
  pool: TokenPair;
  showCheckbox?: boolean;
}) => (
  <div className="flex items-center space-x-3">
    {/* Overlapping token icons */}
    <div className="relative flex items-center">
      <Image
        src={pool.tokenA.icon}
        width={32}
        height={32}
        alt={pool.tokenA.symbol}
        className="rounded-full border-2 border-dark relative z-20"
      />
      <Image
        src={pool.tokenB.icon}
        width={32}
        height={32}
        alt={pool.tokenB.symbol}
        className="rounded-full border-2 border-dark -ml-3 relative z-10"
      />
    </div>
    <div className="flex items-center space-x-2">
      <span className="text-white font-medium">
        {pool.tokenA.symbol}-{pool.tokenB.symbol}
      </span>
      {showCheckbox && (
        <input
          type="checkbox"
          className="accent-primary w-4 h-4"
        />
      )}
    </div>
  </div>
);

export const ValueWithPercentageCell = ({
  amount,
  percentage,
  suffix,
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
        {suffix && ` ${suffix}`}
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
