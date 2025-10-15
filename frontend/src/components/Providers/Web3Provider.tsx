"use client";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain } from "viem";
import { useEffect } from "react";
import {
  initializeMetaMaskProvider,
  suppressProviderConflictErrors,
} from "@/lib/metamask/provider";

// Define Monad Testnet chain with CORRECT chain ID
export const monadTestnet = defineChain({
  id: 10143, // CORRECT: Official Monad Testnet Chain ID
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "MON",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
      webSocket: ["wss://testnet-rpc.monad.xyz"],
    },
    public: {
      http: ["https://testnet-rpc.monad.xyz"],
      webSocket: ["wss://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
});

// Create Wagmi config with Monad Testnet
const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http("https://testnet-rpc.monad.xyz"),
  },
});

// Create QueryClient instance outside component to avoid recreating on each render
const queryClient = new QueryClient();

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Handle wallet provider conflicts
  useEffect(() => {
    // Initialize MetaMask provider handling
    initializeMetaMaskProvider();

    // Suppress provider conflict errors
    const restoreErrorHandler = suppressProviderConflictErrors();

    return () => {
      if (restoreErrorHandler) {
        restoreErrorHandler();
      }
    };
  }, []);

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["wallet", "google", "email"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        // Explicitly configure supported chains
        supportedChains: [monadTestnet],
        // Configure appearance to avoid conflicts
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
        },
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}
