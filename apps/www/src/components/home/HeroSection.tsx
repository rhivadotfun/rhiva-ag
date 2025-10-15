import Image from "next/image";
import clsx from "clsx";
import Banner from "@/assets/bg/banner.png";

export default function HeroSection(props: React.ComponentProps<"section">) {
  return (
    <section
      {...props}
      className={clsx(
        props.className,
        // card container
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl",
      )}
    >
      {/* two columns that can shrink */}
      <div className="grid md:grid-cols-2 items-stretch">
        {/* text column */}
        <div className="min-w-0 p-6 md:p-10 space-y-4">
          <p className="text-lg">GM, User</p>
          <div className="space-y-2">
            <h1 className="text-primary font-bold text-3xl sm:text-5xl 2xl:text-6xl">
              Welcome to Rhiva
            </h1>
            <p className="text-sm sm:text-lg 2xl:text-xl text-light">
              Smart Liquidity Yield Aggregator on Solana
            </p>
          </div>
          <p className="text-gray 2xl:text-lg">
            Maximize your earnings with our simplified liquidity pool yield
            aggregator across top DEXes on Solana.
          </p>
        </div>

        {/* image column (bounded) */}
        <div className="relative min-w-0">
          {/* give the image a height using aspect ratio so it cannot push width */}
          <div className="relative w-full h-full md:aspect-[16/7]">
            <Image
              src={Banner}
              alt="Welcome Banner"
              fill
              priority
              className="object-cover object-right"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
        </div>
      </div>

      {/* glow stays inside the card bounds */}
      <div className="pointer-events-none absolute inset-x-6 top-0 h-4 rounded-full bg-primary/30 blur-[64px]" />
    </section>
  );
}
