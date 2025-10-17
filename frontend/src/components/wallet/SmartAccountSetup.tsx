"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { createPublicClient, http, keccak256, toHex } from "viem";
import {
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { monadTestnet } from "../Providers/Web3Provider";
import { SmartAccountStorage } from "@/lib/storage/smartAccount";
import { isFarcasterEnvironment } from "@/lib/utils/farcaster";
import { FarcasterWalletConnector } from "./FarcasterWalletConnector";

interface SmartAccountSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onAddressCreated: (address: string) => void;
}

type AccountType = "eoa" | "passkey" | "embedded";

export const SmartAccountSetup: React.FC<SmartAccountSetupProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onAddressCreated,
}) => {
  const { address, isConnected } = useAccount();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);

  if (!isOpen) return null;

  const hasWallet = isConnected && address;

  const createSmartAccountWithEOA = async () => {
    if (!address) {
      throw new Error("No wallet connected");
    }

    // In Farcaster environment, use the connected wallet directly
    if (isFarcasterEnvironment()) {
      // Farcaster users already have a wallet connected
      console.log("Using Farcaster wallet for smart account creation");
    } else {
      // For web users, validate MetaMask provider
      let provider;
      try {
        if (typeof window === "undefined") {
          throw new Error("Window object not available");
        }

        provider = (window as any).ethereum;

        if (!provider) {
          throw new Error(
            "MetaMask not found. Please install MetaMask extension."
          );
        }

        // Check if it's actually MetaMask
        if (!provider.isMetaMask) {
          throw new Error("Please use MetaMask wallet for this feature");
        }

        // Request accounts to ensure connection
        const accounts = (await provider.request({
          method: "eth_accounts",
        })) as string[];

        if (accounts.length === 0) {
          // Try to request connection
          try {
            await provider.request({
              method: "eth_requestAccounts",
            });
          } catch {
            throw new Error("Please connect your MetaMask wallet first");
          }
        }
      } catch (err) {
        console.error("Error getting ethereum provider:", err);
        throw new Error(
          err instanceof Error ? err.message : "Failed to connect to MetaMask"
        );
      }
    }

    // Check and switch chain
    try {
      // Get provider for chain operations
      const provider = (window as any).ethereum;
      const currentChainId = (await provider.request({
        method: "eth_chainId",
      })) as string;
      const chainIdDecimal = parseInt(currentChainId, 16);

      if (chainIdDecimal !== monadTestnet.id) {
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${monadTestnet.id.toString(16)}` }],
          });

          // Wait for switch to complete
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Verify switch
          const newChainId = (await provider.request({
            method: "eth_chainId",
          })) as string;

          if (parseInt(newChainId, 16) !== monadTestnet.id) {
            throw new Error("Chain switch verification failed");
          }
        } catch (switchError: any) {
          // User rejected the request
          if (switchError.code === 4001) {
            throw new Error("Please approve the chain switch to continue");
          }

          // Chain not added to MetaMask
          if (switchError.code === 4902) {
            try {
              await provider.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: `0x${monadTestnet.id.toString(16)}`,
                    chainName: monadTestnet.name,
                    nativeCurrency: monadTestnet.nativeCurrency,
                    rpcUrls: monadTestnet.rpcUrls.default.http,
                    blockExplorerUrls: [
                      monadTestnet.blockExplorers.default.url,
                    ],
                  },
                ],
              });

              await new Promise((resolve) => setTimeout(resolve, 2000));
            } catch (addError: any) {
              if (addError.code === 4001) {
                throw new Error(
                  "Please approve adding Monad Testnet to continue"
                );
              }
              throw new Error(
                "Failed to add Monad Testnet. Please add it manually."
              );
            }
          } else {
            throw new Error(
              `Please switch to Monad Testnet (Chain ID: ${monadTestnet.id})`
            );
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("Please")) {
        throw err; // Re-throw user-friendly errors
      }
      throw new Error(
        "Failed to verify network. Please check your connection."
      );
    }

    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http("https://testnet-rpc.monad.xyz"),
    });

    const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_RPC_URL;

    if (!bundlerUrl) {
      console.warn("Bundler URL not configured - using fallback mode");
    }

    // Generate deterministic salt from owner address
    // This ensures same address always gets same smart account
    const salt = keccak256(toHex(address));

    try {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [address, [], [], []], // EOA owner, no passkeys
        deploySalt: salt, // Deterministic salt
        signer: {
          account: {
            address: address as `0x${string}`,
            async signMessage({ message }: { message: any }) {
              try {
                const ethereumProvider = (window as any).ethereum;
                const signature = await ethereumProvider.request({
                  method: "personal_sign",
                  params: [message, address],
                });
                return signature as `0x${string}`;
              } catch (signError: any) {
                if (signError.code === 4001) {
                  throw new Error(
                    "Signature request rejected. Please approve to continue."
                  );
                }
                throw new Error("Failed to sign message. Please try again.");
              }
            },
            async signTypedData(typedData: any) {
              try {
                const ethereumProvider = (window as any).ethereum;
                const signature = await ethereumProvider.request({
                  method: "eth_signTypedData_v4",
                  params: [address, JSON.stringify(typedData)],
                });
                return signature as `0x${string}`;
              } catch (signError: any) {
                if (signError.code === 4001) {
                  throw new Error(
                    "Signature request rejected. Please approve to continue."
                  );
                }
                throw new Error("Failed to sign typed data. Please try again.");
              }
            },
          },
        },
      });

      return smartAccount.address;
    } catch (err) {
      console.error("Error creating smart account:", err);
      throw new Error(
        err instanceof Error
          ? err.message
          : "Failed to create smart account. Please try again."
      );
    }
  };

  const createSmartAccountWithPasskey = async () => {
    // Check if we're in Farcaster environment - passkeys not supported
    if (isFarcasterEnvironment()) {
      throw new Error(
        "Passkey creation is not supported in Farcaster miniapp. Please use 'Create with Wallet' option."
      );
    }

    // Check if we're on localhost and adjust RP ID accordingly
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const rpId = isLocalhost ? "localhost" : window.location.hostname;

    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      throw new Error("WebAuthn is not supported on this device/browser");
    }

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: {
          name: "FiYield",
          id: rpId,
        },
        user: {
          id: crypto.getRandomValues(new Uint8Array(32)),
          name: address || `user-${Date.now()}`,
          displayName: address || "FiYield User",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256 (preferred)
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          requireResidentKey: false,
          residentKey: "preferred",
          userVerification: "preferred",
        },
        timeout: 120000,
        attestation: "none",
      },
    })) as PublicKeyCredential & {
      response: AuthenticatorAttestationResponse;
    };

    if (!credential) {
      throw new Error("Failed to create passkey");
    }

    // Extract public key from credential
    const response = credential.response as AuthenticatorAttestationResponse;
    const attestationObject = response.attestationObject;

    // Parse the attestation object to get public key coordinates
    // Note: You'll need a CBOR decoder library for this
    // Install: npm install cbor
    const CBOR = await import("cbor");
    const attestation = CBOR.decode(attestationObject);
    const authData = attestation.authData;

    // Extract public key (last 65 bytes of authData for ES256)
    // Format: 0x04 + x-coordinate (32 bytes) + y-coordinate (32 bytes)
    const publicKeyBytes = authData.slice(-65);

    if (publicKeyBytes[0] !== 0x04) {
      throw new Error("Unsupported public key format");
    }

    const xCoord = `0x${Buffer.from(publicKeyBytes.slice(1, 33)).toString(
      "hex"
    )}`;
    const yCoord = `0x${Buffer.from(publicKeyBytes.slice(33, 65)).toString(
      "hex"
    )}`;
    const credentialId = credential.id;

    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http("https://testnet-rpc.monad.xyz"),
    });

    // Create smart account with passkey
    const smartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [
        "0x0000000000000000000000000000000000000000", // No EOA owner for passkey-only accounts
        [credentialId], // passkey credential IDs
        [BigInt(xCoord)], // x coordinates
        [BigInt(yCoord)], // y coordinates
      ],
      deploySalt: "0x",
      signer: {
        account: {
          address:
            "0x0000000000000000000000000000000000000000" as `0x${string}`,
          async signMessage({ message }: { message: any }) {
            // Sign using WebAuthn
            const messageBuffer =
              typeof message === "string"
                ? new TextEncoder().encode(message)
                : message;

            const assertion = (await navigator.credentials.get({
              publicKey: {
                challenge: messageBuffer,
                rpId: rpId,
                allowCredentials: [
                  {
                    id: Buffer.from(credentialId, "base64"),
                    type: "public-key",
                  },
                ],
                userVerification: "preferred",
              },
            })) as PublicKeyCredential;

            const assertionResponse =
              assertion.response as AuthenticatorAssertionResponse;
            return `0x${Buffer.from(assertionResponse.signature).toString(
              "hex"
            )}` as `0x${string}`;
          },
          async signTypedData(typedData: any) {
            // Similar to signMessage but with typed data
            const dataHash = keccak256(
              new TextEncoder().encode(JSON.stringify(typedData))
            );
            // Use the same WebAuthn flow as signMessage
            const messageBuffer =
              typeof dataHash === "string"
                ? new TextEncoder().encode(dataHash)
                : dataHash;

            const assertion = (await navigator.credentials.get({
              publicKey: {
                challenge: messageBuffer,
                rpId: rpId,
                allowCredentials: [
                  {
                    id: Buffer.from(credentialId, "base64"),
                    type: "public-key",
                  },
                ],
                userVerification: "preferred",
              },
            })) as PublicKeyCredential;

            const assertionResponse =
              assertion.response as AuthenticatorAssertionResponse;
            return `0x${Buffer.from(assertionResponse.signature).toString(
              "hex"
            )}` as `0x${string}`;
          },
        },
      },
    });

    // Store credential ID for future use
    if (typeof window !== "undefined") {
      localStorage.setItem(`passkey_credential_id`, credentialId);
    }

    return smartAccount.address;
  };

  const createSmartAccount = async () => {
    try {
      setIsCreating(true);
      setError(null);

      let smartAccountAddress: string;

      if (selectedType === "eoa") {
        smartAccountAddress = await createSmartAccountWithEOA();
      } else {
        smartAccountAddress = await createSmartAccountWithPasskey();
      }

      // Store smart account data using the storage utility
      if (address) {
        SmartAccountStorage.save(address, {
          address: smartAccountAddress as `0x${string}`,
          type: selectedType!,
          eoaOwner: selectedType === "eoa" ? address : undefined,
          passkeyCredentialId:
            selectedType === "passkey"
              ? "placeholder-credential-id"
              : undefined,
        });
      }

      onAddressCreated(smartAccountAddress);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating smart account:", err);

      // Better error messages for common WebAuthn errors
      let errorMessage = "Failed to create smart account";

      if (err instanceof Error) {
        if (
          err.message.includes("not allowed") ||
          err.message.includes("timed out")
        ) {
          errorMessage =
            "Passkey creation was cancelled or timed out. Please try again and approve the prompt.";
        } else if (err.message.includes("NotSupportedError")) {
          errorMessage =
            "Your device/browser doesn't support passkeys. Please try using a wallet instead.";
        } else if (err.message.includes("InvalidStateError")) {
          errorMessage =
            "A passkey already exists. Please use a different method or clear existing passkeys.";
        } else if (err.message.includes("SecurityError")) {
          errorMessage =
            "Security error. Make sure you're on HTTPS or localhost.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setError(null);
      setSelectedType(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            Create Smart Account
          </h2>
          {!isCreating && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
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

        <div className="space-y-4">
          {!hasWallet ? (
            <>
              <p className="text-gray-300 text-sm mb-4">
                {isFarcasterEnvironment()
                  ? "Connect your Farcaster wallet to create a smart account:"
                  : "Connect your wallet to create a smart account:"}
              </p>
              <FarcasterWalletConnector
                onConnectionSuccess={() => {
                  // Wallet connected, refresh the component
                  window.location.reload();
                }}
                onConnectionError={(error) => {
                  setError(error);
                }}
              />
            </>
          ) : !selectedType ? (
            <>
              <p className="text-gray-300 text-sm mb-4">
                Choose how you want to create your smart account:
              </p>

              {/* Passkey Option - Hidden in Farcaster environment */}
              {!isFarcasterEnvironment() && (
                <button
                  onClick={() => setSelectedType("passkey")}
                  className="w-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border border-green-500/30 rounded-lg p-4 text-left transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">
                          Use Passkey
                        </h3>
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs">
                        Biometric authentication - no wallet needed
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
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
                    <span>Most secure • Works immediately</span>
                  </div>
                </button>
              )}

              {/* Connected External Wallet Option */}
              {hasWallet && (
                <button
                  onClick={() => setSelectedType("eoa")}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 text-left transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
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
                    <div>
                      <h3 className="text-white font-semibold">
                        Use Connected Wallet
                      </h3>
                      <p className="text-gray-400 text-xs">
                        Use your external wallet (MetaMask, etc.)
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {!isFarcasterEnvironment() ? (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-blue-400 text-xs">
                    💡 <strong>New to crypto?</strong> Use Passkey for the
                    easiest experience - no wallet needed!
                  </p>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-green-400 text-xs">
                    🎉 <strong>Welcome to FiYield!</strong> Since you&apos;re
                    using Farcaster, you already have a wallet connected.
                    Let&apos;s create your smart account!
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="bg-white/5 rounded-lg p-4 space-y-2 mb-4">
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
                  <span>Enhanced security</span>
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
                  <span>Batch transactions</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedType(null)}
                  disabled={isCreating}
                  className="flex-1 bg-white/5 text-white py-3 rounded-lg font-medium transition-all duration-300 hover:bg-white/10 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={createSmartAccount}
                  disabled={isCreating}
                  className="flex-1 bg-white text-black py-3 rounded-lg font-medium transition-all duration-300 hover:bg-white/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                {selectedType === "passkey"
                  ? "You'll be prompted to use your device's biometric authentication"
                  : "Your smart account will use your wallet as the owner"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
