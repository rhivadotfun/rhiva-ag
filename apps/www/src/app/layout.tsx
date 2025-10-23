import clsx from "clsx";
import Image from "next/image";
import "@unocss/reset/tailwind.css";
import "rc-slider/assets/index.css";
import { ToastContainer } from "react-toastify";
import { PT_Sans_Caption } from "next/font/google";
import "@solana/wallet-adapter-react-ui/styles.css";
import { CivicAuthProvider } from "@civic/auth/nextjs";

import "./globals.css";
import Provider from "@/providers";
import Line from "@/assets/bg/line.png";
import NavBar from "@/components/layout/NavBar";
import AuthProvider from "@/providers/AuthProvider";
import Onboarding from "@/components/onboarding/Onboarding";

const defaultFont = PT_Sans_Caption({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  weight: ["400", "700"],
});

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <CivicAuthProvider>
      <AuthProvider>
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
              <Onboarding>
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
              </Onboarding>
            </body>
          </html>
        </Provider>
      </AuthProvider>
    </CivicAuthProvider>
  );
}
