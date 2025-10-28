import clsx from "clsx";
import { useMemo } from "react";
import { MdClose } from "react-icons/md";
import { Field, Form, Formik } from "formik";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

import { dexApi } from "@/instances";
import { useAuth } from "@/hooks/useAuth";
import { getWalletPNL } from "@/lib/get-tokens";
import TokenInput from "../send-token/TokenInput";
import TokenSelect from "../send-token/TokenSelect";

export default function SendTokenModal(
  props: React.ComponentProps<typeof Dialog>,
) {
  return (
    <Dialog
      {...props}
      className={clsx("relative z-50", props.className)}
    >
      <div className="fixed inset-0 flex lt-sm:items-end sm:items-center sm:justify-center">
        <DialogBackdrop className="absolute inset-0 bg-black/50 -z-10" />
        <DialogPanel className="flex flex-col space-y-4 bg-dark p-4 rounded-2xl lt-sm:w-full md:min-w-md">
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
          <SendTokenForm />
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function SendTokenForm(props: React.ComponentProps<typeof Form>) {
  const { connection } = useConnection();
  const { isAuthenticated, user } = useAuth();

  const { data } = useQuery({
    queryKey: ["wallet", "tokens", user.wallet.id],
    queryFn: async () => getWalletPNL(connection, dexApi, user.wallet.id),
  });

  const tokens = useMemo(() => data?.tokens, [data]);

  return (
    tokens && (
      <Formik
        initialValues={{
          amount: "",
          token: tokens[0],
          recipient: "",
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
                  className="border border-white/5 bg-black/10 lt-sm:text-center p-3 placeholder-text-gray rounded"
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
    )
  );
}
