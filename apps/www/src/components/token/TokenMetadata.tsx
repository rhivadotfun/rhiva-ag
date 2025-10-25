import ms from "ms";
import clsx from "clsx";
import moment from "moment";

import Image from "../Image";
import { TokenAddressTooltip } from "../AddressTooltip";

type TokenMetadataProps = {
  image?: string;
  name: string;
  symbol: string;
  mint: string;
  createdTime?: moment.Moment;
} & React.ComponentProps<"div">;

export default function TokenMetadata({
  image,
  name,
  mint,
  symbol,
  createdTime,
  ...props
}: TokenMetadataProps) {
  return (
    <div
      {...props}
      className={clsx("flex flex-col", props.className)}
    >
      <div className="flex items-center space-x-2">
        <Image
          src={image}
          width={64}
          height={64}
          alt={symbol}
          className="size-12 rounded-full"
        />
        <div>
          <p className="text-lg font-bold">{name}</p>
          <p className="text-sm text-gray">{symbol}</p>
        </div>
        <TokenAddressTooltip address={mint} />
      </div>
      {createdTime && <p>{ms(moment().diff(createdTime))}</p>}
    </div>
  );
}
