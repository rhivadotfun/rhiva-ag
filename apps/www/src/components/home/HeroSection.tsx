import clsx from "clsx";
import Image from "next/image";
import Banner from "@/assets/bg/banner.svg";

export default function HeroSection(props: React.ComponentProps<"section">) {
  return (
    <section
      {...props}
      className={clsx(
        props.className,
        "overflow-hidden relative flex justify-between items-center bg-white/5 backdrop-blur-2xl border border-white/10 rounded-xl",
      )}
    >
      <div className="flex flex-col justify-center p-4 space-y-4 z-10 md:px-8">
        <p className="text-lg">GM, User</p>
        <div className="flex flex-col justify-center space-y-2">
          <div className="flex flex-col lt-sm:w-40 lt-md:space-y-2">
            <h1 className="text-lg text-nowrap text-primary font-bold sm:text-4xl 2xl:text-5xl">
              Welcome to Rhiva
            </h1>
            <p className="text-sm text-light sm:text-lg 2xl:text-xl">
              Liquidity Yield Aggregator On Solana
            </p>
          </div>
          <p className="text-gray lt-md:hidden 2xl:text-lg">
            Maximize your earnings with our simplified,
            <br className="lg:hidden" /> AI-powered
            <br className="lt-lg:hidden" />
            liquidity pool yield aggregator <br className="lg:hidden" />
            across top DEXes on Solana.
          </p>
        </div>
      </div>
      <Image
        src={Banner}
        width={600}
        height={600}
        alt="Welcome Banner"
        className="object-contain justify-end"
      />
      <div className="absolute top-0 min-w-5/10 h-4 p-2 bg-primary blur-[64px] rounded-full" />
    </section>
  );
}
