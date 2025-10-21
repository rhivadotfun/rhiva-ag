import clsx from "clsx";
import { useRouter } from "next/navigation";

import Decimal from "../Decimal";
import IcAiIcon from "@/assets/icons/ic_ai";
import { currencyIntlArgs } from "@/constants/format";
import { format } from "util";

type TokenInfoProps = {
  mint: string;
  price: number;
  holders: number;
  volume: number;
  liquidity: number;
  marketCap: number;
} & React.ComponentProps<"div">;

export default function TokenInfo({
  mint,
  volume,
  price,
  holders,
  liquidity,
  marketCap,
  ...props
}: TokenInfoProps) {
  const router = useRouter();

  return (
    <div
      {...props}
      className={clsx(
        "grid grid-cols-3 gap-2 md:flex md:flex-wrap md:gap-x-4",
        props.className,
      )}
    >
      <div>
        <button
          type="button"
          className="flex items-center space-x-2 border border-green fill-green px-2 py-1 rounded-md"
          onClick={() =>
            router.push(format("/ai?prompt=Analyse this token %s", mint))
          }
        >
          <IcAiIcon
            width={18}
            height={18}
          />
          <span className="text-green">Ask Ai</span>
        </button>
      </div>
      <div>
        <p className="text-xs text-gray">Current Liquidity</p>
        <Decimal
          value={liquidity}
          intlArgs={currencyIntlArgs}
        />
      </div>
      <div>
        <p className="text-xs text-gray">Market Cap</p>
        <Decimal
          value={marketCap}
          intlArgs={currencyIntlArgs}
        />
      </div>
      <div>
        <p className="text-xs text-gray">Volume</p>
        <Decimal
          value={volume}
          intlArgs={currencyIntlArgs}
        />
      </div>
      <div>
        <p className="text-xs text-gray">Price</p>
        <Decimal
          value={price}
          intlArgs={currencyIntlArgs}
        />
      </div>
      <div>
        <p className="text-xs text-gray">Holders</p>
        <Decimal value={holders} />
      </div>
    </div>
  );
}
