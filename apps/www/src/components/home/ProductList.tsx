"use client";
import clsx from "clsx";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoArrowBackOutline, IoArrowForwardOutline } from "react-icons/io5";

import Bot from "@/assets/bot.png";
import Swap from "@/assets/swap.png";
import Point from "@/assets/point.png";
import Learn from "@/assets/learn.png";
import Referral from "@/assets/referral.png";
import Lens from "@/assets/lens.png";

export default function ProductList(props: React.ComponentProps<"section">) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const products = [
    {
      name: "Referrals",
      image: Referral,
      onClick() {
        router.push("/referral");
      },
    },
    {
      name: "Points",
      image: Point,
      onClick() {
        router.push("/points");
      },
    },

    {
      name: "Swap",
      image: Swap,
    },
    {
      name: "Rhiva Bot",
      image: Bot,
      onClick() {
        window.open("https://t.me/rhivabot", "_blank");
      },
    },
    {
      name: "Rhiva Lens",
      image: Lens,
      onClick() {
        window.open("https://lens.rhiva.fun", "_blank");
      },
    },
    {
      name: "Rhiva Learn",
      image: Learn,
    },
  ];

  const scrollTo = useCallback((direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    const sign = direction === "right" ? +1 : -1;
    if (container)
      container.scrollBy({
        left: sign * (container.clientWidth / 1.2),
        behavior: "smooth",
      });
  }, []);

  const updateScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      updateScrollButtons();
      container.addEventListener("scroll", updateScrollButtons);
      window.addEventListener("resize", updateScrollButtons);
      return () => {
        container.removeEventListener("scroll", updateScrollButtons);
        window.removeEventListener("resize", updateScrollButtons);
      };
    }
  }, [updateScrollButtons]);

  return (
    <div className="relative flex items-center xl:self-center">
      <section
        {...props}
        ref={scrollContainerRef}
        className={clsx(
          "flex flex-nowrap  space-x-8 overflow-x-scroll max-w-full",
          props.className,
        )}
      >
        {products.map((product) => (
          <button
            key={product.name}
            type="button"
            className="relative flex flex-col items-center justify-center shrink-0 px-4 pb-4 sm:min-w-48 md:flex-1"
            onClick={product.onClick}
          >
            <div className="lt-sm:w-28 lt-sm:h-20 absolute inset-x-0 bottom-0 overflow-hidden flex justify-center  bg-dark-secondary border border-white/10 rounded-md -z-10 sm:min-w-48 sm:min-h-32">
              <div className="w-6/10 h-4 bg-primary blur-xl" />
            </div>
            <Image
              src={product.image}
              width={128}
              height={128}
              alt={product.name}
              className="w-16 h-16 object-cover sm:w-36 sm:h-36"
            />
            <div className="w-full h-0.2 bg-gradient-to-r from-primary to-black/50 blur-[1px]" />
            <p className="mt-2 text-center text-nowrap"> {product.name}</p>
          </button>
        ))}
      </section>

      {canScrollLeft && (
        <button
          type="button"
          className="size-8 flex items-center justify-center absolute left-4 border border-black bg-primary text-black rounded-full"
          onClick={() => scrollTo("left")}
        >
          <IoArrowBackOutline size={24} />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          className="size-8 flex items-center justify-center absolute right-4 border border-black bg-primary text-black rounded-full"
          onClick={() => scrollTo("right")}
        >
          <IoArrowForwardOutline size={24} />
        </button>
      )}
    </div>
  );
}
