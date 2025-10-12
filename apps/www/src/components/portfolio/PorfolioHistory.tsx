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

import { getCalender } from "@/lib/calender";

export function PortfolioHistory(props: React.ComponentProps<"div">) {
  const calender = <PortfolioCalender />;
  return (
    <>
      <div className={clsx("lt-sm:hidden", props.className)}>
        <h1>Profit History</h1>
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
    setCalender(getCalender());
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
        <div className="grid grid-cols-7 gap-x-2 gap-y-4">
          {Object.entries(calender.calender).map(([weekday, dates]) => {
            return (
              <div
                key={weekday}
                className="flex flex-col space-y-2"
              >
                <div className="capitalize text-gray text-center">
                  {weekday}
                </div>
                <div className="flex flex-col space-y-2">
                  {dates.map((moment) => {
                    const date = moment.date();
                    return (
                      <div
                        key={date}
                        className="flex items-center justify-center aspect-square border border-primary/20 rounded bg-primary/5 text-center"
                      >
                        <p className="text-gray">{date}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
