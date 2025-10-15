import clsx from "clsx";
import { useMemo } from "react";
import { Form, Formik } from "formik";
import { AuthStatus } from "@civic/auth";
import { useUser } from "@civic/auth/react";
import { MdClose, MdSwapVert } from "react-icons/md";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

import TokenInput from "../TokenInput";

export default function SwapModal(props: React.ComponentProps<typeof Dialog>) {
  return (
    <>
      <SwapForm className="lt-md:hidden" />
      <SwapModalSmall
        {...props}
        className="md:hidden"
      >
        <SwapForm />
      </SwapModalSmall>
    </>
  );
}

function SwapForm(props: React.ComponentProps<typeof Form>) {
  const { authStatus } = useUser();
  const isAuthenticated = useMemo(
    () => authStatus === AuthStatus.AUTHENTICATED,
    [authStatus],
  );

  return (
    <Formik
      initialValues={{}}
      onSubmit={() => {}}
    >
      <Form
        {...props}
        className={clsx("flex flex-col  space-y-8", props.className)}
      >
        <div className="relative flex flex-col justify-center">
          <TokenInput
            label="Sell"
            name="sell"
          />
          <div className="z-10 absolute self-center size-8 flex items-center justify-center bg-dark-secondary border border-white/10 rounded-full">
            <MdSwapVert size={16} />
          </div>
          <TokenInput
            label="Buy"
            name="buy"
            className="mt-4 bg-transparent border-white/20"
          />
        </div>
        <button
          type="submit"
          className={clsx(
            " p-3 rounded-md",
            isAuthenticated
              ? "bg-primary text-black"
              : "border border-white/20 bg-gray/30 text-gray",
          )}
        >
          Swap
        </button>
      </Form>
    </Formik>
  );
}

function SwapModalSmall({
  children,
  ...props
}: React.PropsWithChildren<React.ComponentProps<typeof Dialog>>) {
  return (
    <Dialog
      {...props}
      className={clsx("relative z-50", props.className)}
    >
      <div className="fixed inset-0 flex lt-sm:items-end sm:items-center sm:justify-center">
        <DialogBackdrop className="lt-md:absolute lt-md:inset-0 lt-md:bg-black/50 lt-md:-z-10" />
        <DialogPanel className="flex flex-col space-y-4 bg-dark-secondary p-4 rounded-xl lt-md:min-w-9/10">
          <header className="flex items-center justify-between py-4">
            <DialogTitle className="text-lg font-bold sm:text-xl">
              Swap
            </DialogTitle>
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
