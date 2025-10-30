"use client";
import { CookiesProvider } from "react-cookie";
import { Provider as ReduxProvider } from "react-redux";

import { store } from "@/store";
import TRPCProvider from "./TRPCProvider";
import ReactQueryProvider from "./ReactQueryProvider";

export default function Provider({ children }: React.PropsWithChildren) {
  return (
    <ReduxProvider store={store}>
      <ReactQueryProvider>
        <TRPCProvider>
          <CookiesProvider>{children}</CookiesProvider>
        </TRPCProvider>
      </ReactQueryProvider>
    </ReduxProvider>
  );
}
