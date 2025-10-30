"use client";
import { CookiesProvider } from "react-cookie";
import { Provider as ReduxProvider } from "react-redux";

import { store } from "@/store";
import TRPCProvider from "./TRPCProvider";
import ReactQueryProvider from "./ReactQueryProvider";
import LegalModal from "@/components/modals/LegalModal";

export default function Provider({ children }: React.PropsWithChildren) {
  return (
    <ReduxProvider store={store}>
      <ReactQueryProvider>
        <TRPCProvider>
          <CookiesProvider>
            {children}
            <LegalModal />
          </CookiesProvider>
        </TRPCProvider>
      </ReactQueryProvider>
    </ReduxProvider>
  );
}
