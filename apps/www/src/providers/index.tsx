"use client";
import { CookiesProvider } from "react-cookie";

import TRPCProvider from "./TRPCProvider";
import ReactQueryProvider from "./ReactQueryProvider";
import LegalModal from "@/components/modals/LegalModal";

export default function Provider({ children }: React.PropsWithChildren) {
  return (
    <ReactQueryProvider>
      <TRPCProvider>
        <CookiesProvider>
          {children}
          <LegalModal />
        </CookiesProvider>
      </TRPCProvider>
    </ReactQueryProvider>
  );
}
