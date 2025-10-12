import ms from "ms";
import clsx from "clsx";
import moment from "moment";
import { MdOpenInNew } from "react-icons/md";

import Image from "../Image";
import { truncateString } from "@/lib";

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
        <p className="text-lg font-bold">{symbol}</p>
        <button
          type="button"
          className="flex items-center space-x-2 bg-white/10 px-2 p-0.5 rounded-md"
        >
          <span className="text-xs text-gray">{truncateString(mint)}</span>
          <MdOpenInNew />
        </button>
      </div>
      {createdTime && <p>{ms(moment().diff(createdTime))}</p>}
    </div>
  );
}
