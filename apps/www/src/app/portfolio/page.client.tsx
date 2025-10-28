"use client";
import clsx from "clsx";
import { Fragment, useMemo } from "react";
import { Tab, TabGroup, TabList, TabPanels } from "@headlessui/react";

import Header from "@/components/layout/Header";
import PortfolioInfo from "@/components/portfolio/PorfolioInfo";
import PortfolioPositionTab from "@/components/portfolio/position";
import PorfolioTokenTab from "@/components/portfolio/PorfolioTokenTab";
import { PortfolioHistory } from "@/components/portfolio/PorfolioHistory";

export default function PortfolioClientPage() {
  const Tabs = useMemo(
    () => ({
      Tokens: PorfolioTokenTab,
      Positions: PortfolioPositionTab,
    }),
    [],
  );

  return (
    <div className="flex-1 flex flex-col backdrop-blur-2xl md:px-8 space-y-4 overflow-y-scroll">
      <Header
        title="portfolio"
        className="sticky top-0 z-10"
      />
      <div className="flex-1 flex flex-col space-y-4 px-4 overflow-y-scroll">
        <div className="flex flex-col sm:space-y-4 lt-sm:space-y-4 md:p-10 md:border md:border-white/20 md:rounded xl:grid xl:grid-cols-5 xl:space-x-16 xl:gap-4">
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
          <TabPanels className="flex-1 flex flex-col">
            <PorfolioTokenTab />
            <PortfolioPositionTab />
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
}
