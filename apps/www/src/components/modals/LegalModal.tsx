import clsx from "clsx";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

type LegalModalProps = React.ComponentProps<typeof Dialog>;

export default function LegalModal(props: LegalModalProps) {
  return (
    <Dialog
      {...props}
      className={clsx(props.className, "relative z-50")}
    >
      <div>
        <DialogBackdrop className="fixed inset-0 bg-black/50 backdrop-blur" />
        <DialogPanel></DialogPanel>
      </div>
    </Dialog>
  );
}
