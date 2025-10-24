"use client";
import { CookiesProvider } from "react-cookie";
import { NextIntlClientProvider } from "next-intl";
import { Provider as ReduxProvider } from "react-redux";

import { store } from "@/store";
import AppData from "./AppData";
import TRPCProvider from "./TRPCProvider";
import ReactQueryProvider from "./ReactQueryProvider";
import SolanaWalletProvider from "./SolanaWalletProvider";

export default function Provider({ children }: React.PropsWithChildren) {
  return (
    <ReduxProvider store={store}>
      <NextIntlClientProvider locale="en">
        <ReactQueryProvider>
          <TRPCProvider>
            <CookiesProvider>
              <SolanaWalletProvider>{children}</SolanaWalletProvider>
            </CookiesProvider>
            <AppData />
          </TRPCProvider>
        </ReactQueryProvider>
      </NextIntlClientProvider>
    </ReduxProvider>
  );
}
