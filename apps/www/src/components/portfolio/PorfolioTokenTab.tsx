import clsx from "clsx";
import { useMemo, useState } from "react";
import { TabPanel } from "@headlessui/react";

import Decimal from "../Decimal";
import SwapModal from "../modals/SwapModal";
import PortfolioTokenList from "./PortfolioTokenList";
import SendTokenModal from "../modals/SendTokenModal";
import ReceiveTokenModal from "../modals/ReceiveTokenModal";
import { currencyIntlArgs, percentageIntlArgs } from "@/constants/format";
import { useAppSelector } from "@/store";
import { walletTokenSelectors } from "@/store/wallet";

export default function PorfolioTokenTab() {
  const { pnl, walletToken } = useAppSelector((state) => state.wallet);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const percentageIntl = useMemo(
    () => new Intl.NumberFormat("en-US", percentageIntlArgs),
    [],
  );

  const tokens = walletTokenSelectors.selectAll(walletToken);

  return (
    <>
      <TabPanel className="flex flex-col space-y-4">
        <div className="sm:flex sm:justify-between">
          {pnl && (
            <div>
              <p className="uppercase text-gray">Total Value</p>
              <div className="flex items-center space-x-2">
                <Decimal
                  value={pnl.balance}
                  intlArgs={currencyIntlArgs}
                  className="text-xl font-semibold"
                />
                <span
                  className={clsx(
                    pnl.balanceChange < 0 ? "text-red-500" : "text-primary",
                  )}
                >
                  {percentageIntl.format(pnl.balanceChange)}
                </span>
              </div>
            </div>
          )}
          <div className="flex items-center space-x-4 [&_button]:flex-1 [&_button]:min-w-32 [&_button]:bg-white/3 [&_button]:py-2 [&_button]:border [&_button]:border-white/10 [&_button]:rounded">
            <button
              type="button"
              onClick={() => setShowSendModal(true)}
            >
              Send
            </button>
            <button
              type="button"
              onClick={() => setShowReceiveModal(true)}
            >
              Receive
            </button>
            <button
              type="button"
              className="!bg-primary border-none text-black"
              onClick={() => setShowSwapModal(true)}
            >
              Swap
            </button>
          </div>
        </div>
        <PortfolioTokenList tokens={tokens} />
      </TabPanel>
      {showSwapModal && (
        <SwapModal
          open={showSwapModal}
          onClose={setShowSwapModal}
        />
      )}
      {showReceiveModal && (
        <ReceiveTokenModal
          open={showReceiveModal}
          onClose={setShowReceiveModal}
        />
      )}
      {showSendModal && (
        <SendTokenModal
          open={showSendModal}
          onClose={setShowSendModal}
        />
      )}
    </>
  );
}
