"use client";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain } from "viem";

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
      webSocket: ["wss://testnet-rpc.monad.xyz"]
    },
    public: { 
      http: ["https://testnet-rpc.monad.xyz"],
      webSocket: ["wss://testnet-rpc.monad.xyz"]
    },
  },
  blockExplorers: {
    default: { 
      name: "Monad Explorer", 
      url: "https://testnet.monadexplorer.com" 
    },
  },
  testnet: true,
});

// Create Wagmi config with Monad Testnet
const config = createConfig({
  chains: [monadTestnet],
  transports: { 
    [monadTestnet.id]: http("https://testnet-rpc.monad.xyz")
  },
});

// Create QueryClient instance outside component to avoid recreating on each render
const queryClient = new QueryClient();

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['wallet', 'google', 'email'],
        embeddedWallets: { 
          createOnLogin: 'users-without-wallets',
          // Ensure embedded wallets support Monad Testnet
          chains: [monadTestnet]
        },
        // Explicitly configure supported chains
        supportedChains: [monadTestnet],
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