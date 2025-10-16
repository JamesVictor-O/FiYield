"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import MainDashboard from "@/components/dashboard/main-dashboard";
import { User } from "@/types/index";
import { useUserOnboarding } from "@/hooks/useUserOnboarding";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<User | null>(null);

  // Use the onboarding hook to manage user state properly
  const {
    isNewUser,
    riskProfile,
    isLoading: isOnboardingLoading,
    markOnboardingComplete,
  } = useUserOnboarding();

  const getDisplayAddress = (): string | undefined => {
    if (!address) return undefined;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const displayAddress = getDisplayAddress();

  useEffect(() => {
    if (isConnected && address) {
      const newUser: User = {
        address: displayAddress || "",
        balance: 0,
        isNewUser: isNewUser,
        riskProfile: riskProfile || "moderate",
      };
      setUser(newUser);
    } else {
      setUser(null);
    }
  }, [isConnected, address, displayAddress, isNewUser, riskProfile]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#101110] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white font-pop mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to access your DeFi dashboard and start earning
            yields.
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (!user || isOnboardingLoading) {
    return (
      <div className="min-h-screen bg-[#101110] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-6 animate-pulse"></div>
          <h2 className="text-xl font-bold text-white font-pop mb-4">
            Loading Dashboard
          </h2>
          <p className="text-gray-400">
            {isOnboardingLoading
              ? "Checking your profile..."
              : "Loading your profile..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#101110] min-h-screen">
      <MainDashboard
        user={user}
        onOnboardingComplete={markOnboardingComplete}
      />
    </div>
  );
}
