"use client";

import React, { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

interface FarcasterWalletConnectorProps {
  onConnectionSuccess: () => void;
  onConnectionError: (error: string) => void;
}

export function FarcasterWalletConnector({
  onConnectionSuccess,
  onConnectionError,
}: FarcasterWalletConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { connect } = useConnect();
  const { isConnected } = useAccount();

  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      // In Farcaster environment, try to connect to the embedded wallet
      if (typeof window !== "undefined" && (window as any).ethereum) {
        // Request connection to the embedded wallet
        await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });

        // Connect using wagmi
        connect({
          connector: injected(),
        });

        onConnectionSuccess();
      } else {
        throw new Error("No wallet provider found in Farcaster environment");
      }
    } catch (error) {
      console.error("Farcaster wallet connection error:", error);
      onConnectionError(
        error instanceof Error
          ? error.message
          : "Failed to connect to Farcaster wallet"
      );
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnected) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-400 text-sm">
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
          Wallet Connected Successfully!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/30 rounded-lg p-4 text-left transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-purple-400"
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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold">
                {isConnecting ? "Connecting..." : "Connect Farcaster Wallet"}
              </h3>
              <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full">
                Farcaster
              </span>
            </div>
            <p className="text-gray-400 text-xs">
              Use your Farcaster embedded wallet
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-purple-400">
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
          <span>Secure • Integrated • Ready to use</span>
        </div>
      </button>

      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
        <p className="text-purple-400 text-xs">
          🔗 <strong>Farcaster Integration:</strong> Your wallet is already
          connected through Farcaster. Click to activate it for smart account
          creation.
        </p>
      </div>
    </div>
  );
}
