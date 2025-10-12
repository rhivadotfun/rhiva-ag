import clsx from "clsx";
import { useMemo } from "react";
import { AuthStatus } from "@civic/auth";
import { MdClose } from "react-icons/md";
import { useUser } from "@civic/auth/react";
import { Field, Form, Formik } from "formik";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

import { useAppSelector } from "@/store";
import TokenInput from "../send-token/TokenInput";
import TokenSelect from "../send-token/TokenSelect";
import { walletTokenSelectors } from "@/store/wallet";

export default function SendTokenModal(
  props: React.ComponentProps<typeof Dialog>,
) {
  return (
    <>
      <SendTokenForm className="lt-md:hidden" />
      <SendTokenModalSmall
        {...props}
        className="md:hidden"
      >
        <SendTokenForm />
      </SendTokenModalSmall>
    </>
  );
}

function SendTokenForm(props: React.ComponentProps<typeof Form>) {
  const { authStatus } = useUser();
  const { walletToken } = useAppSelector((state) => state.wallet);
  const tokens = walletTokenSelectors.selectAll(walletToken);

  const isAuthenticated = useMemo(
    () => authStatus === AuthStatus.AUTHENTICATED,
    [authStatus],
  );

  return (
    <Formik
      initialValues={{
        amount: undefined,
        token: tokens[0],
      }}
      onSubmit={() => {}}
    >
      {({ values, setFieldValue }) => (
        <Form
          {...props}
          className={clsx("flex flex-col space-y-8", props.className)}
        >
          <div className="relative flex flex-col justify-center space-y-4">
            <TokenInput
              value={values.amount}
              amount={values.token.balance}
              priceUsd={values.token.usdPrice}
              symbol={values.token.symbol}
              onChange={(value) => setFieldValue("amount", value)}
            />
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="token"
                className="text-gray"
              >
                Token
              </label>
              <TokenSelect
                value={values.token}
                tokens={tokens}
                onChange={(value) => setFieldValue("token", value)}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="recipient">Recipient</label>
              <Field
                name="recipient"
                placeholder="Paste address"
                className="border border-white/5 bg-black/10 text-center p-2 placeholder-text-gray rounded"
              />
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="text-xs text-center">
              <span className="text-lime-300">Caution: </span>
              <span className="text-gray">
                Please confirm address before you click "send"
              </span>
            </div>
            <button
              type="submit"
              className={clsx(
                "p-2 rounded-md",
                !isAuthenticated
                  ? "bg-primary text-black"
                  : "bg-gray/30 text-gray border border-white/10",
              )}
            >
              Send
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

function SendTokenModalSmall({
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
        <DialogPanel className="flex flex-col space-y-4 bg-dark p-4 rounded-2xl lt-sm:w-full">
          <header className="flex items-center justify-between py-4">
            <DialogTitle className="text-lg  font-semibold sm:text-xl">
              Send
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
