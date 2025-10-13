import clsx from "clsx";
import { useMemo } from "react";
import { Form, Formik } from "formik";
import { IoArrowBack } from "react-icons/io5";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import DepositInput from "../DepositInput";
import PositionOverview from "../PositionOverview";
import PriceRangeInput from "../PriceRangeInput";

export default function OrcaOpenPosition(
  props: React.ComponentProps<typeof Dialog>,
) {
  const form = <OrcaOpenPositionForm />;

  return (
    <>
      <div className="lt-sm:hidden">{form}</div>
      <OrcaOpenPositionSmall
        {...props}
        className={clsx("sm:hidden", props.className)}
      >
        {form}
      </OrcaOpenPositionSmall>
    </>
  );
}

function OrcaOpenPositionForm(
  props: Omit<
    React.ComponentProps<typeof Formik>,
    "initialValues" | "onSubmit"
  >,
) {
  const curves = useMemo(
    () => [
      { label: "Full", value: "full" },
      { label: "Custom", value: "custom" },
    ],
    [],
  );

  return (
    <Formik
      {...props}
      initialValues={{
        amount: undefined,
        curve: "full",
        range: [0.01, 0.01],
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
                  className={clsx(
                    "flex-1 flex items-center justify-center",
                    selected
                      ? "border-b-2 border-primary p-2"
                      : "text-white/50",
                  )}
                  onClick={() => setFieldValue("curve", curve.value)}
                >
                  {curve.label}
                </button>
              );
            })}
          </div>
          <div className="flex-1 flex flex-col space-y-16 py-4 overflow-y-scroll sm:py-8">
            <div className="flex flex-col space-y-4">
              {values.curve === "custom" && (
                <PriceRangeInput
                  showInput={false}
                  value={values.range}
                  onChange={(range) => setFieldValue("range", range)}
                />
              )}
              <PositionOverview />
              <DepositInput />
            </div>
            <button
              type="button"
              className="bg-primary text-black p-2 rounded-md"
            >
              Open Positon
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

function OrcaOpenPositionSmall({
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
