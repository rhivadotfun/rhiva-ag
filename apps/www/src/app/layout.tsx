import clsx from "clsx";
import Image from "next/image";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { ToastContainer } from "react-toastify";

import "@unocss/reset/tailwind.css";
import "rc-slider/assets/index.css";
import "react-tooltip/dist/react-tooltip.css";

import "./globals.css";
import Provider from "@/providers";
import Auth from "@/components/auth";
import Line from "@/assets/bg/line.png";
import NavBar from "@/components/layout/NavBar";

const defaultFont = Roboto({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rhiva | Liquidity Aggregator for seamless LP",
  description:
    "Experience Rhiva Beta, the all-in-one liquidity aggregator. Provide liquidity across multiple dexes.",
  openGraph: {
    images: ["https://beta.rhiva.fun/banner.jpg"],
  },
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <Auth>
      <Provider>
        <html
          lang="en"
          style={defaultFont.style}
          className={clsx(defaultFont.variable, defaultFont.className)}
        >
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1"
          />

          <body className="fixed inset-0 flex flex-col bg-dark text-white overflow-y-scroll lt-md:text-sm">
            <Image
              src={Line.src}
              width={1643}
              height={260}
              alt="Background Line"
              className="w-full absolute inset-x-0 z-0"
            />
            <div className="flex-1 flex z-10 lt-sm:flex-col-reverse overflow-y-scroll">
              <NavBar />
              {children}
              <ToastContainer />
            </div>
          </body>
        </html>
      </Provider>
    </Auth>
  );
}
