import { Dialog, DialogPanel } from "@headlessui/react";

type PositionDetailModalProps = {
  currentPrice: number;
  priceRange: number[];
  currentBalance: {
    quoteToken: number;
    baseToken: number;
  };
  unclaimedFee: {
    quoteToken: number;
    baseToken: number;
  };
  status: "open" | "closed";
} & React.ComponentProps<typeof Dialog>;

export default function PositionDetailModal(props: PositionDetailModalProps) {
  return (
    <Dialog {...props}>
      <div>
        <DialogPanel></DialogPanel>
      </div>
    </Dialog>
  );
}
