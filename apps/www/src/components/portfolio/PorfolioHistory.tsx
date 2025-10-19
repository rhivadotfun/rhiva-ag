import clsx from "clsx";
import { useEffect, useState } from "react";
import {
  IoChevronBackOutline,
  IoChevronDownOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";

import { getCalender, type DailyPnL } from "@/lib/calender";

export function PortfolioHistory(props: React.ComponentProps<"div">) {
  const calender = <PortfolioCalender />;
  return (
    <>
      <div className={clsx("lt-sm:hidden", props.className)}>
        <h1 className="text-gray">Profit History</h1>
        {calender}
      </div>
      <PortfolioHistorySmall className={clsx("sm:hidden", props.className)}>
        {calender}
      </PortfolioHistorySmall>
    </>
  );
}

function PortfolioCalender(props: React.ComponentProps<"div">) {
  const [calender, setCalender] = useState<ReturnType<typeof getCalender>>();

  useEffect(() => {
    // Mock P&L data for demonstration - replace with actual API call
    const mockPnLData: DailyPnL[] = [
      { date: "2025-10-01", pnl: 41.16 },
      { date: "2025-10-03", pnl: -4.16 },
      { date: "2025-10-15", pnl: 125.5 },
      { date: "2025-10-20", pnl: -41.16 },
      { date: "2025-10-25", pnl: 87.25 },
    ];

    setCalender(getCalender(undefined, mockPnLData));
  }, []);

  if (calender) {
    const [peek] = calender.dates;

    return (
      <div
        {...props}
        className={clsx("flex flex-col space-y-4", props.className)}
      >
        <div className="self-end flex items-center space-x-2">
          <IoChevronBackOutline />
          <span className="uppercase font-medium">
            {peek.format("MMM YYYY")}
          </span>
          <IoChevronForwardOutline />
        </div>
        <div className="grid grid-cols-7 gap-x-2 gap-y-2">
          {/* Weekday headers */}
          {calender.weekdays.map((weekday) => (
            <div
              key={weekday}
              className="capitalize text-gray text-center p-2"
            >
              {weekday}
            </div>
          ))}

          {/* Calendar grid */}
          {calender.calendarGrid.map((week) =>
            week.map((cell) => (
              <div
                key={`${week}`}
                className={clsx(
                  "flex flex-col items-center justify-center md:aspect-square/2 text-center p-2",
                  cell && "border border-primary/20 rounded bg-primary/5",
                )}
              >
                {cell && (
                  <>
                    <p className="text-gray font-medium text-sm">
                      {cell.moment.date()}
                    </p>
                    {cell.pnl !== undefined && (
                      <p
                        className={clsx(
                          "text-xs font-semibold",
                          cell.pnl >= 0 ? "text-green-500" : "text-red-500",
                        )}
                      >
                        {cell.pnl >= 0 ? "+" : ""}${cell.pnl.toFixed(2)}
                      </p>
                    )}
                  </>
                )}
              </div>
            )),
          )}
        </div>

        {/* Monthly Total */}
        <div className="flex mt-4 p-3">
          <p className="text-gray text-sm font-medium">
            TOTAL MONTHLY PROFIT:{" "}
            <span
              className={clsx(
                "font-bold",
                calender.monthlyTotal >= 0 ? "text-green-500" : "text-red-500",
              )}
            >
              {calender.monthlyTotal >= 0 ? "+" : ""}$
              {calender.monthlyTotal.toFixed(2)}
            </span>
          </p>
        </div>
      </div>
    );
  }
}

function PortfolioHistorySmall({
  children,
  ...props
}: React.PropsWithChildren & React.ComponentProps<typeof Disclosure>) {
  return (
    <Disclosure
      as="div"
      {...props}
      className={clsx(
        "flex flex-col space-y-8 border border-white/10 px-4 py-2 rounded-md",
        props.className,
      )}
    >
      <DisclosureButton className="group flex justify-between items-center">
        <span className="text-base text-gray">Profit History</span>
        <IoChevronDownOutline
          size={18}
          className="text-gray group-data-open:rotate-180"
        />
      </DisclosureButton>
      <DisclosurePanel>{children}</DisclosurePanel>
    </Disclosure>
  );
}
