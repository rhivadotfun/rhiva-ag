"use client";
import { Tab, TabGroup, TabList, TabPanels } from "@headlessui/react";

import Header from "@/components/layout/Header";
import PortfolioInfo from "@/components/portfolio/PorfolioInfo";
import { PortfolioHistory } from "@/components/portfolio/PorfolioHistory";
import PorfolioTokenTab from "@/components/portfolio/PorfolioTokenTab";
import PortfolioPositionTab from "@/components/portfolio/PortfolioPositionTab";
import { Fragment } from "react";
import clsx from "clsx";

export default function PortfolioPage() {
  const Tabs = {
    Tokens: PorfolioTokenTab,
    Positions: PortfolioPositionTab,
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 overflow-y-scroll">
      <Header
        title="portfolio"
        className="sticky top-0 z-10"
      />
      <div className="flex-1 flex flex-col space-y-4 px-4 overflow-y-scroll">
        <div className="flex sm:space-x-16 lt-sm:flex-col lt-sm:space-y-4">
          <PortfolioInfo />
          <PortfolioHistory />
        </div>
        <TabGroup className="flex-1 flex flex-col space-y-4">
          <TabList className="flex space-x-4">
            {Object.keys(Tabs).map((tab) => (
              <Tab
                key={tab}
                as={Fragment}
              >
                {({ selected }) => (
                  <button
                    type="button"
                    className={clsx(
                      "flex-1 p-2 rounded focus:outline-none",
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
