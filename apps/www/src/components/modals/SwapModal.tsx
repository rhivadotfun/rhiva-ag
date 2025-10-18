import clsx from "clsx";
import { useMemo, useState } from "react";
import { AuthStatus } from "@civic/auth";
import { useUser } from "@civic/auth/react";
import { useMutation } from "@tanstack/react-query";
import { MdClose, MdSwapVert } from "react-icons/md";
import { Form, FormikContext, useFormik } from "formik";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

import TokenInput from "../TokenInput";
import { useTRPC } from "@/trpc.client";
import type { Token } from "./SelectTokenModal";
import SelectTokenModal from "./SelectTokenModal";
import { DefaultToken } from "@/constants/tokens";

type SwapModalProps = {
  tokens?: [Token, Token];
} & React.ComponentProps<typeof Dialog>;

export default function SwapModal({ tokens, ...props }: SwapModalProps) {
  const form = useMemo(() => <SwapForm tokens={tokens} />, [tokens]);

  return (
    <>
      <div className="lt-md:hidden">{form}</div>
      <SwapModalSmall
        {...props}
        className="md:hidden"
      >
        {form}
      </SwapModalSmall>
    </>
  );
}

function SwapForm({
  tokens = [DefaultToken.Usdc, DefaultToken.Sol],
  ...props
}: React.ComponentProps<typeof Form> & Pick<SwapModalProps, "tokens">) {
  const trpc = useTRPC();
  const { authStatus } = useUser();
  const isAuthenticated = useMemo(
    () => authStatus === AuthStatus.AUTHENTICATED,
    [authStatus],
  );

  const [showSelectInputTokenModal, setShowSelectInputTokenModal] =
    useState(false);
  const [showSelectOutputTokenModal, setShowSelectOutputTokenModal] =
    useState(false);

  const { mutateAsync } = useMutation(trpc.token.swap.mutationOptions());

  const formikContext = useFormik({
    initialValues: {
      inputToken: tokens?.[0],
      outputToken: tokens?.[1],
      inputAmount: undefined as unknown as number,
      outputAmount: undefined as unknown as number,
    },
    onSubmit(values) {
      mutateAsync({
        slippage: 50,
        amount: values.inputAmount,
        inputMint: values.inputToken.mint,
        outputMint: values.outputToken.mint,
      });
    },
  });

  const { values, setFieldValue } = formikContext;

  return (
    <FormikContext value={formikContext}>
      <Form
        {...props}
        className={clsx("flex flex-col  space-y-8", props.className)}
      >
        <div className="relative flex flex-col justify-center">
          <TokenInput
            label="Sell"
            value={values.inputAmount}
            icon={values.inputToken.icon}
            symbol={values.inputToken.symbol}
            balance={values.inputToken.balance}
            onSwitch={() => setShowSelectInputTokenModal(true)}
            onChange={(value) => setFieldValue("inputAmount", value)}
          />
          <button
            type="button"
            className="z-10 absolute self-center size-8 flex items-center justify-center bg-dark-secondary border border-white/10 rounded-full"
            onClick={() => {
              const inputToken = values.inputToken;
              const outputToken = values.outputToken;
              setFieldValue("outputToken", inputToken);
              setFieldValue("inputToken", outputToken);
            }}
          >
            <MdSwapVert size={16} />
          </button>
          <TokenInput
            label="Buy"
            value={values.outputAmount}
            icon={values.outputToken.icon}
            symbol={values.outputToken.symbol}
            balance={values.outputToken.balance}
            onSwitch={() => setShowSelectOutputTokenModal(true)}
            onChange={(value) => setFieldValue("outputAmount", value)}
            className="mt-4 bg-transparent border-white/20"
          />
        </div>
        <button
          type="submit"
          className={clsx(
            "p-3 rounded-md",
            isAuthenticated
              ? "bg-primary text-black"
              : "border border-white/20 bg-gray/30 text-gray",
          )}
        >
          Swap
        </button>
        <SelectTokenModal
          value={values.inputToken}
          open={showSelectInputTokenModal}
          onClose={setShowSelectInputTokenModal}
          onChange={(value) => setFieldValue("inputToken", value)}
        />
        <SelectTokenModal
          value={values.outputToken}
          open={showSelectOutputTokenModal}
          onClose={setShowSelectOutputTokenModal}
          onChange={(value) => setFieldValue("outputToken", value)}
        />
      </Form>
    </FormikContext>
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
