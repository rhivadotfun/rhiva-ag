import clsx from "clsx";
import { object, number } from "yup";
import { PublicKey } from "@solana/web3.js";
import { useCallback, useMemo } from "react";
import type { Pair } from "@rhiva-ag/dex-api";
import { IoArrowBack } from "react-icons/io5";
import { NATIVE_MINT } from "@solana/spl-token";
import { Form, FormikContext, useFormik } from "formik";
import { useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

import TokenInput from "./TokenInput";
import RatioInput from "./RatioInput";
import Image from "@/components/Image";
import { useTRPC } from "@/trpc.client";
import PriceRangeInput from "./PriceRangeInput";
import { getActiveBin } from "@/lib/web3/meteora-patch";

type MeteoraOpenPositionProps = {
  pool: Pair;
} & React.ComponentProps<typeof Dialog>;

export default function MeteoraOpenPosition({
  pool,
  ...props
}: MeteoraOpenPositionProps) {
  const form = useMemo(() => <MeteoraOpenPositionForm pool={pool} />, [pool]);

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

function MeteoraOpenPositionForm({
  pool,
  ...props
}: React.ComponentProps<typeof Form> & Pick<MeteoraOpenPositionProps, "pool">) {
  const trpc = useTRPC();
  const { connection } = useConnection();

  const { data: activeBin } = useQuery({
    queryKey: [pool.address, "activeBin"],
    refetchInterval: 60000,
    queryFn: () =>
      getActiveBin(
        connection,
        new PublicKey(pool.address),
        pool.baseToken.decimals,
        pool.quoteToken.decimals,
      ),
  });

  const curves = useMemo(
    () => [
      { label: "Spot", value: "Spot" },
      { label: "Curve", value: "Curve" },
      { label: "Bid-Ask", value: "BidAsk" },
    ],
    [],
  );

  const { mutateAsync } = useMutation(
    trpc.position.meteora.create.mutationOptions(),
  );

  const optimalPriceChange: [number, number] = useMemo(() => {
    const binStepPct = pool.binStep / 10_000;
    const maximumBinPerPosition = 69;
    const totalRangePct = (maximumBinPerPosition * binStepPct) / 2;
    return [-totalRangePct, totalRangePct];
  }, [pool]);

  const formikContext = useFormik({
    validateOnMount: true,
    validationSchema: object({
      inputAmount: number().moreThan(0).required(),
    }),
    initialValues: {
      inputAmount: undefined as unknown as number,
      inputMint: NATIVE_MINT.toBase58(),
      strategyType: "Spot" as const,
      priceChanges: optimalPriceChange,
      liquidityRatio: [0.5, 0.5] as [number, number],
      sides: [pool.baseToken.id, pool.quoteToken.id],
      tokens: [
        {
          id: pool.baseToken.id,
          name: pool.baseToken.name,
          image: pool.baseToken.icon,
          symbol: pool.baseToken.symbol,
          decimals: pool.baseToken.decimals,
          tokenProgram: pool.baseToken.tokenProgram,
        },
        {
          id: pool.quoteToken.id,
          name: pool.quoteToken.name,
          image: pool.quoteToken.icon,
          symbol: pool.quoteToken.symbol,
          decimals: pool.quoteToken.decimals,
          tokenProgram: pool.quoteToken.tokenProgram,
        },
      ],
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
  const onLiquidityRatio = useCallback(
    (value: [number, number]) => setFieldValue("liquidityRatio", value),
    [setFieldValue],
  );
  const onPriceChanges = useCallback(
    (value: [number, number]) => setFieldValue("priceChanges", value),
    [setFieldValue],
  );

  return (
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
                onClick={() => setFieldValue("strategyType", curve.value)}
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
            <TokenInput
              name="inputAmount"
              label="Trade amount"
              value={values.inputAmount}
              onChange={(value) => setFieldValue("inputAmount", value)}
            />
            <div className="flex space-x-4">
              {[pool.baseToken, pool.quoteToken].map((token) => {
                const selected = values.sides.find((side) => side === token.id);

                return (
                  <button
                    key={token.id}
                    type="button"
                    className={clsx(
                      "flex-1 flex items-center justify-center  border-1 p-2 rounded lt-sm:items-center lt-sm:space-x-2 sm:flex-col sm:space-y-4",
                      selected
                        ? "border-transparent bg-primary text-black"
                        : "border-gray text-gray",
                    )}
                    onClick={() => {
                      let sides = values.sides;
                      if (selected)
                        sides = sides.filter((side) => side !== token.id);
                      else sides.push(token.id);
                      setFieldValue("sides", sides);
                    }}
                  >
                    <Image
                      src={token.icon}
                      width={24}
                      height={24}
                      alt={token.symbol}
                      className="rounded-full"
                    />
                    <span>{token.symbol}</span>
                  </button>
                );
              })}
            </div>
            {values.sides.length > 1 && (
              <RatioInput
                tokens={[pool.baseToken, pool.quoteToken]}
                value={values.liquidityRatio}
                onChange={onLiquidityRatio}
              />
            )}
            {activeBin && (
              <PriceRangeInput
                pool={pool}
                sides={[values.sides.length > 0, values.sides.length > 1]}
                curveType={values.strategyType}
                amount={values.inputAmount}
                activeBin={activeBin}
                value={values.priceChanges}
                liquidityRatio={
                  values.sides.length > 1 ? values.liquidityRatio : undefined
                }
                onChange={onPriceChanges}
              />
            )}
          </div>
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
      </Form>
    </FormikContext>
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
