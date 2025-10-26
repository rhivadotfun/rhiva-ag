import { TabPanel } from "@headlessui/react";

import DexSwitchTab from "./DexSwitchTab";
import OpenPositionTable from "./OpenPositionTable";
import ClosedPositionTable from "./ClosedPositionTable";

export default function PortfolioPositionTab() {
  return (
    <TabPanel className="flex-1 flex flex-col space-y-4">
      <DexSwitchTab />
      <div className="flex-1 flex flex-col space-y-2">
        <OpenPositionTable />
        <ClosedPositionTable />
      </div>
    </TabPanel>
  );
}
