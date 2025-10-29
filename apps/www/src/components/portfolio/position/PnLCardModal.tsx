import clsx from "clsx";
import moment from "moment";
import { format } from "util";
import type React from "react";
import { BsDownload } from "react-icons/bs";
import { LuRefreshCw } from "react-icons/lu";
import { toBlob, toPng } from "html-to-image";
import type { AppRouter } from "@rhiva-ag/trpc";
import { useCallback, useMemo, useRef, useState } from "react";
import { MdClose, MdContentCopy } from "react-icons/md";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

import Image from "@/components/Image";
import Toggle from "@/components/Toggle";
import { currencyIntlArgs, percentageIntlArgs } from "@/constants/format";

type Position = Awaited<
  ReturnType<AppRouter["position"]["list"]>
>["items"][number];

type PositionDetailModalProps = {
  position: Position;
} & React.ComponentProps<typeof Dialog>;

export default function PositionDetailModal({
  position: { pool, pnls, ...position },
  ...props
}: PositionDetailModalProps) {
  const [pnl] = pnls;
  const pnlCardRef = useRef<HTMLDivElement | null>(null);

  const [inverse] = useState(false);
  const [showProfit, setShowProfit] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  const currencyIntl = useMemo(
    () => new Intl.NumberFormat("en-US", currencyIntlArgs),
    [],
  );
  const percentageIntl = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        ...percentageIntlArgs,
        signDisplay: "never",
      }),
    [],
  );
  const currencyWithSignIntl = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        ...currencyIntlArgs,
        signDisplay: "exceptZero",
      }),
    [],
  );

  const name = useMemo(() => {
    if (inverse)
      return [pool.baseToken.symbol, pool.quoteToken.symbol].join(" - ");
    return [pool.quoteToken.symbol, pool.baseToken.symbol].join(" - ");
  }, [pool, inverse]);
  const pnlPercentage = useMemo(
    () => (pnl.pnlUsd / pnl.amountUsd) * 100,
    [pnl.pnlUsd, pnl.amountUsd],
  );

  const isProfit = useMemo(() => pnl.pnlUsd > -1, [pnl]);
  const duration = useMemo(() => {
    if (position.state === "closed")
      return moment.duration(
        moment(position.updatedAt).diff(moment(position.createdAt)),
      );
    return moment.duration(moment().diff(moment(position.createdAt)));
  }, [position.updatedAt, position.createdAt, position.state]);

  const time = useMemo(
    () =>
      format(
        "%s:%s:%s",
        String(Math.floor(duration.asHours())).padStart(2, "0"),
        String(duration.minutes()).padStart(2, "0"),
        String(duration.seconds()).padStart(2, "0"),
      ),
    [duration],
  );

  const exportCard = useCallback(() => {
    const container = pnlCardRef.current;
    if (container)
      toPng(container, {
        style: {
          fontFamily: "Roboto, Inter, sans-serif",
        },
      }).then((dataUrl) => window.open(dataUrl, "_blank"));
  }, []);

  const copyCard = useCallback(async () => {
    const container = pnlCardRef.current;
    if (container) {
      const blob = await toBlob(container, {
        style: {
          fontFamily: "Roboto, Inter, sans-serif",
        },
      });
      if (blob) {
        const item = new ClipboardItem({ [blob.type]: blob });
        return navigator.clipboard.write([item]);
      }
    }
  }, []);

  return (
    <Dialog
      {...props}
      className="relative z-50"
    >
      <div className="fixed inset-0 flex flex-col items-center justify-center">
        <DialogBackdrop className="absolute inset-0 bg-black/75 -z-10" />
        <DialogPanel className="flex flex-col space-y-4 bg-black border border-white/10 p-4 pb-8 rounded-xl lt-sm:w-9/10 sm:max-w-lg">
          <header className="flex justify-between">
            <DialogTitle className="text-base sm:text-lg">
              Share your position performance
            </DialogTitle>
            <button
              type="button"
              onClick={() => props.onClose?.(false)}
            >
              <MdClose />
            </button>
          </header>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between">
              <button
                type="button"
                className="flex items-center space-x-2 border border-white/10 px-4 py-2 rounded"
              >
                <LuRefreshCw size={18} />
                <span>Refresh</span>
              </button>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Toggle
                    value={showProfit}
                    onChange={setShowProfit}
                  />
                  <span>Hide Profit</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Toggle
                    value={showBalance}
                    onChange={setShowBalance}
                  />
                  <span>Hide Balance</span>
                </div>
              </div>
            </div>
            <div
              ref={pnlCardRef}
              className="flex-1 relative h-md"
            >
              <Image
                src={"/bg/pnls/profit/1.jpeg"}
                width={1024}
                height={512}
                alt="Pnl Card"
                className="rounded-md"
              />
              <div className="absolute inset-0 flex flex-col items-end justify-center space-y-2 p-4 text-end">
                <div>
                  <p className="text-gray uppercase">Time</p>
                  <p className="text-xl font-medium">{time}</p>
                </div>
                <div>
                  <p className="text-gray uppercase">Pool</p>
                  <p className="text-xl text-nowrap font-medium">{name}</p>
                </div>
                {showProfit && (
                  <p
                    className={clsx(
                      "text-5xl font-bold",
                      isProfit ? "text-primary" : "text-red-500",
                    )}
                  >
                    {currencyWithSignIntl.format(pnl.pnlUsd)}
                  </p>
                )}
                <div className="flex justify-between space-x-8">
                  {showBalance && (
                    <div>
                      <p className="text-gray upppercase">TVL</p>
                      <p>{currencyIntl.format(position.amountUsd)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray uppercase">PNL</p>
                    <p className={isProfit ? "text-primary" : "text-red-500"}>
                      {percentageIntl.format(pnlPercentage)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="w-36 flex items-center justify-center space-x-2 border border-white/10 px-4 py-2 rounded"
                onClick={copyCard}
              >
                <MdContentCopy size={18} />
                <span>Copy</span>
              </button>
              <button
                type="button"
                className="w-36 flex items-center justify-center space-x-2 bg-primary text-black px-4 py-2 rounded"
                onClick={exportCard}
              >
                <BsDownload size={18} />
                <span>Download</span>
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
