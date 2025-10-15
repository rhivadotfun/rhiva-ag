import clsx from "clsx";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";

import Decimal from "../Decimal";
import { dexApi } from "@/instances";
import { currencyIntlArgs } from "@/constants/format";

type DepositInputProps = {
  apr: number;
  value: number;
  onChange: (value: number) => void;
} & Omit<React.ComponentProps<"div">, "onChange">;

export default function DepositInput({
  value,
  apr,
  onChange,
  ...props
}: DepositInputProps) {
  const { user } = useAuth();
  const { connection } = useConnection();
  const [rawInput, setRawInput] = useState<string | number>(value);

  const { data: balance } = useQuery({
    refetchInterval: 60000,
    enabled: Boolean(user),
    queryKey: [user.wallet.id, "balance"],
    queryFn: () => connection.getBalance(new PublicKey(user.wallet.id)),
  });

  const { data: price } = useQuery({
    queryKey: ["solana"],
    refetchInterval: 60000,
    queryFn: async () => {
      const mint = NATIVE_MINT.toBase58();
      const prices = await dexApi.jup.price.getPrices(NATIVE_MINT.toBase58());

      return prices[mint];
    },
  });

  const estimatedYield = useMemo(() => {
    if (price) return value * price.usdPrice * apr;
    return null;
  }, [value, price, apr]);

  return (
    <div
      {...props}
      className={clsx("flex flex-col space-y-4", props.className)}
    >
      <div className="flex flex-col space-y-2">
        <label
          htmlFor="amount"
          className="text-light-secondary"
        >
          Deposit Amount
        </label>
        <div className="flex flex-col space-y-2 border border-white/10 p-4 rounded-md focus-within:border-primary">
          <div className="flex items-center">
            <input
              value={rawInput}
              name="amount"
              type="number"
              placeholder="0"
              className="flex-1 text-xl"
              onChange={(event) => {
                const raw = event.target.value;
                setRawInput(raw);
                const value = parseFloat(raw);
                if (Number.isNaN(value)) onChange(0);
                else onChange(value);
              }}
            />
            <div className="text-light">SOL</div>
          </div>
          <p className="text-sm text-gray">{balance} SOL</p>
        </div>
      </div>
      <div className="flex justify-between">
        <div className="flex items-center space-x-2 text-light">
          <span>Estimated Yield</span>
          <div className="text-gray bg-primary/10 px-2 rounded">24H</div>
        </div>
        {estimatedYield && (
          <Decimal
            value={estimatedYield}
            intlArgs={currencyIntlArgs}
          />
        )}
      </div>
    </div>
  );
}
