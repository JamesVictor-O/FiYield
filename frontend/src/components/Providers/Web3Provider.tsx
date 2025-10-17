"use client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain } from "viem";
import { useEffect } from "react";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import {
  initializeMetaMaskProvider,
  suppressProviderConflictErrors,
} from "@/lib/metamask/provider";

// Define Monad Testnet chain with CORRECT chain ID
export const monadTestnet = defineChain({
  id: 10143,
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

// Create Wagmi config with RainbowKit
// Note: You need to set  in your .env.local file
// Get a free project ID from https://cloud.walletconnect.com/
const config = getDefaultConfig({
  appName: "FiYield",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
  chains: [monadTestnet],
  ssr: true,
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
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
