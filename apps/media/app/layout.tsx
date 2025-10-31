import clsx from "clsx";
import "@unocss/reset/tailwind.css";
import { Roboto } from "next/font/google";

import "./globals.css";
import type { Metadata } from "next";

const defaultFont = Roboto({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rhiva | Legal",
  description: "Beta Terms & Conditions",
  openGraph: {
    images: ["https://legal.rhiva.fun/banner.jpg"],
  },
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html
      lang="en"
      style={defaultFont.style}
      className={clsx(defaultFont.variable, defaultFont.className)}
    >
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1"
      />

      <body className="flex flex-col bg-dark text-light overflow-y-scroll lt-md:text-sm">
        {children}
      </body>
    </html>
  );
}
