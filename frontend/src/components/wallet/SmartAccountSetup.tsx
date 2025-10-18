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
      const provider = (window as any).ethereum;
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
                const provider = (window as any).ethereum;
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
                const provider = (window as any).ethereum;
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
        console.log("ℹ️ Smart account will be deployed on first transaction");
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
        if (typeof window !== "undefined" && (window as any).ethereum) {
          await (window as any).ethereum.request({
            method: "eth_requestAccounts",
          });
          connect({ connector: injected() });
        } else {
          throw new Error("No wallet provider found in Farcaster");
        }
      } else {
        // Web: use MetaMask
        const metamaskConnector = connectors.find(
          (c) =>
            c.id === "metaMaskSDK" || c.name.toLowerCase().includes("metamask")
        );

        if (metamaskConnector) {
          connect({ connector: metamaskConnector });
        } else {
          // Fallback to injected
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

      // Save to storage
        SmartAccountStorage.save(address, {
          address: smartAccountAddress as `0x${string}`,
        type: "eoa",
        eoaOwner: address,
      });

      // Notify parent
      onSuccess(smartAccountAddress);
      onClose();
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
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Wallet Connected!
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">
                    {address
                      ? `${address.slice(0, 6)}...${address.slice(-4)}`
                      : ""}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Now let&apos;s create your smart account
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
                    onClick={handleCreateSmartAccount}
                  disabled={isCreating}
                    className="flex-1 bg-white text-black hover:bg-gray-100 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                        <span>Creating...</span>
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
