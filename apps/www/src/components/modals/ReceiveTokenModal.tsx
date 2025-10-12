import clsx from "clsx";
import { QRCodeSVG } from "qrcode.react";
import { MdClose } from "react-icons/md";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

import { useAuth } from "@/hooks/useAuth";

export default function ReceiveTokenModal(
  props: React.ComponentProps<typeof Dialog>,
) {
  return (
    <>
      <ReceiveTokenForm className="lt-md:hidden" />
      <ReceiveTokenModalSmall
        {...props}
        className="md:hidden"
      >
        <ReceiveTokenForm />
      </ReceiveTokenModalSmall>
    </>
  );
}

function ReceiveTokenForm(props: React.ComponentProps<"div">) {
  const { user } = useAuth();

  return (
    user && (
      <div
        {...props}
        className={clsx("flex flex-col  space-y-8", props.className)}
      >
        <div className="relative flex flex-col justify-center">
          <QRCodeSVG
            value={user.wallet.id}
            className="w-full h-full border border-white/10 p-4 rounded-xl"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <p className="text-xs text-gray">
            Only send Solana Network tokens (SPL) to this address
          </p>
          <button
            type="submit"
            className="bg-primary text-black p-3 rounded-md"
          >
            Copy address
          </button>
        </div>
      </div>
    )
  );
}

function ReceiveTokenModalSmall({
  children,
  ...props
}: React.PropsWithChildren<React.ComponentProps<typeof Dialog>>) {
  return (
    <Dialog
      {...props}
      className={clsx("relative z-50", props.className)}
    >
      <div className="fixed inset-0 flex items-center justify-center">
        <DialogBackdrop className="lt-md:absolute lt-md:inset-0 lt-md:bg-black/50 lt-md:-z-10" />
        <DialogPanel className="bg-dark-secondary p-4 rounded-xl lt-md:min-w-9/10">
          <header className="flex items-center justify-between py-4">
            <DialogTitle className="text-xl font-bold">Receive</DialogTitle>
            <button
              type="button"
              onClick={() => props.onClose?.(false)}
            >
              <MdClose size={18} />
            </button>
          </header>
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
