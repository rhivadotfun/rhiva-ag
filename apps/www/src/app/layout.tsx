import clsx from "clsx";
import Image from "next/image";
import "@unocss/reset/tailwind.css";
import { Noto_Sans } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "@solana/wallet-adapter-react-ui/styles.css";
import { CivicAuthProvider } from "@civic/auth/nextjs";

import "./globals.css";
import Provider from "@/providers";
import Line from "@/assets/bg/line.png";
import NavBar from "@/components/layout/NavBar";
import AuthProvider from "@/providers/AuthProvider";

const defaultFont = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  weight: ["400", "600", "700"],
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
      </AuthProvider>
    </CivicAuthProvider>
  );
}
