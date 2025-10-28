"use client";
import { CookiesProvider } from "react-cookie";
import { NextIntlClientProvider } from "next-intl";
import { Provider as ReduxProvider } from "react-redux";

import { store } from "@/store";
import TRPCProvider from "./TRPCProvider";
import ReactQueryProvider from "./ReactQueryProvider";

export default function Provider({ children }: React.PropsWithChildren) {
  return (
    <ReduxProvider store={store}>
      <NextIntlClientProvider locale="en">
        <ReactQueryProvider>
          <TRPCProvider>
            <CookiesProvider>{children}</CookiesProvider>
          </TRPCProvider>
        </ReactQueryProvider>
      </NextIntlClientProvider>
    </ReduxProvider>
  );
}
