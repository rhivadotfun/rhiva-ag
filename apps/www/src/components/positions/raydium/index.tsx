import clsx from "clsx";
import { useMemo } from "react";
import { number, object } from "yup";
import { PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import { IoArrowBack } from "react-icons/io5";
import type { Pair } from "@rhiva-ag/dex-api";
import { Form, FormikContext, useFormik } from "formik";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

import { useTRPC } from "@/trpc.client";
import DepositInput from "../DepositInput";
import PriceRangeInput from "./PriceRangeInput";
import PositionOverview from "../PositionOverview";
import { getPoolState } from "@/lib/web3/raydium-patch";

type RaydiumOpenPositionProps = {
  pool: Pair;
} & React.ComponentProps<typeof Dialog>;

export default function RaydiumOpenPosition({
  pool,
  ...props
}: RaydiumOpenPositionProps) {
  const form = useMemo(() => <RaydiumOpenPositionForm pool={pool} />, [pool]);

  return (
    <>
      <div className="lt-sm:hidden">{form}</div>
      <RaydiumOpenPositionSmall
        {...props}
        className={clsx("sm:hidden", props.className)}
      >
        {form}
      </RaydiumOpenPositionSmall>
    </>
  );
}

function RaydiumOpenPositionForm({
  pool,
  ...props
}: React.ComponentProps<typeof Form> & Pick<RaydiumOpenPositionProps, "pool">) {
  const trpc = useTRPC();
  const { connection } = useConnection();
  const curves = useMemo(() => [{ label: "Spot", value: "Spot" }], []);

  const { data: poolState } = useQuery({
    queryKey: ["raydium", pool.address],
    queryFn: () => getPoolState(connection, new PublicKey(pool.address)),
  });

  const { mutateAsync } = useMutation(
    trpc.position.raydium.create.mutationOptions(),
  );

  const formikContext = useFormik({
    validateOnMount: true,
    validationSchema: object({
      inputAmount: number().moreThan(0).required(),
    }),
    initialValues: {
      inputAmount: undefined as unknown as number,
      inputMint: NATIVE_MINT.toBase58(),
      strategyType: "Spot" as const,
      priceChanges: [-0.01, 0.01] as [number, number],
      liquidityRatio: [0.5, 0.5] as [number, number],
      sides: [pool.baseToken.id, pool.quoteToken.id],
    },
    onSubmit: (values) => {
      return mutateAsync({
        ...values,
        slippage: 50,
        pair: pool.address,
      });
    },
  });

  const { values, isValid, setFieldValue, isSubmitting } = formikContext;

  return (
    poolState && (
      <FormikContext value={formikContext}>
        <Form
          {...props}
          className={clsx(
            "flex-1 flex flex-col p-4 overflow-y-scroll",
            props.className,
          )}
        >
          <div className="flex">
            {curves.map((curve) => {
              const selected = curve.value === values.strategyType;

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
          <div className="flex-1 flex flex-col space-y-16 py-4 overflow-y-scroll sm:py-8">
            <div className="flex flex-col space-y-4">
              <PriceRangeInput
                pool={pool}
                poolState={poolState}
                value={values.priceChanges}
                sides={[values.sides.length > 0, values.sides.length > 1]}
                amount={values.inputAmount}
                liquidityRatio={
                  values.sides.length > 1 ? values.liquidityRatio : undefined
                }
                onChange={(range) => setFieldValue("priceChanges", range)}
              />
              <PositionOverview
                estimatedYield={pool.apr}
                tokens={[pool.baseToken, pool.quoteToken]}
              />
              <DepositInput
                apr={pool.apr}
                value={values.inputAmount}
                onChange={(value) => setFieldValue("inputAmount", value)}
              />
            </div>
            <button
              type="submit"
              disabled={!isValid}
              className={clsx(
                "flex items-center justify-center rounded-md",
                isValid
                  ? "bg-primary text-black"
                  : "bg-gray/30 border border-white/10 text-gray",
              )}
            >
              {isSubmitting ? (
                <div className="my-2 size-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="my-2">Open Positon</span>
              )}
            </button>
          </div>
        </Form>
      </FormikContext>
    )
  );
}

function RaydiumOpenPositionSmall({
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
