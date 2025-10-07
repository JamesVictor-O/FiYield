"use client";

import React, { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createPublicClient, http } from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { Implementation, toMetaMaskSmartAccount } from "@metamask/delegation-toolkit";
import { toWebAuthnAccount } from "viem/account-abstraction";
import { monadTestnet } from "../Providers/Web3Provider";

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
  const { user, createWallet } = usePrivy();
  const { wallets } = useWallets();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  if (!isOpen) return null;

  const hasWallet = wallets.length > 0;
  const hasEmbeddedWallet = wallets.some(w => w.walletClientType === 'privy');

  // Function to create embedded wallet first
  const handleCreateEmbeddedWallet = async () => {
    try {
      setIsCreatingWallet(true);
      setError(null);
      
      // Create Privy embedded wallet
      await createWallet();
      
      // Wait for wallet to be created
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Now proceed to create smart account
      setSelectedType("embedded");
    } catch (err) {
      console.error("Error creating embedded wallet:", err);
      setError(err instanceof Error ? err.message : "Failed to create embedded wallet");
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const createSmartAccountWithEOA = async (useEmbedded: boolean = false) => {
    // If using embedded wallet option, find the embedded wallet
    const wallet = useEmbedded 
      ? wallets.find(w => w.walletClientType === 'privy') || wallets[0]
      : wallets[0];
      
    if (!wallet) {
      throw new Error("No wallet found");
    }

    console.log("Using wallet:", wallet.walletClientType);
    console.log("Switching to Monad Testnet (Chain ID: 10143)...");
    
    await wallet.switchChain(monadTestnet.id);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const provider = await wallet.getEthereumProvider();

    const currentChainId = await provider.request({ 
      method: "eth_chainId" 
    }) as string;
    const chainIdDecimal = parseInt(currentChainId, 16);
    
    console.log("Current Chain ID:", chainIdDecimal);
    
    if (chainIdDecimal !== monadTestnet.id) {
      throw new Error(
        `Please switch your wallet to Monad Testnet (Chain ID: ${monadTestnet.id}). Currently on chain ${chainIdDecimal}.`
      );
    }

    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http("https://testnet-rpc.monad.xyz"),
    });

    const [address] = await provider.request({
      method: "eth_requestAccounts",
    }) as string[];

    const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_URL;
    
    if (!bundlerUrl) {
      throw new Error(
        "NEXT_PUBLIC_BUNDLER_URL is not configured. Please set up a bundler that supports Monad Testnet (Chain ID: 10143)"
      );
    }
    
    const bundlerClient = createBundlerClient({
      client: publicClient,
      transport: http(bundlerUrl, {
        timeout: 30_000,
        retryCount: 3,
      }),
    });

    const smartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [address, [], [], []],
      deploySalt: "0x",
      signer: {
        account: {
          address: address as `0x${string}`,
          type: "json-rpc" as const,
          async signMessage({ message }) {
            const signature = await provider.request({
              method: "personal_sign",
              params: [message, address],
            });
            return signature as `0x${string}`;
          },
          async signTypedData(typedData) {
            const signature = await provider.request({
              method: "eth_signTypedData_v4",
              params: [address, JSON.stringify(typedData)],
            });
            return signature as `0x${string}`;
          },
          async signTransaction(transaction) {
            const signature = await provider.request({
              method: "eth_signTransaction",
              params: [transaction],
            });
            return signature as `0x${string}`;
          },
        },
      },
    });

    return smartAccount.address;
  };

  const createSmartAccountWithPasskey = async () => {
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http("https://testnet-rpc.monad.xyz"),
    });

    console.log("Creating passkey for Monad Testnet (Chain ID: 10143)...");

    // Check if we're on localhost and adjust RP ID accordingly
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    
    const rpId = isLocalhost ? 'localhost' : window.location.hostname;
    
    console.log("Using RP ID:", rpId);

    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      throw new Error("WebAuthn is not supported on this device/browser");
    }

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: {
          name: "NexYield",
          id: rpId, // Use correct RP ID for localhost vs production
        },
        user: {
          id: crypto.getRandomValues(new Uint8Array(32)),
          name: user?.email?.address || user?.id || `user-${Date.now()}`,
          displayName: user?.email?.address || "NexYield User",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256 (preferred)
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          // Make it more flexible - don't force platform authenticator
          authenticatorAttachment: "platform", // Can use "cross-platform" for USB keys
          requireResidentKey: false, // Changed from true for better compatibility
          residentKey: "preferred", // Changed from "required" for better compatibility
          userVerification: "preferred", // Changed from "required" for better compatibility
        },
        timeout: 120000, // Increased to 2 minutes
        attestation: "none",
      },
    }) as PublicKeyCredential & { 
      response: AuthenticatorAttestationResponse 
    };

    if (!credential) {
      throw new Error("Failed to create passkey");
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    const credentialId = credential.id;
    const attestationObject = new Uint8Array(response.attestationObject);

    const passkeyAccount = await toWebAuthnAccount({
      credential: {
        id: credentialId,
        publicKey: attestationObject,
      },
      async getFn() {
        // Use same RP ID as creation
        const isLocalhost = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';
        const rpId = isLocalhost ? 'localhost' : window.location.hostname;

        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rpId: rpId, // Use correct RP ID
            allowCredentials: [{
              id: new TextEncoder().encode(credentialId),
              type: "public-key",
            }],
            userVerification: "preferred", // Changed from "required"
            timeout: 120000, // Increased timeout
          },
        }) as PublicKeyCredential & {
          response: AuthenticatorAssertionResponse;
        };

        return {
          signature: new Uint8Array(assertion.response.signature),
          webauthn: {
            authenticatorData: new Uint8Array(assertion.response.authenticatorData),
            clientDataJSON: new Uint8Array(assertion.response.clientDataJSON),
          },
        };
      },
    });

    const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_URL;
    
    if (!bundlerUrl) {
      throw new Error("NEXT_PUBLIC_BUNDLER_URL is not configured");
    }

    const bundlerClient = createBundlerClient({
      client: publicClient,
      transport: http(bundlerUrl, {
        timeout: 30_000,
        retryCount: 3,
      }),
    });

    const smartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [
        "0x0000000000000000000000000000000000000000",
        [passkeyAccount.address],
        [],
        [],
      ],
      deploySalt: "0x",
      signer: passkeyAccount,
    });

    if (typeof window !== 'undefined' && user?.id) {
      localStorage.setItem(`passkey_credential_${user.id}`, credentialId);
    }

    return smartAccount.address;
  };

  const createSmartAccount = async () => {
    try {
      setIsCreating(true);
      setError(null);

      let smartAccountAddress: string;

      if (selectedType === "eoa") {
        smartAccountAddress = await createSmartAccountWithEOA(false);
      } else if (selectedType === "embedded") {
        smartAccountAddress = await createSmartAccountWithEOA(true);
      } else {
        smartAccountAddress = await createSmartAccountWithPasskey();
      }

      if (typeof window !== 'undefined' && user?.id) {
        localStorage.setItem(`smart_account_${user.id}`, smartAccountAddress);
        localStorage.setItem(`smart_account_type_${user.id}`, selectedType!);
      }

      onAddressCreated(smartAccountAddress);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating smart account:", err);
      
      // Better error messages for common WebAuthn errors
      let errorMessage = "Failed to create smart account";
      
      if (err instanceof Error) {
        if (err.message.includes("not allowed") || err.message.includes("timed out")) {
          errorMessage = "Passkey creation was cancelled or timed out. Please try again and approve the prompt.";
        } else if (err.message.includes("NotSupportedError")) {
          errorMessage = "Your device/browser doesn't support passkeys. Please try using a wallet instead.";
        } else if (err.message.includes("InvalidStateError")) {
          errorMessage = "A passkey already exists. Please use a different method or clear existing passkeys.";
        } else if (err.message.includes("SecurityError")) {
          errorMessage = "Security error. Make sure you're on HTTPS or localhost.";
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
    if (!isCreating && !isCreatingWallet) {
      setError(null);
      setSelectedType(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create Smart Account</h2>
          {!isCreating && !isCreatingWallet && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="space-y-4">
          {!selectedType ? (
            <>
              <p className="text-gray-300 text-sm mb-4">
                Choose how you want to create your smart account:
              </p>

              {/* Passkey Option - Always available and recommended */}
              <button
                onClick={() => setSelectedType("passkey")}
                className="w-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border border-green-500/30 rounded-lg p-4 text-left transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">Use Passkey</h3>
                      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">Recommended</span>
                    </div>
                    <p className="text-gray-400 text-xs">Biometric authentication - no wallet needed</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Most secure • Works immediately</span>
                </div>
              </button>

              {/* Connected External Wallet Option */}
              {hasWallet && !hasEmbeddedWallet && (
                <button
                  onClick={() => setSelectedType("eoa")}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 text-left transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Use Connected Wallet</h3>
                      <p className="text-gray-400 text-xs">Use your external wallet (MetaMask, etc.)</p>
                    </div>
                  </div>
                </button>
              )}

              {/* Embedded Wallet Option - Create if doesn't exist */}
              {!hasEmbeddedWallet ? (
                <button
                  onClick={handleCreateEmbeddedWallet}
                  disabled={isCreatingWallet}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 text-left transition-all duration-300 disabled:opacity-50"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">Create Embedded Wallet</h3>
                      <p className="text-gray-400 text-xs">
                        {isCreatingWallet ? "Creating wallet..." : "Create a wallet managed by Privy"}
                      </p>
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setSelectedType("embedded")}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 text-left transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Use Embedded Wallet</h3>
                      <p className="text-gray-400 text-xs">Use your Privy-managed wallet</p>
                    </div>
                  </div>
                </button>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-400 text-xs">
                  💡 <strong>New to crypto?</strong> Use Passkey for the easiest experience - no wallet needed!
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white/5 rounded-lg p-4 space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Gasless transactions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Enhanced security</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
                  : "Your smart account will use your wallet as the owner"
                }
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};