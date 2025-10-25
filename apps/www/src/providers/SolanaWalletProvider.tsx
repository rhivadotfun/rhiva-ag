import { useMemo } from "react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";

export default function SolanaWalletProvider({
  children,
}: React.PropsWithChildren) {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={process.env.NEXT_PUBLIC_SOLANA_RPC_URL!}>
      <WalletProvider
        wallets={wallets}
        autoConnect
      >
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
