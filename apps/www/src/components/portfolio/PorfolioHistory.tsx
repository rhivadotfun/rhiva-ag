import clsx from "clsx";
import { useEffect, useState } from "react";
import {
  IoChevronBackOutline,
  IoChevronDownOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import Decimal from "../Decimal";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";

import { currencyIntlArgs } from "@/constants/format";
import { getCalender, type DailyPnL } from "@/lib/calender";

interface PortfolioHistoryProps extends React.ComponentProps<"div"> {
  dailyPnLData?: DailyPnL[];
}

export function PortfolioHistory({
  dailyPnLData,
  ...props
}: PortfolioHistoryProps) {
  const calender = <PortfolioCalender dailyPnLData={dailyPnLData} />;
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

interface PortfolioCalenderProps extends React.ComponentProps<"div"> {
  dailyPnLData?: DailyPnL[];
}

function PortfolioCalender({ dailyPnLData, ...props }: PortfolioCalenderProps) {
  const [calender, setCalender] = useState<ReturnType<typeof getCalender>>();

  useEffect(() => {
    setCalender(getCalender(undefined, dailyPnLData));
  }, [dailyPnLData]);

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
          {calender.weekdays.map((weekday) => (
            <div
              key={weekday}
              className="capitalize text-gray text-center p-2"
            >
              {weekday}
            </div>
          ))}
          {calender.calendarGrid.map((week) =>
            week.map((cell) => (
              <div
                key={cell?.key}
                className={clsx(
                  "flex flex-col items-center justify-center md:aspect-square/4 text-center p-2",
                  cell && "border border-primary/20 rounded bg-primary/5",
                )}
              >
                {cell && (
                  <>
                    <p className="text-gray font-medium text-sm">
                      {cell.moment.date()}
                    </p>
                    <p
                      className={clsx(
                        "text-2/5 lg:text-xs font-semibold",
                        cell.pnl !== undefined
                          ? cell.pnl >= 0
                            ? "text-green-500"
                            : "text-red-500"
                          : "text-white",
                      )}
                    >
                      {cell.pnl !== undefined ? (
                        <>
                          {cell.pnl >= 0 ? "+" : ""}
                          <Decimal
                            value={cell.pnl}
                            intlArgs={currencyIntlArgs}
                          />
                        </>
                      ) : (
                        <Decimal
                          value={0}
                          intlArgs={currencyIntlArgs}
                        />
                      )}
                    </p>
                  </>
                )}
              </div>
            )),
          )}
        </div>

        <div className="flex mt-4 p-3">
          <p className="text-gray text-sm font-medium">
            TOTAL MONTHLY PROFIT: &nbsp;
            <span
              className={clsx(
                "font-bold",
                calender.monthlyTotal >= 0 ? "text-green-500" : "text-red-500",
              )}
            >
              <Decimal
                value={calender.monthlyTotal}
                intlArgs={{ ...currencyIntlArgs, signDisplay: "exceptZero" }}
              />
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
