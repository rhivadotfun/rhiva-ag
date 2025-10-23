import clsx from "clsx";
import Image from "next/image";
import Banner from "@/assets/bg/banner.svg";

export default function HeroSection(props: React.ComponentProps<"section">) {
  return (
    <section
      {...props}
      className={clsx(
        props.className,
        "relative overflow-hidden flex items-center bg-white/5 backdrop-blur-2xl border border-white/10 rounded-xl min-h-[280px] md:min-h-[320px] lg:min-h-[400px]",
      )}
    >
      <div className="relative z-10 flex flex-col justify-center p-6 space-y-4 lt-xl:max-w-6/10 md:px-8 lg:px-12 max-w-2xl">
        <p className="text-sm text-gray-400 md:text-base lg:text-lg">
          GM, User
        </p>

        <div className="flex flex-col space-y-2 md:space-y-3">
          <h1 className="text-2xl font-bold text-primary sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
            Welcome to Rhiva
          </h1>

          <p className="text-base text-white/90 sm:text-lg md:text-xl lg:text-2xl font-medium">
            Liquidity Yield Aggregator On Solana
          </p>

          <p className="text-sm text-gray-400 max-w-xl pt-2 lt-md:hidden md:text-base lg:text-lg ">
            Maximize your earnings with our simplified, AI-powered liquidity
            pool yield aggregator across top DEXes on Solana.
          </p>
        </div>
      </div>

      <div className="absolute right-0 top-0 h-full w-1/2 md:w-3/5 lg:w-1/2 pointer-events-none">
        <Image
          src={Banner}
          alt="Welcome Banner"
          fill
          className="object-cover object-left"
          priority
        />
      </div>

      <div className="absolute top-0 right-1/4 w-64 h-64 bg-primary/30 blur-[100px] rounded-full pointer-events-none" />
    </section>
  );
}
