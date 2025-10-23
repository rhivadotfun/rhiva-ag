"use client";
import clsx from "clsx";
import { Fragment, useMemo } from "react";
import { Tab, TabGroup, TabList, TabPanels } from "@headlessui/react";

import Header from "@/components/layout/Header";
import PortfolioInfo from "@/components/portfolio/PorfolioInfo";
import PorfolioTokenTab from "@/components/portfolio/PorfolioTokenTab";
import { PortfolioHistory } from "@/components/portfolio/PorfolioHistory";
import PortfolioPositionTab from "@/components/portfolio/PortfolioPositionTab";

type PortfolioClientPageProps = {
  initialData?: {
    pnlOverview?: unknown;
    pnlCalender?: unknown;
    tokenOverview?: unknown;
  };
};

export default function PortfolioClientPage(_props: PortfolioClientPageProps) {
  const Tabs = useMemo(
    () => ({
      Tokens: PorfolioTokenTab,
      Positions: PortfolioPositionTab,
    }),
    [],
  );

  return (
    <div className="flex-1 flex flex-col backdrop-blur-2xl md:p-10 space-y-4 overflow-y-scroll">
      <Header
        title="portfolio"
        className="sticky top-0 z-10"
      />
      <div className="flex-1 flex flex-col space-y-4 px-4 overflow-y-scroll">
        <div className="flex xl:grid xl:grid-cols-5 xl:gap-4 sm:space-x-16 lt-sm:flex-col lt-sm:space-y-4 md:p-10 md:border border-white/20 rounded">
          <PortfolioInfo className="xl:col-span-2" />
          <PortfolioHistory className="xl:col-span-3 md:p-4 md:border border-white/20 rounded" />
        </div>
        <TabGroup className="flex-1 flex flex-col space-y-4">
          <TabList className="flex space-x-4 sm:self-start">
            {Object.keys(Tabs).map((tab) => (
              <Tab
                key={tab}
                as={Fragment}
              >
                {({ selected }) => (
                  <button
                    type="button"
                    className={clsx(
                      "flex-1 p-2 rounded focus:outline-none sm:min-w-48",
                      selected
                        ? "bg-primary text-black border-none"
                        : "border border-white/10",
                    )}
                  >
                    {tab}
                  </button>
                )}
              </Tab>
            ))}
          </TabList>
          <TabPanels>
            <PorfolioTokenTab />
            <PortfolioPositionTab />
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
}
