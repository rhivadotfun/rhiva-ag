import clsx from "clsx";
import { useMemo } from "react";
import { number, object } from "yup";
import { IoArrowBack } from "react-icons/io5";
import { NATIVE_MINT } from "@solana/spl-token";
import { fetchWhirlpool } from "@orca-so/whirlpools-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Form, type Formik, FormikContext, useFormik } from "formik";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

import { useTRPC } from "@/trpc.client";
import type { getPair } from "@/lib/dex-api";
import DepositInput from "../DepositInput";
import PriceRangeInput from "./PriceRangeInput";
import PositionOverview from "../PositionOverview";
import { address, createSolanaRpc } from "@solana/kit";
import { useConnection } from "@solana/wallet-adapter-react";

type OrcaOpenPositionProps = {
  pool: Awaited<ReturnType<typeof getPair>>;
} & React.ComponentProps<typeof Dialog>;

export default function OrcaOpenPosition({
  pool,
  ...props
}: OrcaOpenPositionProps) {
  const form = useMemo(() => <OrcaOpenPositionForm pool={pool} />, [pool]);

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

function OrcaOpenPositionForm({
  pool,
  ...props
}: Omit<React.ComponentProps<typeof Formik>, "initialValues" | "onSubmit"> &
  Pick<OrcaOpenPositionProps, "pool">) {
  const trpc = useTRPC();
  const { connection } = useConnection();
  const curves = useMemo(
    () => [
      { label: "Full", value: "full" },
      { label: "Custom", value: "custom" },
    ],
    [],
  );
  const rpc = useMemo(
    () => createSolanaRpc(connection.rpcEndpoint),
    [connection],
  );

  const { data: whirlpool } = useQuery({
    queryKey: ["whirlpool", pool.address],
    queryFn: () => fetchWhirlpool(rpc, address(pool.address)),
  });

  const { mutateAsync } = useMutation(
    trpc.position.orca.create.mutationOptions(),
  );

  const formikContext = useFormik({
    validateOnMount: true,
    validationSchema: object({
      inputAmount: number().moreThan(0).required(),
    }),
    initialValues: {
      inputAmount: undefined as unknown as number,
      inputMint: NATIVE_MINT.toBase58(),
      strategyType: "full" as "custom" | "full",
      priceChanges: [1, 1] as [number, number],
      liquidityRatio: [0.5, 0.5] as [number, number],
      sides: [pool.baseToken.id, pool.quoteToken.id],
    },
    onSubmit: (values) => {
      return mutateAsync({
        ...values,
        slippage: 50,
        pair: pool.address,
        tokenADecimals: pool.baseToken.decimals,
        tokenBDecimals: pool.quoteToken.decimals,
      });
    },
  });

  const { values, isValid, setFieldValue, isSubmitting } = formikContext;

  return (
    <FormikContext value={formikContext}>
      <Form className="flex-1 flex flex-col p-4 overflow-y-scroll">
        <div className="flex">
          {curves.map((curve) => {
            const selected = curve.value === values.strategyType;

            return (
              <button
                key={curve.value}
                type="button"
                className={clsx(
                  "flex-1 flex items-center justify-center",
                  selected ? "border-b-2 border-primary p-2" : "text-white/50",
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
            {values.strategyType === "custom" && (
              <PriceRangeInput
                pool={pool}
                showInput={false}
                curveType="Spot"
                value={values.priceChanges}
                sides={[values.sides.length > 0, values.sides.length > 1]}
                amount={values.inputAmount}
                liquidityRatio={
                  values.sides.length > 1 ? values.liquidityRatio : undefined
                }
                onChange={(range) => setFieldValue("range", range)}
              />
            )}
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
            type="button"
            className="bg-primary text-black p-2 rounded-md"
          >
            Open Positon
          </button>
        </div>
      </Form>
    </FormikContext>
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
