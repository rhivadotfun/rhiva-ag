import clsx from "clsx";
import { useMemo } from "react";
import { Form, Formik } from "formik";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

import TokenInput from "./TokenInput";
import RatioInput from "./RatioInput";

export default function MeteoraOpenPosition(
  props: React.ComponentProps<typeof Dialog>,
) {
  const form = <MeteoraOpenPositionForm />;

  return (
    <>
      <div className="lt-sm:hidden">{form}</div>
      <MeteoraOpenPositionSmall
        {...props}
        className={clsx("sm:hidden", props.className)}
      >
        {form}
      </MeteoraOpenPositionSmall>
    </>
  );
}

function MeteoraOpenPositionForm(
  props: Omit<
    React.ComponentProps<typeof Formik>,
    "initialValues" | "onSubmit"
  >,
) {
  const curves = useMemo(
    () => [
      { label: "Spot", value: "spot" },
      { label: "Curve", value: "curve" },
      { label: "Bid-Ask", value: "bid-ask" },
    ],
    [],
  );

  return (
    <Formik
      {...props}
      initialValues={{
        amount: undefined,
        curve: "spot",
      }}
      onSubmit={() => {}}
    >
      {({ values }) => (
        <Form className="flex flex-col space-y-8 p-4">
          <div className="flex">
            {curves.map((curve) => {
              const selected = curve.value === values.curve;

              return (
                <button
                  key={curve.value}
                  type="button"
                  className="flex-1 flex items-center justify-center"
                >
                  <div
                    className={clsx(
                      selected
                        ? "border-b-2 border-primary p-2"
                        : "text-white/50",
                    )}
                  >
                    {curve.label}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="amount"
                className="text-light"
              >
                Trade amount
              </label>
              <TokenInput />
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                className="flex-1 bg-primary text-black p-2 rounded"
              >
                SOL
              </button>
              <button
                type="button"
                className="flex-1 border border-primary text-primary rounded"
              >
                USDC
              </button>
            </div>
            <RatioInput />
          </div>
          <button
            type="button"
            className="bg-primary text-black p-2 rounded-md"
          >
            Open Positon
          </button>
        </Form>
      )}
    </Formik>
  );
}

function MeteoraOpenPositionSmall({
  children,
  ...props
}: React.PropsWithChildren<React.ComponentProps<typeof Dialog>>) {
  return (
    <Dialog
      as="div"
      {...props}
      className={clsx("relative z-50", props.className)}
    >
      <div className="fixed inset-0">
        <DialogBackdrop className="absolute inset-0 bg-black/50 -z-10" />
        <DialogPanel className="bg-dark">{children}</DialogPanel>
      </div>
    </Dialog>
  );
}
