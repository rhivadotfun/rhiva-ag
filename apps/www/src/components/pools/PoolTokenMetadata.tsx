import clsx from "clsx";
import { MdContentCopy } from "react-icons/md";

import Image from "../Image";
import IcDex from "@/assets/icons/ic_dex";
import IcAiIcon from "@/assets/icons/ic_ai";

type PoolTokenMetadata = {
  id: string;
  name: string;
  image: {
    base: {
      src: string;
      alt: string;
    };
    quote: {
      src: string;
      alt: string;
    };
  };
  dex: "meteora" | "saros" | "orca" | "raydium";
} & React.ComponentProps<"div">;

export default function PoolTokenMetadata({
  name,
  image,
  dex,
  ...props
}: PoolTokenMetadata) {
  return (
    <div
      {...props}
      className={clsx("flex items-center space-x-8", props.className)}
    >
      <div className="flex items-center space-x-2 lt-sm:flex-1">
        <div className="flex w-12 relative">
          <Image
            src={image.base.src}
            width={32}
            height={32}
            alt={image.base.alt}
            className="rounded-full"
          />
          <Image
            src={image.quote.src}
            width={32}
            height={32}
            alt={image.quote.alt}
            className="absolute right-0 rounded-full"
          />
        </div>
        <h1 className="text-lg sm:text-xl font-bold">{name}</h1>
        <button
          type="button"
          className="text-gray"
        >
          <MdContentCopy />
        </button>
        <IcDex
          dex={dex}
          width={24}
          height={24}
        />
      </div>
      <button
        type="button"
        className="flex items-center space-x-2 bg-primary/10 px-2 py-1 border border-primary/50 text-primary fill-primary rounded"
      >
        <IcAiIcon
          width={18}
          height={18}
        />
        <span>Ask Ai</span>
      </button>
    </div>
  );
}
