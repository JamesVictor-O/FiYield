"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { createPublicClient, http, keccak256, toHex } from "viem";
import {
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { monadTestnet } from "../Providers/Web3Provider";
import { SmartAccountStorage } from "@/lib/storage/smartAccount";
import { isFarcasterEnvironment } from "@/lib/utils/farcaster";
import { injected } from "wagmi/connectors";
import {
  getMetaMaskProviderSafe,
  suppressProviderConflictErrors,
} from "@/lib/metamask/provider";
import { ExternalLink } from "lucide-react";

interface SmartAccountSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (address: string) => void;
}

type SetupStep = "method_selection" | "wallet_connection" | "account_creation";

export const SmartAccountSetup: React.FC<SmartAccountSetupProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [currentStep, setCurrentStep] = useState<SetupStep>("method_selection");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(
    null
  );

  // Initialize error suppression for wallet provider conflicts
  useEffect(() => {
    const cleanup = suppressProviderConflictErrors();
    return cleanup;
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Check if user already has smart account
      if (address && SmartAccountStorage.exists(address)) {
        // User already has smart account, just close
        onClose();
        return;
      }

      // Determine initial step based on connection status
      if (isConnected && address) {
        setCurrentStep("account_creation");
      } else {
        setCurrentStep("method_selection");
      }
      setError(null);
      setIsCreating(false);
    }
  }, [isOpen, isConnected, address, onClose]);

  if (!isOpen) return null;

  // Switch to Monad Testnet
  const switchToMonadTestnet = async (): Promise<boolean> => {
    try {
      const provider = await getMetaMaskProviderSafe();
      if (!provider) {
        throw new Error("No wallet provider found");
      }

      const currentChainId = await provider.request({ method: "eth_chainId" });
      const chainIdDecimal = parseInt(currentChainId, 16);

      if (chainIdDecimal === monadTestnet.id) {
        return true;
      }

      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${monadTestnet.id.toString(16)}` }],
        });

        // Wait and verify
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const newChainId = await provider.request({ method: "eth_chainId" });
        return parseInt(newChainId, 16) === monadTestnet.id;
      } catch (switchError: any) {
        if (switchError.code === 4001) {
          throw new Error("Please approve the chain switch to continue");
        }

        if (switchError.code === 4902) {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${monadTestnet.id.toString(16)}`,
                chainName: monadTestnet.name,
                nativeCurrency: monadTestnet.nativeCurrency,
                rpcUrls: monadTestnet.rpcUrls.default.http,
                blockExplorerUrls: [monadTestnet.blockExplorers.default.url],
              },
            ],
          });

          await new Promise((resolve) => setTimeout(resolve, 2000));
          return true;
        }

        throw new Error(
          `Please switch to Monad Testnet (Chain ID: ${monadTestnet.id})`
        );
      }
    } catch (err) {
      console.error("Chain switch error:", err);
      throw err;
    }
  };

  // Create smart account with wallet
  const createSmartAccountWithWallet = async () => {
    if (!address) {
      throw new Error("No wallet connected");
    }

    // Switch to Monad Testnet
    const switched = await switchToMonadTestnet();
    if (!switched) {
      throw new Error("Failed to switch to Monad Testnet");
    }

    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http("https://testnet-rpc.monad.xyz"),
    });

    // Generate deterministic salt from owner address
    const salt = keccak256(toHex(address));

    console.log("Creating smart account with:", {
      rpcUrl: "https://testnet-rpc.monad.xyz",
      chainId: monadTestnet.id,
      ownerAddress: address,
      salt,
    });

    try {
      // Ensure we're using MetaMask provider
      const provider = await getMetaMaskProviderSafe();
      console.log("Using MetaMask provider:", provider.isMetaMask);

      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [address, [], [], []], // EOA owner, no passkeys
        deploySalt: salt,
        signer: {
          account: {
            address: address as `0x${string}`,
            async signMessage({ message }: { message: any }) {
              try {
                const provider = await getMetaMaskProviderSafe();
                const signature = await provider.request({
                  method: "personal_sign",
                  params: [message, address],
                });
                return signature as `0x${string}`;
              } catch (signError: any) {
                if (signError.code === 4001) {
                  throw new Error(
                    "Please approve the signature request to continue"
                  );
                }
                throw new Error("Failed to sign message. Please try again.");
              }
            },
            async signTypedData(typedData: any) {
              try {
                const provider = await getMetaMaskProviderSafe();
                const signature = await provider.request({
                  method: "eth_signTypedData_v4",
                  params: [address, JSON.stringify(typedData)],
                });
                return signature as `0x${string}`;
              } catch (signError: any) {
                if (signError.code === 4001) {
                  throw new Error(
                    "Please approve the signature request to continue"
                  );
                }
                throw new Error("Failed to sign typed data. Please try again.");
              }
            },
          },
        },
      });

      console.log("✅ Smart account created:", smartAccount.address);

      // Check deployment status
      const code = await publicClient.getBytecode({
        address: smartAccount.address as `0x${string}`,
      });

      const isDeployed = code && code !== "0x";
      console.log("Deployment status:", {
        address: smartAccount.address,
        isDeployed,
      });

      if (!isDeployed) {
        console.log("ℹ️ Smart account needs to be deployed on-chain");

        // Check if user has enough MON for deployment
        const balance = await publicClient.getBalance({
          address: address as `0x${string}`,
        });

        const balanceInMON = Number(balance) / 1e18;
        console.log("User MON balance:", balanceInMON);

        if (balanceInMON < 0.001) {
          throw new Error(
            "Insufficient MON tokens for smart account deployment. Please get testnet MON from the faucet: https://faucet.monad.xyz/"
          );
        }

        console.log("ℹ️ Smart account will be deployed on first transaction");
        console.log("📝 Smart account address:", smartAccount.address);
        console.log(
          "🔗 View on explorer: https://testnet.monadexplorer.com/address/" +
            smartAccount.address
        );
      }

      return smartAccount.address;
    } catch (err) {
      console.error("Smart account creation error:", err);
      throw err;
    }
  };

  // Handle wallet connection
  const handleWalletConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (isFarcasterEnvironment()) {
        // Farcaster: use embedded wallet
        const provider = await getMetaMaskProviderSafe();
        await provider.request({
          method: "eth_requestAccounts",
        });
        connect({ connector: injected() });
      } else {
        // Web: use MetaMask specifically
        const metamaskConnector = connectors.find(
          (c) =>
            c.id === "metaMaskSDK" || c.name.toLowerCase().includes("metamask")
        );

        if (metamaskConnector) {
          connect({ connector: metamaskConnector });
        } else {
          // Fallback to injected but ensure MetaMask is used
          connect({ connector: injected() });
        }
      }

      // Wait for connection
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (isConnected && address) {
        setCurrentStep("account_creation");
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle smart account creation
  const handleCreateSmartAccount = async () => {
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const smartAccountAddress = await createSmartAccountWithWallet();
      setSmartAccountAddress(smartAccountAddress);

      // Save to storage
      SmartAccountStorage.save(address, {
        address: smartAccountAddress as `0x${string}`,
        type: "eoa",
        eoaOwner: address,
      });

      // Show success step instead of immediately closing
      setCurrentStep("account_creation");
      setIsCreating(false);
    } catch (err) {
      console.error("Error creating smart account:", err);

      let errorMessage = "Failed to create smart account";
      if (err instanceof Error) {
        if (
          err.message.includes("User rejected") ||
          err.message.includes("approve")
        ) {
          errorMessage = err.message;
        } else if (
          err.message.includes("chain") ||
          err.message.includes("switch")
        ) {
          errorMessage = err.message;
        } else {
          errorMessage = err.message || errorMessage;
        }
      }

      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating && !isConnecting) {
      setError(null);
      setCurrentStep("method_selection");
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep === "account_creation") {
      // Disconnect wallet and go back
      if (isConnected) {
        disconnect();
      }
      setCurrentStep("method_selection");
    } else if (currentStep === "wallet_connection") {
      setCurrentStep("method_selection");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-[#1a1a1a] border border-white/20 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {currentStep === "method_selection" && "Get Started"}
                {currentStep === "wallet_connection" && "Connect Wallet"}
                {currentStep === "account_creation" && "Create Smart Account"}
              </h2>
              <p className="text-gray-400 text-sm">
                {currentStep === "method_selection" &&
                  "Choose how you want to set up your account"}
                {currentStep === "wallet_connection" &&
                  "Connect your wallet to continue"}
                {currentStep === "account_creation" &&
                  "Enable AI-powered yield optimization"}
              </p>
            </div>
            {!isCreating && !isConnecting && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Step 1: Method Selection */}
            {currentStep === "method_selection" && (
              <div className="space-y-4">
                {/* Wallet Option */}
                <button
                  onClick={() => {
                    setCurrentStep("wallet_connection");
                  }}
                  className="group w-full bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-xl p-6 text-left transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          Connect with Wallet
                        </h3>
                        <span className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full font-medium">
                          Recommended
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">
                        {isFarcasterEnvironment()
                          ? "Use your Farcaster wallet"
                          : "Use MetaMask or other wallet"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-blue-400">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>Secure • Quick setup</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Social Login Option - Coming Soon */}
                <button
                  disabled
                  className="group w-full bg-white/5 border border-white/10 rounded-xl p-6 text-left opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          Social Login
                        </h3>
                        <span className="bg-purple-500/20 text-purple-400 text-xs px-3 py-1 rounded-full font-medium">
                          Coming Soon
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Sign in with Google, Twitter, or email
                      </p>
                    </div>
                  </div>
                </button>

                <div className="bg-white/5 border border-white/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-4 h-4 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-blue-400 text-sm font-medium mb-1">
                        🚀 Smart Account Benefits
                      </p>
                      <p className="text-blue-300 text-sm">
                        Gasless transactions, enhanced security, and AI-powered
                        yield optimization
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Wallet Connection */}
            {currentStep === "wallet_connection" && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {isFarcasterEnvironment()
                      ? "Connect Farcaster Wallet"
                      : "Connect Your Wallet"}
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    {isFarcasterEnvironment()
                      ? "Use your embedded Farcaster wallet"
                      : "We'll use MetaMask to create your smart account"}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleWalletConnect}
                  disabled={isConnecting}
                  className="w-full bg-white text-black hover:bg-gray-100 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Connecting...</span>
                    </span>
                  ) : (
                    "Connect Wallet"
                  )}
                </button>

                <button
                  onClick={handleBack}
                  disabled={isConnecting}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-50"
                >
                  Back
                </button>
              </div>
            )}

            {/* Step 3: Account Creation */}
            {currentStep === "account_creation" && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {smartAccountAddress ? (
                      <svg
                        className="w-8 h-8 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {smartAccountAddress
                      ? "Smart Account Created!"
                      : "Wallet Connected!"}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">
                    {smartAccountAddress
                      ? `${smartAccountAddress.slice(
                          0,
                          6
                        )}...${smartAccountAddress.slice(-4)}`
                      : address
                      ? `${address.slice(0, 6)}...${address.slice(-4)}`
                      : ""}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {smartAccountAddress
                      ? "Your smart account is ready to use"
                      : "Now let's create your smart account"}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Gasless transactions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Enhanced security with delegation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>AI-powered yield optimization</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Batch multiple transactions</span>
                  </div>
                </div>

                {/* Gas Requirements Info */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-blue-400 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-400 mb-2">
                        Gas Requirements
                      </h4>
                      <p className="text-xs text-blue-300 mb-3">
                        Smart account will be deployed on your first
                        transaction. You&apos;ll need MON tokens for gas fees.
                      </p>
                      <div className="flex items-center gap-2">
                        <a
                          href="https://faucet.monad.xyz/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Get Testnet MON
                        </a>
                        <span className="text-xs text-blue-300">
                          Need 0.03+ ETH on mainnet
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Smart Account Success Info */}
                {smartAccountAddress && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 text-green-400 mt-0.5">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-green-400 mb-2">
                          Smart Account Ready
                        </h4>
                        <p className="text-xs text-green-300 mb-3">
                          Your smart account has been created and will be
                          deployed on your first transaction.
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-300">
                              Address:
                            </span>
                            <code className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                              {smartAccountAddress.slice(0, 10)}...
                              {smartAccountAddress.slice(-8)}
                            </code>
                          </div>
                          <a
                            href={`https://testnet.monadexplorer.com/address/${smartAccountAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View on Explorer
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={handleBack}
                    disabled={isCreating}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-xl font-medium transition-all duration-300 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={
                      smartAccountAddress
                        ? () => {
                            onSuccess(smartAccountAddress);
                            onClose();
                          }
                        : handleCreateSmartAccount
                    }
                    disabled={isCreating}
                    className="flex-1 bg-white text-black hover:bg-gray-100 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </span>
                    ) : smartAccountAddress ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Done
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Create Smart Account
                      </span>
                    )}
                  </button>
                </div>

                <p className="text-sm text-gray-400 text-center">
                  Your smart account will be deployed on Monad Testnet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
