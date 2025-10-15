import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";

type TokenInputProps = {
  name?: string;
  label?: string;
  value?: number;
  onChange: (value: number) => void;
};

export default function TokenInput({
  name,
  label,
  value,
  onChange,
}: TokenInputProps) {
  const { user } = useAuth();
  const { connection } = useConnection();
  const [rawInput, setRawInput] = useState<string | number | undefined>(
    value ?? "",
  );

  const { data: balance } = useQuery({
    refetchInterval: 60000,
    enabled: Boolean(user),
    queryKey: [user.wallet.id, "balance"],
    queryFn: () => connection.getBalance(new PublicKey(user.wallet.id)),
  });

  const autoFillOptions = useMemo(
    () => [
      { label: "25%", value: 0.25 },
      { label: "50%", value: 0.5 },
      { label: "75%", value: 0.75 },
      { label: "Max", value: 1 },
    ],
    [],
  );

  return (
    <div className="flex flex-col space-y-2">
      {label && (
        <label
          htmlFor={name}
          className="text-light-secondary lt-sm:text-xs"
        >
          {label}
        </label>
      )}
      <div className="flex flex-col">
        <div className="flex items-center justify-between bg-black/10 border border-white/20 p-2 rounded-md focus-within:border-primary">
          <input
            name={name}
            type="number"
            value={rawInput}
            placeholder="0.0"
            className="flex-1 text-xl font-medium"
            onChange={(event) => {
              const raw = event.target.value;
              setRawInput(raw);
              const value = parseFloat(raw);
              if (Number.isNaN(value)) onChange(0);
              else onChange(parseFloat(event.target.value));
            }}
          />
          <span className="text-gray">SOL</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray">
          <p>Balance: {balance} SOL</p>
          <div className="flex items-center space-x-2">
            {autoFillOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className="p-2 last:bg-primary/5 last:py-1 last:rounded"
                onClick={() => {
                  if (balance) onChange(balance * option.value);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
