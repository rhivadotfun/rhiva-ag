import clsx from "clsx";
import { useMemo } from "react";
import { Form, Formik } from "formik";
import { IoArrowBack } from "react-icons/io5";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

import TokenInput from "./TokenInput";
import RatioInput from "./RatioInput";
import PriceRangeInput from "../PriceRangeInput";

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
        range: [0.01, 0.01],
        ratio: [0.5, 0.5],
      }}
      onSubmit={() => {}}
    >
      {({ values, setFieldValue }) => (
        <Form className="flex-1 flex flex-col p-4 overflow-y-scroll">
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
          <div className="flex-1 flex flex-col py-4 overflow-y-scroll sm:py-8">
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
              <RatioInput
                value={values.ratio}
                onChange={(ratio) => setFieldValue("ratio", ratio)}
              />
              <PriceRangeInput
                value={values.range}
                onChange={(range) => setFieldValue("range", range)}
              />
            </div>
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
        <DialogPanel className="h-full flex flex-col bg-dark overflow-y-scroll">
          <header className="p-4 lt-sm:border-b lt-sm:border-transparent lt-sm:[border-image:linear-gradient(to_right,#000,theme(colors.primary),#000)_1]">
            <button
              type="button"
              className="flex items-center space-x-2"
              onClick={() => props?.onClose(false)}
            >
              <IoArrowBack />
              <span>Back</span>
            </button>
          </header>
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
