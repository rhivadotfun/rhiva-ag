"use client";
import { CookiesProvider } from "react-cookie";
import { NextIntlClientProvider } from "next-intl";
import { Provider as ReduxProvider } from "react-redux";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";

import { store } from "@/store";
import AppData from "./AppData";
import TRPCProvider from "./TRPCProvider";

export default function Provider({ children }: React.PropsWithChildren) {
  return (
    <ReduxProvider store={store}>
      <ConnectionProvider endpoint={process.env.NEXT_PUBLIC_SOLANA_RPC_URL!}>
        <WalletProvider
          wallets={[]}
          autoConnect
        >
          <WalletModalProvider>
            <NextIntlClientProvider locale="en">
              <TRPCProvider>
                <CookiesProvider>{children}</CookiesProvider>
                <AppData />
              </TRPCProvider>
            </NextIntlClientProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ReduxProvider>
  );
}
